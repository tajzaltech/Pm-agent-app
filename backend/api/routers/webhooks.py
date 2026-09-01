from __future__ import annotations

import secrets as pysecrets
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Response, status

from api.deps import get_repos
from core.config import settings
from core.errors import bad_request, unauthorized
from integrations.ticket_sources import parse_vendor_payload
from models.chat import PipelineWebhookRequestSchema, WebhookIngestRequestSchema, WebhookIngestResponseSchema
from models.common import LooseModel, OkResponseSchema
from services.context import Actor, Repos
from services.pipeline_service import move_card
from services.ticket_service import ingest_source

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _check_secret(provided: str | None, expected: str) -> None:
    if not provided or not expected:
        raise unauthorized("Invalid webhook secret")
    if not pysecrets.compare_digest(provided, expected):
        raise unauthorized("Invalid webhook secret")


async def _workspace_secret(repos: Repos, workspace_id: str) -> str:
    from secrets import token_urlsafe

    ws = await repos.workspaces.find_by_id(workspace_id)
    if not ws:
        raise unauthorized("Unknown workspace")
    secret = ws.get("ingest_secret") or settings.webhook_ingest_secret
    if not secret:
        secret = token_urlsafe(24)
        await repos.workspaces.update_by_id(workspace_id, {"ingest_secret": secret})
    return secret


async def _workspace_actor(repos: Repos, workspace_id: str) -> Actor:
    ws = await repos.workspaces.find_by_id(workspace_id)
    if not ws:
        raise unauthorized("Unknown workspace")
    owner = await repos.members.find_one({"workspace_id": workspace_id, "role": "owner"})
    return Actor(
        user_id=owner["user_id"] if owner else ws["owner_id"],
        email=owner["email"] if owner else "system@local",
        name="Webhook",
        workspace_id=workspace_id,
        role="owner",
    )


@router.post("/ingest/{workspace_id}", response_model=WebhookIngestResponseSchema)
async def ingest(
    workspace_id: str,
    body: WebhookIngestRequestSchema,
    repos: Annotated[Repos, Depends(get_repos)],
    response: Response,
    x_pm_agent_secret: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
):
    token = x_pm_agent_secret or (authorization.replace("Bearer ", "") if authorization else None)
    _check_secret(token, await _workspace_secret(repos, workspace_id))
    actor = await _workspace_actor(repos, workspace_id)
    ticket, duplicate = await ingest_source(
        repos,
        actor,
        provider=body.provider,
        subject=body.subject,
        body=body.body,
        customer_name=body.customer_name,
        customer_email=body.customer_email,
        customer_plan=body.customer_plan,
        external_id=body.external_id,
        internal_notes=body.internal_notes,
    )
    response.status_code = status.HTTP_200_OK if duplicate else status.HTTP_201_CREATED
    return WebhookIngestResponseSchema(duplicate=duplicate, ticket_id=ticket.id)


async def _ingest_vendor(
    repos: Repos,
    workspace_id: str,
    provider: str,
    payload: dict[str, Any],
    response: Response,
) -> WebhookIngestResponseSchema:
    parsed = parse_vendor_payload(provider, payload)
    if parsed is None:
        raise bad_request("Could not read a ticket from this payload")
    actor = await _workspace_actor(repos, workspace_id)
    ticket, duplicate = await ingest_source(
        repos,
        actor,
        provider=provider,
        subject=parsed.subject,
        body=parsed.body,
        customer_name=parsed.customer_name,
        customer_email=parsed.customer_email,
        customer_plan=None,
        external_id=parsed.external_id or None,
        internal_notes=f"Ingested from {provider} webhook",
    )
    response.status_code = status.HTTP_200_OK if duplicate else status.HTTP_201_CREATED
    return WebhookIngestResponseSchema(duplicate=duplicate, ticket_id=ticket.id)


@router.post("/freshdesk/{workspace_id}", response_model=WebhookIngestResponseSchema)
async def freshdesk(
    workspace_id: str,
    body: LooseModel,
    repos: Annotated[Repos, Depends(get_repos)],
    response: Response,
    x_pm_agent_secret: Annotated[str | None, Header()] = None,
    x_freshdesk_webhook_secret: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
):
    token = (
        x_pm_agent_secret
        or x_freshdesk_webhook_secret
        or (authorization.replace("Bearer ", "") if authorization else None)
    )
    expected = settings.freshdesk_webhook_secret or await _workspace_secret(repos, workspace_id)
    _check_secret(token, expected)
    return await _ingest_vendor(repos, workspace_id, "freshdesk", body.model_dump(), response)


@router.post("/zendesk/{workspace_id}", response_model=WebhookIngestResponseSchema)
async def zendesk(
    workspace_id: str,
    body: LooseModel,
    repos: Annotated[Repos, Depends(get_repos)],
    response: Response,
    x_pm_agent_secret: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
):
    token = x_pm_agent_secret or (authorization.replace("Bearer ", "") if authorization else None)
    _check_secret(token, await _workspace_secret(repos, workspace_id))
    return await _ingest_vendor(repos, workspace_id, "zendesk", body.model_dump(), response)


@router.post("/jira/{workspace_id}", response_model=WebhookIngestResponseSchema)
async def jira(
    workspace_id: str,
    body: LooseModel,
    repos: Annotated[Repos, Depends(get_repos)],
    response: Response,
    x_pm_agent_secret: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
):
    token = x_pm_agent_secret or (authorization.replace("Bearer ", "") if authorization else None)
    _check_secret(token, await _workspace_secret(repos, workspace_id))
    return await _ingest_vendor(repos, workspace_id, "jira_sm", body.model_dump(), response)


@router.post("/salesforce/{workspace_id}", response_model=WebhookIngestResponseSchema)
async def salesforce(
    workspace_id: str,
    body: LooseModel,
    repos: Annotated[Repos, Depends(get_repos)],
    response: Response,
    x_pm_agent_secret: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
):
    token = x_pm_agent_secret or (authorization.replace("Bearer ", "") if authorization else None)
    _check_secret(token, await _workspace_secret(repos, workspace_id))
    return await _ingest_vendor(repos, workspace_id, "salesforce", body.model_dump(), response)


@router.post("/email/{workspace_id}", response_model=WebhookIngestResponseSchema)
async def inbound_email(
    workspace_id: str,
    body: LooseModel,
    repos: Annotated[Repos, Depends(get_repos)],
    response: Response,
    x_pm_agent_secret: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
):
    token = x_pm_agent_secret or (authorization.replace("Bearer ", "") if authorization else None)
    _check_secret(token, await _workspace_secret(repos, workspace_id))
    return await _ingest_vendor(repos, workspace_id, "email", body.model_dump(), response)


@router.post("/pipeline/{workspace_id}", response_model=OkResponseSchema)
async def pipeline_status(
    workspace_id: str,
    body: PipelineWebhookRequestSchema,
    repos: Annotated[Repos, Depends(get_repos)],
    x_pm_agent_secret: Annotated[str | None, Header()] = None,
):
    _check_secret(x_pm_agent_secret, await _workspace_secret(repos, workspace_id))
    actor = await _workspace_actor(repos, workspace_id)
    card = await repos.pipeline.find_by_ticket(workspace_id, body.ticket_id)
    if card:
        await move_card(repos, actor, card["_id"], body.stage)
        if body.external_id:
            await repos.pipeline.update_by_id(card["_id"], {"external_id": body.external_id})
    return OkResponseSchema()
