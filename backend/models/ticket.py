from __future__ import annotations

from datetime import datetime

from pydantic import Field

from models.common import ORMModel, StrictModel
from models.enums import (
    ActivityAction,
    Classification,
    ConfidenceLevel,
    CustomerPlan,
    ReviewAction,
    Scope,
    TicketResolution,
    TicketSource,
    TicketStatus,
)


class CustomerSchema(StrictModel):
    # COMPLIANCE: PII — name, email.
    id: str
    name: str
    email: str
    plan: CustomerPlan
    avatar_initials: str


class ConversationMessageSchema(StrictModel):
    id: str
    author: str
    author_type: str
    content: str
    timestamp: str


class AttachmentSchema(StrictModel):
    id: str
    name: str
    type: str
    size: str


class CodeRefSchema(StrictModel):
    id: str
    file_path: str
    function_name: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    snippet: str | None = None
    language: str | None = None


class ReasoningSignalSchema(StrictModel):
    label: str
    detail: str
    weight: float


class TicketResponseSchema(StrictModel):
    id: str
    status: TicketStatus
    classification: Classification
    scope: Scope
    draft_title: str
    draft_description: str
    suggested_approach: str
    acceptance_criteria: list[str]
    scope_rationale: str
    code_refs: list[CodeRefSchema]
    ai_confidence: float | None = None
    ai_confidence_level: ConfidenceLevel | None = None
    ai_reasoning: list[ReasoningSignalSchema] = Field(default_factory=list)
    cluster_id: str | None = None
    priority_score: float | None = None
    customer: CustomerSchema
    source: TicketSource
    resolution: TicketResolution | None = None
    via_pm_chat: bool = False
    linked_chat_id: str | None = None
    original_ticket_id: str
    original_subject: str
    original_body: str
    conversation: list[ConversationMessageSchema]
    internal_notes: str
    attachments: list[AttachmentSchema]
    created_at: str
    processing_state: str | None = None


class TicketListResponseSchema(StrictModel):
    tickets: list[TicketResponseSchema]
    activity: list["ActivityResponseSchema"]
    total: int


class TicketCreateFromChatRequestSchema(StrictModel):
    title: str = Field(min_length=1, max_length=240)
    classification: Classification
    scope: Scope
    description: str = Field(min_length=1, max_length=8000)
    chat_session_id: str


class TicketPatchRequestSchema(StrictModel):
    draft_title: str | None = Field(default=None, max_length=240)
    draft_description: str | None = None
    suggested_approach: str | None = None
    acceptance_criteria: list[str] | None = None
    classification: Classification | None = None
    scope: Scope | None = None
    internal_notes: str | None = None


class TicketReviewRequestSchema(StrictModel):
    action: ReviewAction
    updates: TicketPatchRequestSchema | None = None


class ActivityResponseSchema(StrictModel):
    id: str
    action: ActivityAction
    ticket_title: str
    ticket_id: str
    timestamp: str


class TicketDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    status: TicketStatus
    classification: Classification
    scope: Scope
    draft_title: str
    draft_description: str
    suggested_approach: str
    acceptance_criteria: list[str]
    scope_rationale: str
    code_refs: list[dict]
    ai_confidence: float | None = None
    ai_confidence_level: str | None = None
    ai_reasoning: list[dict] = Field(default_factory=list)
    cluster_id: str | None = None
    priority_score: float | None = None
    customer: dict
    source: TicketSource
    resolution: str | None = None
    via_pm_chat: bool = False
    linked_chat_id: str | None = None
    original_ticket_id: str
    original_subject: str
    original_body: str
    conversation: list[dict] = Field(default_factory=list)
    internal_notes: str = ""
    attachments: list[dict] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    processing_state: str | None = None


class ActivityDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    action: ActivityAction
    ticket_title: str
    ticket_id: str
    timestamp: datetime


class ClusterTicketRefSchema(StrictModel):
    ticket_id: str
    title: str
    classification: Classification
    scope: Scope


class ClusterResponseSchema(StrictModel):
    id: str
    title: str
    description: str
    ticket_count: int
    affected_code_area: str
    combined_scope: Scope
    representative_quotes: list[str]
    tickets: list[ClusterTicketRefSchema]
    created_at: str


class ClusterReviewRequestSchema(StrictModel):
    action: ReviewAction


class ClusterDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    title: str
    description: str
    ticket_count: int
    affected_code_area: str
    combined_scope: Scope
    representative_quotes: list[str]
    tickets: list[dict]
    created_at: datetime
