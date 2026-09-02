from __future__ import annotations

from collections.abc import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import OperationFailure

from core.config import settings
from core.errors import service_unavailable

_client: AsyncIOMotorClient | None = None
_indexes_ready = False
_mongo_ok = False


async def _create_index(collection, *args, **kwargs) -> None:
    try:
        await collection.create_index(*args, **kwargs)
    except OperationFailure as exc:
        if getattr(exc, "code", None) not in {85, 86}:
            raise


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        timeout_ms = 8000 if settings.is_production else 2500
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            tz_aware=True,
            serverSelectionTimeoutMS=timeout_ms,
            connectTimeoutMS=timeout_ms,
            retryWrites=True,
        )
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_db_name]


async def ping_mongo() -> bool:
    global _mongo_ok
    try:
        await get_client().admin.command("ping")
        _mongo_ok = True
        return True
    except Exception:
        _mongo_ok = False
        return False


async def assert_mongo_ready() -> None:
    if _mongo_ok:
        return
    if not await ping_mongo():
        raise service_unavailable("Cannot reach MongoDB. Check MONGODB_URI.")


async def get_database() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    await assert_mongo_ready()
    await ensure_auth_indexes()
    yield get_db()


async def ensure_auth_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    db = get_db()
    await _create_index(db.users, "email", unique=True)
    await _create_index(db.auth_tokens, "token_hash")
    await _create_index(db.auth_tokens, "token_lookup")
    _indexes_ready = True


async def ensure_indexes() -> None:
    db = get_db()
    await _create_index(db.users, "email", unique=True)
    await _create_index(db.auth_tokens, "token_hash")
    await _create_index(db.auth_tokens, "token_lookup")
    await _create_index(db.auth_tokens, "expires_at", expireAfterSeconds=0)
    await _create_index(db.workspaces, "slug")
    await _create_index(db.workspace_members, [("workspace_id", 1), ("user_id", 1)], unique=True)
    await _create_index(db.tickets, [("workspace_id", 1), ("status", 1)])
    await _create_index(db.tickets, [("workspace_id", 1), ("source", 1), ("original_ticket_id", 1)])
    await _create_index(db.activity, [("workspace_id", 1), ("timestamp", -1)])
    await _create_index(db.clusters, "workspace_id")
    await _create_index(db.pipeline_cards, [("workspace_id", 1), ("ticket_id", 1)], unique=True)
    await _create_index(db.connections, [("workspace_id", 1), ("type", 1), ("provider", 1)])
    await _create_index(db.repos, [("workspace_id", 1), ("full_name", 1)], unique=True)
    await _create_index(db.product_docs, "workspace_id")
    await _create_index(db.automation, "workspace_id", unique=True)
    await _create_index(db.delivery_configs, "workspace_id", unique=True)
    await _create_index(db.delivery_records, [("workspace_id", 1), ("ticket_id", 1)])
    await _create_index(db.dispatch_configs, "workspace_id", unique=True)
    await _create_index(db.dispatch_records, [("workspace_id", 1), ("ticket_id", 1)])
    await _create_index(db.chat_sessions, [("workspace_id", 1), ("updated_at", -1)])
    await _create_index(db.chat_messages, [("session_id", 1), ("timestamp", 1)])
    await _create_index(db.alerts, "workspace_id")
    await _create_index(db.audit_logs, [("workspace_id", 1), ("timestamp", -1)])
    await _create_index(db.onboarding, "workspace_id", unique=True)
    await _create_index(db.code_chunks, [("workspace_id", 1), ("repo_id", 1)])
    global _indexes_ready
    _indexes_ready = True


async def close_client() -> None:
    global _client, _mongo_ok
    if _client is not None:
        _client.close()
        _client = None
    _mongo_ok = False
