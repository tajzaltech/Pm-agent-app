from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from api.deps import get_actor, get_repos
from models.ticket import (
    ActivityResponseSchema,
    ClusterReviewRequestSchema,
    ClusterResponseSchema,
    TicketCreateFromChatRequestSchema,
    TicketListResponseSchema,
    TicketPatchRequestSchema,
    TicketResponseSchema,
    TicketReviewRequestSchema,
)
from models.chat import WebhookIngestRequestSchema
from services import cluster_service, ticket_service
from services.context import Actor, Repos

router = APIRouter(tags=["tickets"])


@router.get("/tickets", response_model=TicketListResponseSchema)
async def list_tickets(
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
    status_filter: str | None = Query(default=None, alias="status"),
):
    tickets, activity = await ticket_service.list_tickets(repos, actor, status_filter)
    return TicketListResponseSchema(tickets=tickets, activity=activity, total=len(tickets))


@router.post("/tickets", response_model=TicketResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    body: TicketCreateFromChatRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await ticket_service.create_from_chat(repos, actor, body)


@router.post("/tickets/ingest", response_model=TicketResponseSchema, status_code=status.HTTP_201_CREATED)
async def ingest_ticket(
    body: WebhookIngestRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    ticket, _duplicate = await ticket_service.ingest_source(
        repos,
        actor,
        provider=body.provider,
        subject=body.subject,
        body=body.body,
        customer_name=body.customer_name,
        customer_email=body.customer_email,
        customer_plan=body.customer_plan,
        external_id=body.external_id,
        internal_notes=body.internal_notes or "Created from authenticated ingest",
    )
    return ticket


@router.get("/tickets/{ticket_id}", response_model=TicketResponseSchema)
async def get_ticket(
    ticket_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await ticket_service.get_ticket(repos, actor, ticket_id)


@router.patch("/tickets/{ticket_id}", response_model=TicketResponseSchema)
async def patch_ticket(
    ticket_id: str,
    body: TicketPatchRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await ticket_service.patch_ticket(repos, actor, ticket_id, body)


@router.post("/tickets/{ticket_id}/review", response_model=TicketResponseSchema)
async def review_ticket(
    ticket_id: str,
    body: TicketReviewRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await ticket_service.review_ticket(repos, actor, ticket_id, body)


@router.get("/activity", response_model=list[ActivityResponseSchema])
async def activity(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    _, items = await ticket_service.list_tickets(repos, actor)
    return items


@router.get("/clusters", response_model=list[ClusterResponseSchema])
async def list_clusters(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await cluster_service.list_clusters(repos, actor)


@router.post("/clusters/rebuild", response_model=list[ClusterResponseSchema])
async def rebuild_clusters(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await cluster_service.rebuild_clusters(repos, actor)


@router.get("/clusters/{cluster_id}", response_model=ClusterResponseSchema)
async def get_cluster(
    cluster_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await cluster_service.get_cluster(repos, actor, cluster_id)


@router.post("/clusters/{cluster_id}/review", response_model=list[TicketResponseSchema])
async def review_cluster(
    cluster_id: str,
    body: ClusterReviewRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    cluster = await cluster_service.get_cluster(repos, actor, cluster_id)
    results = []
    for ref in cluster.tickets:
        results.append(
            await ticket_service.review_ticket(
                repos,
                actor,
                ref.ticket_id,
                TicketReviewRequestSchema(action=body.action),
            )
        )
    return results
