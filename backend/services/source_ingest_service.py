from __future__ import annotations

from models.ops import ConnectionCreateRequestSchema
from models.workspace import (
    OnboardingConnectSourceRequestSchema,
    OnboardingResponseSchema,
    SourceSyncResponseSchema,
)
from integrations.ticket_sources import NormalizedTicket, account_label, credentials_payload, verify_and_list
from services.connection_service import add_connection
from services.context import Actor, Repos, iso
from services.ticket_service import ingest_source
from services.workspace_service import get_onboarding, to_onboarding
from core.errors import bad_request, not_found
from core.ids import utcnow


async def _import_tickets(
    repos: Repos, actor: Actor, provider: str, tickets: list[NormalizedTicket]
) -> tuple[int, int]:
    imported = 0
    skipped = 0
    for item in tickets:
        if not item.subject and not item.body:
            skipped += 1
            continue
        _, duplicate = await ingest_source(
            repos,
            actor,
            provider=provider,
            subject=item.subject,
            body=item.body,
            customer_name=item.customer_name,
            customer_email=item.customer_email,
            customer_plan=None,
            external_id=item.external_id or None,
            internal_notes=f"Imported from {provider}",
        )
        if duplicate:
            skipped += 1
        else:
            imported += 1
    return imported, skipped


async def connect_and_import(
    repos: Repos, actor: Actor, body: OnboardingConnectSourceRequestSchema
) -> OnboardingResponseSchema:
    creds = credentials_payload(body)
    tickets = await verify_and_list(body.provider, creds)
    label = account_label(body.provider, creds, body.account_label)
    await add_connection(
        repos,
        actor,
        "source",
        ConnectionCreateRequestSchema(
            provider=body.provider,
            name=label,
            api_key=body.api_key,
            domain=body.domain,
            email=body.email,
            password=body.password,
            imap_host=body.imap_host,
            spreadsheet_id=body.spreadsheet_id,
            sheet_name=body.sheet_name,
            instance_url=body.instance_url,
            client_id=body.client_id,
            client_secret=body.client_secret,
            security_token=body.security_token,
        ),
        credentials=creds,
    )
    imported, _skipped = await _import_tickets(repos, actor, body.provider, tickets)
    doc = await repos.onboarding.find_one({"workspace_id": actor.workspace_id})
    if not doc:
        await get_onboarding(repos, actor)
        doc = await repos.onboarding.find_one({"workspace_id": actor.workspace_id})
    sources = [s for s in (doc.get("ticket_sources") or []) if s.get("provider") != body.provider]
    sources.append(
        {
            "provider": body.provider,
            "status": "connected",
            "issue_categories": ["bug", "how_to"],
            "account_label": label,
            "connected_at": iso(utcnow()),
            "last_imported": imported,
        }
    )
    updated = await repos.onboarding.update_by_id(doc["_id"], {"ticket_sources": sources, "updated_at": utcnow()})
    conn = await repos.connections.find_one(
        {"workspace_id": actor.workspace_id, "type": "source", "provider": body.provider}
    )
    if conn:
        await repos.connections.update_by_id(conn["_id"], {"ticket_count": imported, "name": label})
    return to_onboarding(updated or doc)


async def sync_source(repos: Repos, actor: Actor, provider: str) -> SourceSyncResponseSchema:
    conn = await repos.connections.find_one(
        {"workspace_id": actor.workspace_id, "type": "source", "provider": provider}
    )
    if not conn:
        raise not_found("Connect this source first")
    creds = conn.get("credentials") or {}
    if not isinstance(creds, dict):
        creds = {}
    if provider != "webhook" and not creds:
        raise bad_request("This source has no stored credentials. Disconnect and connect again.")
    tickets = await verify_and_list(provider, {k: str(v) for k, v in creds.items() if v})
    imported, skipped = await _import_tickets(repos, actor, provider, tickets)
    doc = await repos.onboarding.find_one({"workspace_id": actor.workspace_id})
    if doc:
        sources = []
        for source in doc.get("ticket_sources") or []:
            if source.get("provider") == provider:
                source = {**source, "last_imported": imported, "status": "connected"}
            sources.append(source)
        await repos.onboarding.update_by_id(doc["_id"], {"ticket_sources": sources, "updated_at": utcnow()})
    await repos.connections.update_by_id(conn["_id"], {"ticket_count": (conn.get("ticket_count") or 0) + imported})
    return SourceSyncResponseSchema(provider=provider, imported=imported, skipped=skipped)
