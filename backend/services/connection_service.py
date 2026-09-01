from __future__ import annotations

from core.errors import conflict, not_found
from core.ids import new_id, utcnow
from models.ops import (
    ConnectionCreateRequestSchema,
    ConnectionResponseSchema,
    ConnectionsBundleResponseSchema,
    RepoCreateRequestSchema,
    RepoResponseSchema,
)
from services.context import Actor, Repos, as_id, iso

SOURCE_NAMES = {
    "freshdesk": "Freshdesk",
    "zendesk": "Zendesk",
    "email": "Email",
    "jira_sm": "Jira Service Management",
    "salesforce": "Salesforce",
    "sheets": "Google Sheets",
    "webhook": "Webhook",
}
OUTPUT_NAMES = {
    "linear": "Linear",
    "jira": "Jira",
    "github": "GitHub Issues",
    "clickup": "ClickUp",
    "asana": "Asana",
    "trello": "Trello",
    "monday": "monday.com",
}


def to_connection(doc: dict) -> ConnectionResponseSchema:
    data = as_id(doc)
    return ConnectionResponseSchema(
        id=data["id"],
        type=data["type"],
        provider=data["provider"],
        name=data["name"],
        status=data["status"],
        ticket_count=data.get("ticket_count"),
        target_project=data.get("target_project"),
        connected_at=iso(data.get("connected_at")) or None,
    )


def to_repo(doc: dict) -> RepoResponseSchema:
    data = as_id(doc)
    return RepoResponseSchema(
        id=data["id"],
        platform=data["platform"],
        name=data["name"],
        full_name=data["full_name"],
        status=data["status"],
        last_indexed=iso(data.get("last_indexed")),
        selected=bool(data.get("selected", True)),
    )


async def bundle(repos: Repos, actor: Actor) -> ConnectionsBundleResponseSchema:
    sources = await repos.connections.find_many({"workspace_id": actor.workspace_id, "type": "source"})
    outputs = await repos.connections.find_many({"workspace_id": actor.workspace_id, "type": "output"})
    repo_docs = await repos.repos.find_many({"workspace_id": actor.workspace_id})
    flag_doc = await repos.connections.find_one({"workspace_id": actor.workspace_id, "type": "output", "provider": "_dev_agent"})
    return ConnectionsBundleResponseSchema(
        sources=[to_connection(s) for s in sources],
        outputs=[to_connection(o) for o in outputs if o.get("provider") != "_dev_agent"],
        repos=[to_repo(r) for r in repo_docs],
        dev_agent_enabled=bool(flag_doc and flag_doc.get("dev_agent_enabled", True)) if flag_doc else True,
    )


async def add_connection(
    repos: Repos,
    actor: Actor,
    kind: str,
    body: ConnectionCreateRequestSchema,
    credentials: dict | None = None,
) -> ConnectionResponseSchema:
    existing = await repos.connections.find_one(
        {"workspace_id": actor.workspace_id, "type": kind, "provider": body.provider}
    )
    names = SOURCE_NAMES if kind == "source" else OUTPUT_NAMES
    now = utcnow()
    creds = {k: v for k, v in (credentials or {}).items() if v}
    patch = {
        "name": body.name or names.get(body.provider, body.provider),
        "status": "connected",
        "target_project": body.target_project,
        "connected_at": now,
        "api_key": body.api_key,
        "team_id": body.team_id,
    }
    if creds:
        patch["credentials"] = creds
    if existing:
        await repos.connections.update_by_id(existing["_id"], patch)
        refreshed = await repos.connections.find_by_id(existing["_id"])
        return to_connection(refreshed or existing)
    doc = {
        "_id": new_id("conn"),
        "workspace_id": actor.workspace_id,
        "type": kind,
        "provider": body.provider,
        "ticket_count": 0,
        "dev_agent_enabled": False,
        **patch,
    }
    await repos.connections.insert(doc)
    if kind == "output" and body.provider in {"linear", "github"} and body.api_key:
        cfg = await repos.delivery_configs.find_one({"workspace_id": actor.workspace_id})
        if cfg:
            patch = {"updated_at": now, "default_tool": "linear" if body.provider == "linear" else cfg.get("default_tool")}
            if body.provider == "linear":
                patch["linear_api_key"] = body.api_key
                if body.team_id:
                    patch["linear_team_id"] = body.team_id
                patch["enabled"] = True
            await repos.delivery_configs.update_by_id(cfg["_id"], patch)
    return to_connection(doc)


async def remove_connection(repos: Repos, actor: Actor, connection_id: str) -> None:
    doc = await repos.connections.find_by_id(connection_id)
    if not doc or doc["workspace_id"] != actor.workspace_id:
        raise not_found("Connection not found")
    await repos.connections.delete_by_id(connection_id)


async def add_repo(repos: Repos, actor: Actor, body: RepoCreateRequestSchema) -> RepoResponseSchema:
    existing = await repos.repos.find_one({"workspace_id": actor.workspace_id, "full_name": body.full_name})
    if existing:
        raise conflict("Repo already connected")
    now = utcnow()
    doc = {
        "_id": new_id("repo"),
        "workspace_id": actor.workspace_id,
        "platform": body.platform,
        "name": body.full_name.split("/")[-1],
        "full_name": body.full_name,
        "status": "indexing",
        "last_indexed": now,
        "selected": True,
        "access_token": body.access_token,
    }
    await repos.repos.insert(doc)
    from services.indexing_service import index_repo

    await index_repo(repos, actor, doc["_id"])
    refreshed = await repos.repos.find_by_id(doc["_id"])
    return to_repo(refreshed or doc)


async def remove_repo(repos: Repos, actor: Actor, repo_id: str) -> None:
    doc = await repos.repos.find_by_id(repo_id)
    if not doc or doc["workspace_id"] != actor.workspace_id:
        raise not_found("Repo not found")
    from integrations.vector_store import vector_store

    await vector_store.delete_repo(repos.code_chunks.db, workspace_id=actor.workspace_id, repo_id=repo_id)
    await repos.repos.delete_by_id(repo_id)


async def set_dev_agent(repos: Repos, actor: Actor, enabled: bool) -> None:
    existing = await repos.connections.find_one(
        {"workspace_id": actor.workspace_id, "provider": "_dev_agent"}
    )
    if existing:
        await repos.connections.update_by_id(existing["_id"], {"dev_agent_enabled": enabled})
        return
    await repos.connections.insert(
        {
            "_id": new_id("conn"),
            "workspace_id": actor.workspace_id,
            "type": "output",
            "provider": "_dev_agent",
            "name": "Dev Agent",
            "status": "connected",
            "ticket_count": None,
            "target_project": None,
            "connected_at": utcnow(),
            "dev_agent_enabled": enabled,
        }
    )
