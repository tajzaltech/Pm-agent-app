from __future__ import annotations

import asyncio
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Protocol

import httpx

from core.config import settings

# Settings reads RESEND_API_KEY from backend/.env
OUTBOX_DIR = Path(__file__).resolve().parent.parent / "var" / "outbox"


class EmailClient(Protocol):
    async def send_email(self, *, to: str, subject: str, body: str) -> None: ...
    def configured(self) -> bool: ...


class EmailIntegration:
    """Resend, SMTP, or a local outbox in development. COMPLIANCE: do not log recipient or body."""

    def configured(self) -> bool:
        return settings.email_configured

    async def send_email(self, *, to: str, subject: str, body: str) -> None:
        if settings.resend_api_key:
            await self._send_resend(to=to, subject=subject, body=body)
            return
        if settings.smtp_host:
            await asyncio.to_thread(self._send_smtp, to, subject, body)
            return
        if settings.is_production:
            return
        await asyncio.to_thread(self._write_outbox, to, subject, body)

    async def _send_resend(self, *, to: str, subject: str, body: str) -> None:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.smtp_from,
                    "to": [to],
                    "subject": subject,
                    "text": body,
                },
            )
            response.raise_for_status()

    def _send_smtp(self, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = settings.smtp_from
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)

    def _write_outbox(self, to: str, subject: str, body: str) -> None:
        OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        path = OUTBOX_DIR / f"{stamp}.txt"
        path.write_text(f"To: {to}\nSubject: {subject}\n\n{body}\n", encoding="utf-8")


class LlmClient:
    def configured(self) -> bool:
        return bool(settings.llm_base_url and settings.llm_api_key)

    async def complete(self, *, system: str, user: str) -> str | None:
        if not self.configured():
            return None
        headers = {"Authorization": f"Bearer {settings.llm_api_key}", "Content-Type": "application/json"}
        payload: dict[str, Any] = {
            "model": settings.llm_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{settings.llm_base_url.rstrip('/')}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception:
            return None

    async def embed(self, text: str) -> list[float] | None:
        vectors = await self.embed_many([text])
        return vectors[0] if vectors else None

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        if not self.configured() or not texts:
            return []
        headers = {"Authorization": f"Bearer {settings.llm_api_key}", "Content-Type": "application/json"}
        payload = {"model": settings.llm_embed_model, "input": [item[:8000] for item in texts]}
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.llm_base_url.rstrip('/')}/embeddings",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except Exception:
            return []
        items = sorted(data.get("data") or [], key=lambda row: row.get("index", 0))
        return [row["embedding"] for row in items]


email_client = EmailIntegration()
llm_client = LlmClient()
