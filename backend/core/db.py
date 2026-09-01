from __future__ import annotations

from collections.abc import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from core.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_db_name]


async def get_database() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    yield get_db()


async def ensure_indexes() -> None:
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.auth_tokens.create_index("token_hash")
    await db.auth_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.workspaces.create_index("slug")
    await db.workspace_members.create_index([("workspace_id", 1), ("user_id", 1)], unique=True)
    await db.tickets.create_index([("workspace_id", 1), ("status", 1)])
    await db.tickets.create_index([("workspace_id", 1), ("source", 1), ("original_ticket_id", 1)])
    await db.activity.create_index([("workspace_id", 1), ("timestamp", -1)])
    await db.clusters.create_index("workspace_id")
    await db.pipeline_cards.create_index([("workspace_id", 1), ("ticket_id", 1)], unique=True)
    await db.connections.create_index([("workspace_id", 1), ("type", 1), ("provider", 1)])
    await db.repos.create_index([("workspace_id", 1), ("full_name", 1)], unique=True)
    await db.product_docs.create_index("workspace_id")
    await db.automation.create_index("workspace_id", unique=True)
    await db.delivery_configs.create_index("workspace_id", unique=True)
    await db.delivery_records.create_index([("workspace_id", 1), ("ticket_id", 1)])
    await db.dispatch_configs.create_index("workspace_id", unique=True)
    await db.dispatch_records.create_index([("workspace_id", 1), ("ticket_id", 1)])
    await db.chat_sessions.create_index([("workspace_id", 1), ("updated_at", -1)])
    await db.chat_messages.create_index([("session_id", 1), ("timestamp", 1)])
    await db.alerts.create_index("workspace_id")
    await db.audit_logs.create_index([("workspace_id", 1), ("timestamp", -1)])
    await db.onboarding.create_index("workspace_id", unique=True)
    await db.code_chunks.create_index([("workspace_id", 1), ("repo_id", 1)])


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
