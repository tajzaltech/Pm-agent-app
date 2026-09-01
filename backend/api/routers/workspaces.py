from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from api.deps import get_actor, get_current_user, get_repos, require_roles
from models.common import ListResponseSchema, OkResponseSchema
from models.workspace import (
    MemberInviteRequestSchema,
    OnboardingConnectOutputRequestSchema,
    OnboardingConnectRepoRequestSchema,
    OnboardingConnectSourceRequestSchema,
    OnboardingPatchRequestSchema,
    OnboardingResponseSchema,
    SourceSyncRequestSchema,
    SourceSyncResponseSchema,
    TeamMemberResponseSchema,
    WorkspaceCreateRequestSchema,
    WorkspaceResponseSchema,
)
from services import workspace_service
from services.context import Actor, Repos

router = APIRouter(tags=["workspaces"])


@router.get("/workspaces", response_model=ListResponseSchema[WorkspaceResponseSchema])
async def list_workspaces(user: Annotated[dict, Depends(get_current_user)], repos: Annotated[Repos, Depends(get_repos)]):
    items = await workspace_service.list_workspaces(repos, user["_id"])
    return ListResponseSchema(items=items, total=len(items))


@router.post("/workspaces", response_model=WorkspaceResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    body: WorkspaceCreateRequestSchema,
    user: Annotated[dict, Depends(get_current_user)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await workspace_service.create_workspace(repos, user["_id"], user["name"], user["email"], body)


@router.get("/team", response_model=ListResponseSchema[TeamMemberResponseSchema])
async def list_team(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    items = await workspace_service.list_team(repos, actor)
    return ListResponseSchema(items=items, total=len(items))


@router.post("/team/invites", response_model=TeamMemberResponseSchema, status_code=status.HTTP_201_CREATED)
async def invite(
    body: MemberInviteRequestSchema,
    actor: Annotated[Actor, Depends(require_roles("owner", "admin"))],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await workspace_service.invite_member(repos, actor, body)


@router.delete("/team/{member_id}", response_model=OkResponseSchema)
async def remove_member(
    member_id: str,
    actor: Annotated[Actor, Depends(require_roles("owner", "admin"))],
    repos: Annotated[Repos, Depends(get_repos)],
):
    await workspace_service.remove_member(repos, actor, member_id)
    return OkResponseSchema()


@router.get("/onboarding", response_model=OnboardingResponseSchema)
async def get_onboarding(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await workspace_service.get_onboarding(repos, actor)


@router.patch("/onboarding", response_model=OnboardingResponseSchema)
async def patch_onboarding(
    body: OnboardingPatchRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await workspace_service.patch_onboarding(repos, actor, body)


@router.post("/onboarding/connect-source", response_model=OnboardingResponseSchema)
async def connect_source(
    body: OnboardingConnectSourceRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await workspace_service.connect_source(repos, actor, body)


@router.post("/onboarding/sync-source", response_model=SourceSyncResponseSchema)
async def sync_source(
    body: SourceSyncRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    from services.source_ingest_service import sync_source as pull_source

    return await pull_source(repos, actor, body.provider)


@router.post("/onboarding/connect-repo", response_model=OnboardingResponseSchema)
async def connect_repo(
    body: OnboardingConnectRepoRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await workspace_service.connect_repo(repos, actor, body)


@router.post("/onboarding/connect-output", response_model=OnboardingResponseSchema)
async def connect_output(
    body: OnboardingConnectOutputRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await workspace_service.connect_output(repos, actor, body)


@router.post("/onboarding/complete", response_model=OnboardingResponseSchema)
async def complete_onboarding(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await workspace_service.complete_onboarding(repos, actor)
