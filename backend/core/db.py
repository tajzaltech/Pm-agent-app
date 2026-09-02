from __future__ import annotations

from collections.abc import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from core.config import settings
from core.errors import service_unavailable

_client: AsyncIOMotorClient | None = None
_indexes_ready = False
_mongo_ok = False


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            tz_aware=True,
            serverSelectionTimeoutMS=2500,
            connectTimeoutMS=2500,
        )
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_db_name]


async def assert_mongo_ready() -> None:
    global _mongo_ok
    if settings.on_vercel and settings.mongodb_is_local:
        raise service_unavailable(
            "Set MONGODB_URI in Vercel to a MongoDB Atlas connection string. Localhost MongoDB is not reachable from Vercel."
        )
    if _mongo_ok:
        return
    try:
        await get_client().admin.command("ping")
        _mongo_ok = True
    except Exception as exc:
        raise service_unavailable("Cannot reach MongoDB. Check MONGODB_URI.") from exc


async def get_database() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    await assert_mongo_ready()
    await ensure_auth_indexes()
    yield get_db()


async def ensure_auth_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.auth_tokens.create_index("token_hash")
    _indexes_ready = True


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
