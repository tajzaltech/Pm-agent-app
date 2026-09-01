from __future__ import annotations

from core.errors import bad_request, forbidden, not_found
from core.ids import initials, new_id, utcnow
from models.workspace import (
    MemberInviteRequestSchema,
    OnboardingConnectOutputRequestSchema,
    OnboardingConnectRepoRequestSchema,
    OnboardingConnectSourceRequestSchema,
    OnboardingPatchRequestSchema,
    OnboardingResponseSchema,
    TeamMemberResponseSchema,
    TicketSourceConfigSchema,
    WorkspaceCreateRequestSchema,
    WorkspaceResponseSchema,
)
from services.context import Actor, Repos, as_id, iso
from services.connection_service import (
    ConnectionCreateRequestSchema,
    RepoCreateRequestSchema,
    add_connection,
    add_repo,
)

ROLE_RANK = {"owner": 3, "admin": 2, "user": 1}


def can_remove(actor_role: str, target_role: str) -> bool:
    if actor_role == "owner":
        return target_role in {"admin", "user"}
    if actor_role == "admin":
        return target_role == "user"
    return False


def to_workspace(ws: dict, role: str) -> WorkspaceResponseSchema:
    data = as_id(ws)
    return WorkspaceResponseSchema(
        id=data["id"],
        name=data["name"],
        slug=data["slug"],
        description=data.get("description") or "",
        initials=data.get("initials") or "",
        role=role,  # type: ignore[arg-type]
        created_at=iso(data.get("created_at")),
    )


def to_member(doc: dict) -> TeamMemberResponseSchema:
    data = as_id(doc)
    return TeamMemberResponseSchema(
        id=data["id"],
        user_id=data.get("user_id"),
        name=data["name"],
        email=data["email"],
        role=data["role"],
        status=data.get("status") or "active",
        avatar_initials=data.get("avatar_initials") or initials(data["name"]),
    )


async def list_workspaces(repos: Repos, user_id: str) -> list[WorkspaceResponseSchema]:
    memberships = await repos.members.list_for_user(user_id)
    out = []
    for mem in memberships:
        ws = await repos.workspaces.find_by_id(mem["workspace_id"])
        if ws:
            out.append(to_workspace(ws, mem["role"]))
    return out


async def create_workspace(repos: Repos, user_id: str, name: str, email: str, body: WorkspaceCreateRequestSchema) -> WorkspaceResponseSchema:
    from services.auth_service import _seed_workspace

    workspace_id = await _seed_workspace(repos, user_id=user_id, name=name, email=email, company=body.name)
    await repos.workspaces.update_by_id(workspace_id, {"description": body.description})
    ws = await repos.workspaces.find_by_id(workspace_id)
    return to_workspace(ws, "owner")


async def list_team(repos: Repos, actor: Actor) -> list[TeamMemberResponseSchema]:
    docs = await repos.members.list_for_workspace(actor.workspace_id)
    return [to_member(d) for d in docs]


async def invite_member(repos: Repos, actor: Actor, body: MemberInviteRequestSchema) -> TeamMemberResponseSchema:
    if actor.role == "user":
        raise forbidden("Users cannot invite members")
    if actor.role == "admin" and body.role != "user":
        raise forbidden("Admins can only invite users")
    if actor.role == "owner" and body.role == "owner":
        raise bad_request("Cannot invite another owner")
    email = body.email.lower().strip()
    existing = await repos.members.find_one({"workspace_id": actor.workspace_id, "email": email})
    if existing:
        raise bad_request("Member already exists")
    user = await repos.users.find_by_email(email)
    display = body.name or email.split("@")[0]
    doc = {
        "_id": new_id("mem"),
        "workspace_id": actor.workspace_id,
        "user_id": user["_id"] if user else "",
        "role": body.role,
        "name": display,
        "email": email,
        "status": "active" if user else "invited",
        "avatar_initials": initials(display),
        "created_at": utcnow(),
    }
    await repos.members.insert(doc)
    return to_member(doc)


async def remove_member(repos: Repos, actor: Actor, member_id: str) -> None:
    target = await repos.members.find_by_id(member_id)
    if not target or target["workspace_id"] != actor.workspace_id:
        raise not_found("Member not found")
    if not can_remove(actor.role, target["role"]):
        raise forbidden("You cannot remove this member")
    await repos.members.delete_by_id(member_id)


def to_onboarding(doc: dict) -> OnboardingResponseSchema:
    sources = [TicketSourceConfigSchema.model_validate(s) for s in doc.get("ticket_sources") or []]
    return OnboardingResponseSchema(
        step=str(doc.get("step", "1")),
        is_setup=bool(doc.get("is_setup")),
        workspace_role=doc.get("workspace_role") or "pm",
        ticket_sources=sources,
        repo_provider=doc.get("repo_provider"),
        repo_provider_status=doc.get("repo_provider_status") or "idle",
        selected_repos=doc.get("selected_repos") or [],
        output_tool=doc.get("output_tool"),
        output_tool_status=doc.get("output_tool_status") or "idle",
        selected_project=doc.get("selected_project"),
        indexing_status=doc.get("indexing_status") or "idle",
        indexing_step=doc.get("indexing_step") or "",
    )


async def get_onboarding(repos: Repos, actor: Actor) -> OnboardingResponseSchema:
    doc = await repos.onboarding.find_one({"workspace_id": actor.workspace_id})
    if not doc:
        doc = {
            "_id": new_id("ob"),
            "workspace_id": actor.workspace_id,
            "step": "1",
            "is_setup": False,
            "workspace_role": "pm",
            "ticket_sources": [],
            "repo_provider": None,
            "repo_provider_status": "idle",
            "selected_repos": [],
            "output_tool": None,
            "output_tool_status": "idle",
            "selected_project": None,
            "indexing_status": "idle",
            "indexing_step": "",
            "updated_at": utcnow(),
        }
        await repos.onboarding.insert(doc)
    return to_onboarding(doc)


async def patch_onboarding(repos: Repos, actor: Actor, body: OnboardingPatchRequestSchema) -> OnboardingResponseSchema:
    doc = await repos.onboarding.find_one({"workspace_id": actor.workspace_id})
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    patch["updated_at"] = utcnow()
    updated = await repos.onboarding.update_by_id(doc["_id"], patch)
    return to_onboarding(updated or doc)


async def connect_source(repos: Repos, actor: Actor, body: OnboardingConnectSourceRequestSchema) -> OnboardingResponseSchema:
    from services.source_ingest_service import connect_and_import

    return await connect_and_import(repos, actor, body)


async def connect_repo(repos: Repos, actor: Actor, body: OnboardingConnectRepoRequestSchema) -> OnboardingResponseSchema:
    for full_name in body.repos:
        try:
            await add_repo(
                repos,
                actor,
                RepoCreateRequestSchema(
                    full_name=full_name,
                    platform=body.provider if body.provider in {"github", "bitbucket"} else "github",
                    access_token=body.access_token,
                ),
            )
        except Exception:
            continue
    doc = await repos.onboarding.find_one({"workspace_id": actor.workspace_id})
    updated = await repos.onboarding.update_by_id(
        doc["_id"],
        {
            "repo_provider": body.provider,
            "repo_provider_status": "connected",
            "selected_repos": body.repos,
            "updated_at": utcnow(),
        },
    )
    return to_onboarding(updated or doc)


async def connect_output(repos: Repos, actor: Actor, body: OnboardingConnectOutputRequestSchema) -> OnboardingResponseSchema:
    await add_connection(
        repos,
        actor,
        "output",
        ConnectionCreateRequestSchema(
            provider=body.tool,
            name=None,
            target_project=body.project,
            api_key=body.api_key,
            team_id=body.team_id,
        ),
    )
    doc = await repos.onboarding.find_one({"workspace_id": actor.workspace_id})
    updated = await repos.onboarding.update_by_id(
        doc["_id"],
        {
            "output_tool": body.tool,
            "output_tool_status": "connected",
            "selected_project": body.project,
            "updated_at": utcnow(),
        },
    )
    return to_onboarding(updated or doc)


async def complete_onboarding(repos: Repos, actor: Actor) -> OnboardingResponseSchema:
    doc = await repos.onboarding.find_one({"workspace_id": actor.workspace_id})
    updated = await repos.onboarding.update_by_id(
        doc["_id"],
        {"is_setup": True, "step": "done", "indexing_status": "done", "indexing_step": "Indexing complete.", "updated_at": utcnow()},
    )
    return to_onboarding(updated or doc)
