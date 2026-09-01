from __future__ import annotations

import asyncio
import csv
import email
import imaplib
from dataclasses import dataclass
from email.header import decode_header
from email.message import Message
from io import StringIO
from typing import Any
from urllib.parse import quote

import httpx

from core.errors import bad_request

TIMEOUT = 20.0
MAX_ITEMS = 12


@dataclass(frozen=True)
class NormalizedTicket:
    external_id: str
    subject: str
    body: str
    customer_name: str
    customer_email: str


def credentials_payload(body: Any) -> dict[str, str]:
    data = body.model_dump() if hasattr(body, "model_dump") else dict(body)
    keys = (
        "domain",
        "api_key",
        "email",
        "password",
        "imap_host",
        "spreadsheet_id",
        "sheet_name",
        "instance_url",
        "client_id",
        "client_secret",
        "security_token",
    )
    return {key: str(data[key]).strip() for key in keys if data.get(key)}


def account_label(provider: str, creds: dict[str, str], fallback: str | None) -> str:
    if fallback:
        return fallback
    if provider == "email":
        return creds.get("email") or "IMAP inbox"
    if provider == "sheets":
        return creds.get("spreadsheet_id") or "Google Sheet"
    if provider == "webhook":
        return "Custom HTTP endpoint"
    return creds.get("domain") or creds.get("instance_url") or creds.get("email") or provider


def _text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        if value.get("type") == "text":
            return str(value.get("text") or "")
        chunks = [_text(child) for child in (value.get("content") or [])]
        return "\n".join(part for part in chunks if part).strip()
    if isinstance(value, list):
        return "\n".join(part for part in (_text(item) for item in value) if part).strip()
    return str(value).strip()


def _host(domain: str, suffix: str) -> str:
    cleaned = domain.strip().removeprefix("https://").removeprefix("http://").split("/")[0]
    if cleaned.endswith(suffix) or "." in cleaned:
        return cleaned
    return f"{cleaned}{suffix}"


async def verify_and_list(provider: str, creds: dict[str, str]) -> list[NormalizedTicket]:
    if provider == "webhook":
        return []
    if provider == "freshdesk":
        return await _freshdesk(creds)
    if provider == "zendesk":
        return await _zendesk(creds)
    if provider == "jira_sm":
        return await _jira(creds)
    if provider == "salesforce":
        return await _salesforce(creds)
    if provider == "sheets":
        return await _sheets(creds)
    if provider == "email":
        return await asyncio.to_thread(_imap, creds)
    raise bad_request(f"Unknown ticket source '{provider}'")


def parse_vendor_payload(provider: str, payload: dict[str, Any]) -> NormalizedTicket | None:
    if provider == "freshdesk":
        ticket = payload.get("freshdesk_webhook") or payload.get("ticket") or payload
        requester = ticket.get("requester") if isinstance(ticket.get("requester"), dict) else payload.get("requester") or {}
        return NormalizedTicket(
            external_id=str(ticket.get("id") or payload.get("id") or ""),
            subject=_text(ticket.get("subject") or payload.get("subject") or "Freshdesk ticket"),
            body=_text(ticket.get("description_text") or ticket.get("description") or payload.get("body")),
            customer_name=_text(requester.get("name") or ticket.get("requester_name") or "Customer"),
            customer_email=_text(requester.get("email") or ticket.get("requester_email") or "customer@example.com"),
        )
    if provider == "zendesk":
        ticket = payload.get("ticket") or payload
        requester = ticket.get("requester") if isinstance(ticket.get("requester"), dict) else {}
        return NormalizedTicket(
            external_id=str(ticket.get("id") or payload.get("id") or ""),
            subject=_text(ticket.get("title") or ticket.get("subject") or "Zendesk ticket"),
            body=_text(ticket.get("description") or ticket.get("latest_comment") or payload.get("body")),
            customer_name=_text(requester.get("name") or ticket.get("requester_name") or "Customer"),
            customer_email=_text(requester.get("email") or ticket.get("requester_email") or "customer@example.com"),
        )
    if provider == "jira_sm":
        issue = payload.get("issue") or payload
        fields = issue.get("fields") if isinstance(issue.get("fields"), dict) else issue
        reporter = fields.get("reporter") if isinstance(fields.get("reporter"), dict) else {}
        return NormalizedTicket(
            external_id=str(issue.get("key") or issue.get("id") or ""),
            subject=_text(fields.get("summary") or "Jira request"),
            body=_text(fields.get("description") or payload.get("body")),
            customer_name=_text(reporter.get("displayName") or "Customer"),
            customer_email=_text(reporter.get("emailAddress") or "customer@example.com"),
        )
    if provider == "salesforce":
        record = payload.get("sobject") or payload.get("new") or payload
        return NormalizedTicket(
            external_id=str(record.get("Id") or record.get("id") or ""),
            subject=_text(record.get("Subject") or record.get("subject") or "Salesforce case"),
            body=_text(record.get("Description") or record.get("description")),
            customer_name=_text(record.get("SuppliedName") or record.get("Name") or "Customer"),
            customer_email=_text(record.get("SuppliedEmail") or record.get("Email") or "customer@example.com"),
        )
    if provider == "email":
        sender = _text(payload.get("from") or payload.get("sender_email") or "customer@example.com")
        return NormalizedTicket(
            external_id=_text(payload.get("message_id") or payload.get("Message-Id") or payload.get("subject")),
            subject=_text(payload.get("subject") or payload.get("Subject") or "Support email"),
            body=_text(payload.get("text") or payload.get("html") or payload.get("body") or payload.get("stripped-text")),
            customer_name=_text(payload.get("from_name") or payload.get("sender") or "Customer"),
            customer_email=sender.split("<")[-1].rstrip(">").strip(),
        )
    return None


async def _freshdesk(creds: dict[str, str]) -> list[NormalizedTicket]:
    domain = creds.get("domain")
    api_key = creds.get("api_key")
    if not domain or not api_key:
        raise bad_request("Freshdesk needs a domain and API key")
    host = _host(domain, ".freshdesk.com")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.get(
            f"https://{host}/api/v2/tickets",
            params={"per_page": MAX_ITEMS, "order_by": "created_at", "order_type": "desc"},
            auth=(api_key, "X"),
        )
    if response.status_code >= 400:
        raise bad_request("Freshdesk rejected those credentials. Check the domain and API key.")
    payload = response.json()
    items = payload if isinstance(payload, list) else []
    tickets: list[NormalizedTicket] = []
    for item in items[:MAX_ITEMS]:
        tickets.append(
            NormalizedTicket(
                external_id=str(item.get("id") or ""),
                subject=_text(item.get("subject") or "Freshdesk ticket"),
                body=_text(item.get("description_text") or item.get("description")),
                customer_name=_text(item.get("requester_name") or "Customer"),
                customer_email=_text(item.get("requester_email") or "customer@example.com"),
            )
        )
    return tickets


async def _zendesk(creds: dict[str, str]) -> list[NormalizedTicket]:
    domain = creds.get("domain")
    email = creds.get("email")
    api_key = creds.get("api_key")
    if not domain or not email or not api_key:
        raise bad_request("Zendesk needs a subdomain, agent email, and API token")
    host = _host(domain, ".zendesk.com")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.get(
            f"https://{host}/api/v2/tickets.json",
            params={"per_page": MAX_ITEMS, "sort_by": "created_at", "sort_order": "desc"},
            auth=(f"{email}/token", api_key),
        )
    if response.status_code >= 400:
        raise bad_request("Zendesk rejected those credentials. Check subdomain, email, and API token.")
    payload = response.json()
    items = payload.get("tickets") if isinstance(payload, dict) else []
    tickets: list[NormalizedTicket] = []
    for item in (items or [])[:MAX_ITEMS]:
        tickets.append(
            NormalizedTicket(
                external_id=str(item.get("id") or ""),
                subject=_text(item.get("subject") or "Zendesk ticket"),
                body=_text(item.get("description")),
                customer_name="Customer",
                customer_email="customer@example.com",
            )
        )
    return tickets


async def _jira(creds: dict[str, str]) -> list[NormalizedTicket]:
    domain = creds.get("domain")
    email = creds.get("email")
    api_key = creds.get("api_key")
    if not domain or not email or not api_key:
        raise bad_request("Jira Service Management needs your Atlassian site, email, and API token")
    host = _host(domain, ".atlassian.net")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.get(
            f"https://{host}/rest/api/3/search/jql",
            params={
                "jql": "created >= -60d ORDER BY created DESC",
                "maxResults": MAX_ITEMS,
                "fields": "summary,description,reporter",
            },
            auth=(email, api_key),
        )
        if response.status_code >= 400:
            response = await client.get(
                f"https://{host}/rest/api/3/search",
                params={
                    "jql": "created >= -60d ORDER BY created DESC",
                    "maxResults": MAX_ITEMS,
                    "fields": "summary,description,reporter",
                },
                auth=(email, api_key),
            )
    if response.status_code >= 400:
        raise bad_request("Jira rejected those credentials. Check the site URL, email, and API token.")
    payload = response.json()
    issues = payload.get("issues") if isinstance(payload, dict) else []
    tickets: list[NormalizedTicket] = []
    for issue in (issues or [])[:MAX_ITEMS]:
        fields = issue.get("fields") or {}
        reporter = fields.get("reporter") or {}
        tickets.append(
            NormalizedTicket(
                external_id=str(issue.get("key") or issue.get("id") or ""),
                subject=_text(fields.get("summary") or "Jira request"),
                body=_text(fields.get("description")),
                customer_name=_text(reporter.get("displayName") or "Customer"),
                customer_email=_text(reporter.get("emailAddress") or "customer@example.com"),
            )
        )
    return tickets


async def _salesforce(creds: dict[str, str]) -> list[NormalizedTicket]:
    username = creds.get("email")
    password = creds.get("password")
    client_id = creds.get("client_id")
    client_secret = creds.get("client_secret")
    token = creds.get("security_token") or ""
    if not username or not password or not client_id or not client_secret:
        raise bad_request("Salesforce needs username, password, security token, consumer key, and consumer secret")
    instance = (creds.get("instance_url") or "https://login.salesforce.com").rstrip("/")
    if "test.salesforce.com" in instance:
        login = "https://test.salesforce.com"
    else:
        login = "https://login.salesforce.com"
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        token_res = await client.post(
            f"{login}/services/oauth2/token",
            data={
                "grant_type": "password",
                "client_id": client_id,
                "client_secret": client_secret,
                "username": username,
                "password": f"{password}{token}",
            },
        )
        if token_res.status_code >= 400:
            raise bad_request(
                "Salesforce login failed. Check Connected App credentials and enable username-password flow."
            )
        auth = token_res.json()
        access = auth.get("access_token")
        api_host = str(auth.get("instance_url") or instance).rstrip("/")
        query = quote(
            "SELECT Id, Subject, Description, SuppliedName, SuppliedEmail FROM Case ORDER BY CreatedDate DESC LIMIT 12"
        )
        cases = await client.get(
            f"{api_host}/services/data/v59.0/query?q={query}",
            headers={"Authorization": f"Bearer {access}"},
        )
    if cases.status_code >= 400:
        raise bad_request("Salesforce accepted login but could not read Cases. Grant API access to the Connected App.")
    records = (cases.json() or {}).get("records") or []
    tickets: list[NormalizedTicket] = []
    for record in records[:MAX_ITEMS]:
        tickets.append(
            NormalizedTicket(
                external_id=str(record.get("Id") or ""),
                subject=_text(record.get("Subject") or "Salesforce case"),
                body=_text(record.get("Description")),
                customer_name=_text(record.get("SuppliedName") or "Customer"),
                customer_email=_text(record.get("SuppliedEmail") or "customer@example.com"),
            )
        )
    return tickets


async def _sheets(creds: dict[str, str]) -> list[NormalizedTicket]:
    sheet_id = creds.get("spreadsheet_id")
    if not sheet_id:
        raise bad_request("Google Sheets needs a spreadsheet ID from the sheet URL")
    sheet_name = creds.get("sheet_name") or "Sheet1"
    api_key = creds.get("api_key")
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        if api_key:
            response = await client.get(
                f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{quote(sheet_name)}!A1:D50",
                params={"key": api_key},
            )
            if response.status_code >= 400:
                raise bad_request("Google Sheets API rejected the request. Share the sheet or check the API key.")
            rows = (response.json() or {}).get("values") or []
        else:
            response = await client.get(
                f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq",
                params={"tqx": "out:csv", "sheet": sheet_name},
            )
            if response.status_code >= 400 or "text/html" in response.headers.get("content-type", ""):
                raise bad_request(
                    "Could not read the sheet. Make it 'Anyone with the link can view', or paste a Google API key."
                )
            rows = list(csv.reader(StringIO(response.text)))
    if not rows:
        return []
    return _rows_to_tickets(rows)


def _rows_to_tickets(rows: list[list[str]]) -> list[NormalizedTicket]:
    header = [cell.strip().lower() for cell in rows[0]]
    data_rows = rows[1:] if any(header) else rows

    def col(*names: str) -> int | None:
        for name in names:
            if name in header:
                return header.index(name)
        return None

    subject_i = col("subject", "title", "request", "ticket")
    body_i = col("body", "description", "details", "message")
    name_i = col("name", "customer", "customer name", "requester")
    email_i = col("email", "customer email", "requester email")
    tickets: list[NormalizedTicket] = []
    for index, row in enumerate(data_rows[:MAX_ITEMS], start=2):
        def at(pos: int | None, fallback: int) -> str:
            if pos is not None and pos < len(row):
                return row[pos].strip()
            if fallback < len(row):
                return row[fallback].strip()
            return ""

        subject = at(subject_i, 0) or f"Sheet row {index}"
        body = at(body_i, 1)
        if not subject and not body:
            continue
        tickets.append(
            NormalizedTicket(
                external_id=f"row-{index}",
                subject=subject,
                body=body or subject,
                customer_name=at(name_i, 2) or "Customer",
                customer_email=at(email_i, 3) or "customer@example.com",
            )
        )
    return tickets


def _decode_mime(value: str | None) -> str:
    if not value:
        return ""
    parts = []
    for text, charset in decode_header(value):
        if isinstance(text, bytes):
            parts.append(text.decode(charset or "utf-8", errors="replace"))
        else:
            parts.append(text)
    return " ".join(parts).strip()


def _body_from_message(message: Message) -> str:
    if message.is_multipart():
        for part in message.walk():
            if part.get_content_type() == "text/plain" and not part.get_filename():
                payload = part.get_payload(decode=True)
                if isinstance(payload, bytes):
                    return payload.decode(part.get_content_charset() or "utf-8", errors="replace").strip()
        return ""
    payload = message.get_payload(decode=True)
    if isinstance(payload, bytes):
        return payload.decode(message.get_content_charset() or "utf-8", errors="replace").strip()
    return _text(message.get_payload())


def _imap(creds: dict[str, str]) -> list[NormalizedTicket]:
    address = creds.get("email")
    password = creds.get("password")
    host = creds.get("imap_host") or "imap.gmail.com"
    if not address or not password:
        raise bad_request("Email needs the inbox address and an app password")
    try:
        mailbox = imaplib.IMAP4_SSL(host)
        mailbox.login(address, password)
        mailbox.select("INBOX")
        _, data = mailbox.search(None, "ALL")
        ids = (data[0].split() if data and data[0] else [])[-MAX_ITEMS:]
        tickets: list[NormalizedTicket] = []
        for msg_id in reversed(ids):
            _, payload = mailbox.fetch(msg_id, "(RFC822)")
            if not payload or not payload[0]:
                continue
            raw = payload[0][1]
            if not isinstance(raw, bytes):
                continue
            message = email.message_from_bytes(raw)
            sender = _decode_mime(message.get("From"))
            sender_email = sender.split("<")[-1].rstrip(">").strip() if "<" in sender else sender
            sender_name = sender.split("<")[0].strip().strip('"') or "Customer"
            tickets.append(
                NormalizedTicket(
                    external_id=_decode_mime(message.get("Message-ID")) or msg_id.decode(),
                    subject=_decode_mime(message.get("Subject")) or "Support email",
                    body=_body_from_message(message) or "No body",
                    customer_name=sender_name,
                    customer_email=sender_email or "customer@example.com",
                )
            )
        mailbox.logout()
        return tickets
    except imaplib.IMAP4.error as exc:
        raise bad_request("IMAP login failed. For Gmail use an App Password, not your normal password.") from exc
    except OSError as exc:
        raise bad_request(f"Could not reach IMAP host {host}.") from exc
