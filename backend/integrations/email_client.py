from __future__ import annotations

from typing import Any, Protocol

import httpx

from core.config import settings


class EmailClient(Protocol):
    async def send_email(self, *, to: str, subject: str, body: str) -> None: ...


class EmailIntegration:
    """Outbound email. No-ops when no provider is configured. COMPLIANCE: do not log recipient or body."""

    async def send_email(self, *, to: str, subject: str, body: str) -> None:
        if not settings.llm_base_url:
            return
        # Provider wiring is intentionally left to env-backed integrations.
        return


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
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{settings.llm_base_url.rstrip('/')}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        return data["choices"][0]["message"]["content"]

    async def embed(self, text: str) -> list[float] | None:
        vectors = await self.embed_many([text])
        return vectors[0] if vectors else None

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        if not self.configured() or not texts:
            return []
        headers = {"Authorization": f"Bearer {settings.llm_api_key}", "Content-Type": "application/json"}
        payload = {"model": settings.llm_embed_model, "input": [item[:8000] for item in texts]}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.llm_base_url.rstrip('/')}/embeddings",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        items = sorted(data.get("data") or [], key=lambda row: row.get("index", 0))
        return [row["embedding"] for row in items]


email_client = EmailIntegration()
llm_client = LlmClient()
