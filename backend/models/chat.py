from __future__ import annotations

from datetime import datetime

from pydantic import Field

from models.common import ORMModel, StrictModel
from models.enums import Classification, PmChatRole, Scope, TicketSource


class ChatSessionCreateRequestSchema(StrictModel):
    ticket_id: str | None = None
    title: str | None = Field(default=None, max_length=160)


class ChatSessionPatchRequestSchema(StrictModel):
    title: str = Field(min_length=1, max_length=160)


class ChatSessionResponseSchema(StrictModel):
    id: str
    ticket_id: str | None = None
    title: str
    preview: str
    updated_at: str
    created_at: str


class ChatCustomerReplySchema(StrictModel):
    subject: str
    body: str
    channel: str
    customer_name: str


class ChatProposalSchema(StrictModel):
    title: str
    classification: Classification
    scope: Scope
    summary: str
    severity: str


class ChatMessageResponseSchema(StrictModel):
    id: str
    ticket_id: str | None = None
    session_id: str
    role: PmChatRole
    content: str
    timestamp: str
    proposal: ChatProposalSchema | None = None
    customer_reply: ChatCustomerReplySchema | None = None
    created_ticket_id: str | None = None


class ChatSendMessageRequestSchema(StrictModel):
    content: str = Field(min_length=1, max_length=8000)


class ChatSessionDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    user_id: str
    ticket_id: str | None = None
    title: str
    preview: str
    created_at: datetime
    updated_at: datetime


class ChatMessageDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    session_id: str
    ticket_id: str | None = None
    role: PmChatRole
    content: str
    timestamp: datetime
    proposal: dict | None = None
    customer_reply: dict | None = None
    created_ticket_id: str | None = None


class InsightsOverviewResponseSchema(StrictModel):
    tickets_this_week: int
    acceptance_rate: float
    median_cycle_hours: float
    auto_resolved: int
    hours_saved: float
    pending: int
    accepted: int
    rejected: int
    ignored: int


class InsightsSeriesPointSchema(StrictModel):
    date: str
    processed: int
    accepted: int
    rejected: int


class AiPerformancePointSchema(StrictModel):
    date: str
    override_rate: float
    edit_rate: float
    acceptance_rate: float


class WebhookIngestRequestSchema(StrictModel):
    provider: TicketSource = "webhook"
    external_id: str | None = None
    subject: str | None = None
    body: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    customer_plan: str | None = None
    internal_notes: str | None = None


class WebhookIngestResponseSchema(StrictModel):
    ok: bool = True
    duplicate: bool
    ticket_id: str


class PipelineWebhookRequestSchema(StrictModel):
    ticket_id: str
    stage: str
    external_id: str | None = None
    branch_name: str | None = None
