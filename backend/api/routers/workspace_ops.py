from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from api.deps import get_actor, get_repos
from models.common import OkResponseSchema
from models.ops import (
    ConnectionCreateRequestSchema,
    ConnectionsBundleResponseSchema,
    ConnectionResponseSchema,
    DevAgentPatchRequestSchema,
    IngestSettingsResponseSchema,
    PipelineCardResponseSchema,
    PipelineMoveRequestSchema,
    ProductDocConfirmRequestSchema,
    ProductDocPresignRequestSchema,
    ProductDocPresignResponseSchema,
    ProductDocResponseSchema,
    RepoCreateRequestSchema,
    RepoResponseSchema,
)
from services import connection_service, docs_service, pipeline_service
from services.context import Actor, Repos

router = APIRouter(tags=["workspace-ops"])


@router.get("/pipeline", response_model=list[PipelineCardResponseSchema])
async def list_pipeline(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await pipeline_service.list_pipeline(repos, actor)


@router.patch("/pipeline/{card_id}", response_model=PipelineCardResponseSchema)
async def move_pipeline(
    card_id: str,
    body: PipelineMoveRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await pipeline_service.move_card(repos, actor, card_id, body.stage)


@router.post("/pipeline/{card_id}/advance", response_model=PipelineCardResponseSchema)
async def advance_pipeline(
    card_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await pipeline_service.advance_card(repos, actor, card_id)


@router.get("/connections", response_model=ConnectionsBundleResponseSchema)
async def get_connections(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await connection_service.bundle(repos, actor)


@router.get("/connections/ingest", response_model=IngestSettingsResponseSchema)
async def ingest_settings(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    from secrets import token_urlsafe

    ws = await repos.workspaces.find_by_id(actor.workspace_id)
    secret = (ws or {}).get("ingest_secret")
    if not secret:
        secret = token_urlsafe(24)
        await repos.workspaces.update_by_id(actor.workspace_id, {"ingest_secret": secret})
    return IngestSettingsResponseSchema(
        workspace_id=actor.workspace_id,
        secret=secret,
        path=f"/v1/webhooks/ingest/{actor.workspace_id}",
    )


@router.post("/connections/sources", response_model=ConnectionResponseSchema, status_code=status.HTTP_201_CREATED)
async def add_source(
    body: ConnectionCreateRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await connection_service.add_connection(repos, actor, "source", body)


@router.delete("/connections/sources/{connection_id}", response_model=OkResponseSchema)
async def remove_source(
    connection_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    await connection_service.remove_connection(repos, actor, connection_id)
    return OkResponseSchema()


@router.post("/connections/outputs", response_model=ConnectionResponseSchema, status_code=status.HTTP_201_CREATED)
async def add_output(
    body: ConnectionCreateRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await connection_service.add_connection(repos, actor, "output", body)


@router.delete("/connections/outputs/{connection_id}", response_model=OkResponseSchema)
async def remove_output(
    connection_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    await connection_service.remove_connection(repos, actor, connection_id)
    return OkResponseSchema()


@router.post("/connections/repos", response_model=RepoResponseSchema, status_code=status.HTTP_201_CREATED)
async def add_repo(
    body: RepoCreateRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await connection_service.add_repo(repos, actor, body)


@router.delete("/connections/repos/{repo_id}", response_model=OkResponseSchema)
async def remove_repo(
    repo_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    await connection_service.remove_repo(repos, actor, repo_id)
    return OkResponseSchema()


@router.post("/connections/repos/{repo_id}/reindex", response_model=OkResponseSchema)
async def reindex_repo(
    repo_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    await docs_service.index_repo(repos, actor, repo_id)
    return OkResponseSchema()


@router.patch("/connections/dev-agent", response_model=OkResponseSchema)
async def patch_dev_agent(
    body: DevAgentPatchRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    await connection_service.set_dev_agent(repos, actor, body.enabled)
    return OkResponseSchema()


@router.get("/product-docs", response_model=list[ProductDocResponseSchema])
async def list_docs(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await docs_service.list_docs(repos, actor)


@router.post("/product-docs/presign", response_model=ProductDocPresignResponseSchema)
async def presign_doc(
    body: ProductDocPresignRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await docs_service.presign(repos, actor, body)


@router.post("/product-docs", response_model=ProductDocResponseSchema, status_code=status.HTTP_201_CREATED)
async def confirm_doc(
    body: ProductDocConfirmRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await docs_service.confirm(repos, actor, body)


@router.delete("/product-docs/{doc_id}", response_model=OkResponseSchema)
async def delete_doc(
    doc_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    await docs_service.delete_doc(repos, actor, doc_id)
    return OkResponseSchema()
