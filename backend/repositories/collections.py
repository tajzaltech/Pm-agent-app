from __future__ import annotations

from typing import Any

from repositories.base import BaseRepository


class UserRepository(BaseRepository):
    collection_name = "users"

    async def find_by_email(self, email: str) -> dict[str, Any] | None:
        return await self.find_one({"email": email.lower()})


class AuthTokenRepository(BaseRepository):
    collection_name = "auth_tokens"

    async def find_active(self, *, user_id: str, kind: str) -> list[dict[str, Any]]:
        return await self.find_many({"user_id": user_id, "kind": kind, "used_at": None})


class WorkspaceRepository(BaseRepository):
    collection_name = "workspaces"


class MemberRepository(BaseRepository):
    collection_name = "workspace_members"

    async def find_membership(self, workspace_id: str, user_id: str) -> dict[str, Any] | None:
        return await self.find_one({"workspace_id": workspace_id, "user_id": user_id})

    async def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        return await self.find_many({"user_id": user_id})

    async def list_for_workspace(self, workspace_id: str) -> list[dict[str, Any]]:
        return await self.find_many({"workspace_id": workspace_id})


class TicketRepository(BaseRepository):
    collection_name = "tickets"

    async def list_workspace(self, workspace_id: str, query: dict | None = None) -> list[dict[str, Any]]:
        q = {"workspace_id": workspace_id, **(query or {})}
        return await self.find_many(q, sort=[("created_at", -1)], limit=500)

    async def find_duplicate(self, workspace_id: str, source: str, original_ticket_id: str) -> dict[str, Any] | None:
        return await self.find_one(
            {
                "workspace_id": workspace_id,
                "source": source,
                "original_ticket_id": original_ticket_id,
            }
        )


class ActivityRepository(BaseRepository):
    collection_name = "activity"

    async def list_workspace(self, workspace_id: str) -> list[dict[str, Any]]:
        return await self.find_many({"workspace_id": workspace_id}, sort=[("timestamp", -1)], limit=200)


class ClusterRepository(BaseRepository):
    collection_name = "clusters"

    async def replace_workspace(self, workspace_id: str, docs: list[dict[str, Any]]) -> None:
        await self.delete_many({"workspace_id": workspace_id})
        if docs:
            await self.col.insert_many(docs)


class PipelineRepository(BaseRepository):
    collection_name = "pipeline_cards"

    async def find_by_ticket(self, workspace_id: str, ticket_id: str) -> dict[str, Any] | None:
        return await self.find_one({"workspace_id": workspace_id, "ticket_id": ticket_id})


class ConnectionRepository(BaseRepository):
    collection_name = "connections"


class RepoRepository(BaseRepository):
    collection_name = "repos"


class ProductDocRepository(BaseRepository):
    collection_name = "product_docs"


class AutomationRepository(BaseRepository):
    collection_name = "automation"


class DeliveryConfigRepository(BaseRepository):
    collection_name = "delivery_configs"


class DeliveryRecordRepository(BaseRepository):
    collection_name = "delivery_records"


class DispatchConfigRepository(BaseRepository):
    collection_name = "dispatch_configs"


class DispatchRecordRepository(BaseRepository):
    collection_name = "dispatch_records"


class ChatSessionRepository(BaseRepository):
    collection_name = "chat_sessions"


class ChatMessageRepository(BaseRepository):
    collection_name = "chat_messages"

    async def list_session(self, session_id: str) -> list[dict[str, Any]]:
        return await self.find_many({"session_id": session_id}, sort=[("timestamp", 1)], limit=500)


class AlertRepository(BaseRepository):
    collection_name = "alerts"


class AuditRepository(BaseRepository):
    collection_name = "audit_logs"


class OnboardingRepository(BaseRepository):
    collection_name = "onboarding"


class CodeChunkRepository(BaseRepository):
    collection_name = "code_chunks"
