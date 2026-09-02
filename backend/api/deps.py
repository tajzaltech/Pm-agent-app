from __future__ import annotations

from typing import Annotated, Any

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings
from core.db import get_database
from core.errors import forbidden, unauthorized
from core.security import decode_access_token
from services.context import Actor, Repos, build_repos

bearer = HTTPBearer(auto_error=False)


async def get_repos(db: Annotated[Any, Depends(get_database)]) -> Repos:
    return build_repos(db)


def _user_from_token(payload: dict) -> dict:
    return {
        "_id": payload["sub"],
        "email": payload.get("email") or "",
        "name": payload.get("name") or payload.get("email") or "User",
        "email_verified": True,
        "default_workspace_id": payload.get("wid") or None,
    }


async def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    repos: Annotated[Repos, Depends(get_repos)],
) -> dict:
    if creds is None or creds.scheme.lower() != "bearer":
        raise unauthorized()
    try:
        payload = decode_access_token(creds.credentials)
    except Exception as exc:  # noqa: BLE001 — map all JWT failures to 401
        raise unauthorized("Invalid access token") from exc
    user = await repos.users.find_by_id(payload["sub"])
    if user:
        return user
    if settings.use_memory_store:
        return _user_from_token(payload)
    raise unauthorized("User not found")


async def get_actor(
    user: Annotated[dict, Depends(get_current_user)],
    repos: Annotated[Repos, Depends(get_repos)],
    x_workspace_id: Annotated[str | None, Header(alias="X-Workspace-Id")] = None,
) -> Actor:
    workspace_id = x_workspace_id or user.get("default_workspace_id")
    if not workspace_id:
        raise forbidden("No workspace selected")
    membership = await repos.members.find_membership(workspace_id, user["_id"])
    if not membership and settings.use_memory_store:
        membership = {"role": "owner", "workspace_id": workspace_id, "user_id": user["_id"]}
    if not membership:
        raise forbidden("Not a member of this workspace")
    return Actor(
        user_id=user["_id"],
        email=user["email"],
        name=user["name"],
        workspace_id=workspace_id,
        role=membership["role"],
    )


def require_roles(*roles: str):
    async def _check(actor: Annotated[Actor, Depends(get_actor)]) -> Actor:
        if actor.role not in roles:
            raise forbidden("Insufficient permissions")
        return actor

    return _check
