from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from api.deps import get_actor, get_repos
from models.chat import (
    AiPerformancePointSchema,
    ChatMessageResponseSchema,
    ChatSendMessageRequestSchema,
    ChatSessionCreateRequestSchema,
    ChatSessionPatchRequestSchema,
    ChatSessionResponseSchema,
    InsightsOverviewResponseSchema,
    InsightsSeriesPointSchema,
)
from models.common import OkResponseSchema
from models.ops import (
    AlertResponseSchema,
    AuditLogResponseSchema,
    AutoAcceptRuleCreateRequestSchema,
    AutomationPatchRequestSchema,
    AutomationResponseSchema,
    DeliveryConfigSchema,
    DeliveryRecordSchema,
    DeliveryRequestSchema,
    DispatchConfigSchema,
    DispatchRecordSchema,
    DispatchRequestSchema,
    PresetRequestSchema,
    RulePreviewRequestSchema,
)
from models.ticket import TicketResponseSchema
from services import automation_service, chat_service, insights_service, ops_service
from services.delivery_service import (
    deliver,
    get_delivery_config,
    get_dispatch_config,
    list_deliveries,
    list_dispatches,
    patch_delivery_config,
    patch_dispatch_config,
    dispatch_ticket,
)
from services.context import Actor, Repos

router = APIRouter(tags=["product"])


@router.get("/automation", response_model=AutomationResponseSchema)
async def get_automation(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await automation_service.get_automation(repos, actor)


@router.patch("/automation", response_model=AutomationResponseSchema)
async def patch_automation(
    body: AutomationPatchRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await automation_service.patch_automation(repos, actor, body)


@router.post("/automation/preset", response_model=AutomationResponseSchema)
async def apply_preset(
    body: PresetRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await automation_service.apply_preset(repos, actor, body)


@router.post("/automation/rules", response_model=AutomationResponseSchema, status_code=status.HTTP_201_CREATED)
async def add_rule(
    body: AutoAcceptRuleCreateRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await automation_service.add_rule(repos, actor, body)


@router.delete("/automation/rules/{rule_id}", response_model=AutomationResponseSchema)
async def delete_rule(
    rule_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await automation_service.delete_rule(repos, actor, rule_id)


@router.post("/automation/rules/{rule_id}/toggle", response_model=AutomationResponseSchema)
async def toggle_rule(
    rule_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await automation_service.toggle_rule(repos, actor, rule_id)


@router.post("/automation/rules/preview", response_model=list[TicketResponseSchema])
async def preview_rule(
    body: RulePreviewRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await automation_service.preview_rule(repos, actor, body)


@router.get("/delivery/config", response_model=DeliveryConfigSchema)
async def delivery_config(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await get_delivery_config(repos, actor)


@router.patch("/delivery/config", response_model=DeliveryConfigSchema)
async def update_delivery_config(
    body: DeliveryConfigSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await patch_delivery_config(repos, actor, body.model_dump())


@router.get("/delivery", response_model=list[DeliveryRecordSchema])
async def deliveries(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await list_deliveries(repos, actor)


@router.post("/delivery", response_model=DeliveryRecordSchema)
async def create_delivery(
    body: DeliveryRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await deliver(repos, actor, body)


@router.get("/dispatch/config", response_model=DispatchConfigSchema)
async def dispatch_config(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await get_dispatch_config(repos, actor)


@router.patch("/dispatch/config", response_model=DispatchConfigSchema)
async def update_dispatch_config(
    body: DispatchConfigSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await patch_dispatch_config(repos, actor, body.model_dump())


@router.get("/dispatch", response_model=list[DispatchRecordSchema])
async def dispatches(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await list_dispatches(repos, actor)


@router.post("/dispatch", response_model=DispatchRecordSchema)
async def create_dispatch(
    body: DispatchRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await dispatch_ticket(repos, actor, body.ticket_id, body=body)


@router.get("/chat/sessions", response_model=list[ChatSessionResponseSchema])
async def chat_sessions(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await chat_service.list_sessions(repos, actor)


@router.post("/chat/sessions", response_model=ChatSessionResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    body: ChatSessionCreateRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await chat_service.create_session(repos, actor, body)


@router.patch("/chat/sessions/{session_id}", response_model=ChatSessionResponseSchema)
async def rename_session(
    session_id: str,
    body: ChatSessionPatchRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await chat_service.patch_session(repos, actor, session_id, body.title)


@router.delete("/chat/sessions/{session_id}", response_model=OkResponseSchema)
async def delete_session(
    session_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    await chat_service.delete_session(repos, actor, session_id)
    return OkResponseSchema()


@router.get("/chat/sessions/{session_id}/messages", response_model=list[ChatMessageResponseSchema])
async def messages(
    session_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await chat_service.list_messages(repos, actor, session_id)


@router.post("/chat/sessions/{session_id}/messages", response_model=list[ChatMessageResponseSchema])
async def send_message(
    session_id: str,
    body: ChatSendMessageRequestSchema,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await chat_service.send_message(repos, actor, session_id, body.content)


@router.post(
    "/chat/sessions/{session_id}/messages/{message_id}/send-to-dev",
    response_model=ChatMessageResponseSchema,
)
async def send_to_dev(
    session_id: str,
    message_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await chat_service.send_proposal_to_dev(repos, actor, session_id, message_id)


@router.get("/insights/overview", response_model=InsightsOverviewResponseSchema)
async def insights_overview(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await insights_service.overview(repos, actor)


@router.get("/insights/series", response_model=list[InsightsSeriesPointSchema])
async def insights_series(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await insights_service.series(repos, actor)


@router.get("/insights/ai-performance", response_model=list[AiPerformancePointSchema])
async def insights_ai(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await insights_service.ai_performance(repos, actor)


@router.get("/alerts", response_model=list[AlertResponseSchema])
async def alerts(actor: Annotated[Actor, Depends(get_actor)], repos: Annotated[Repos, Depends(get_repos)]):
    return await ops_service.list_alerts(repos, actor)


@router.post("/alerts/{alert_id}/dismiss", response_model=AlertResponseSchema)
async def dismiss_alert(
    alert_id: str,
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
):
    return await ops_service.dismiss_alert(repos, actor, alert_id)


@router.get("/audit", response_model=list[AuditLogResponseSchema])
async def audit(
    actor: Annotated[Actor, Depends(get_actor)],
    repos: Annotated[Repos, Depends(get_repos)],
    q: str = Query(default=""),
):
    return await ops_service.list_audit(repos, actor, q)
