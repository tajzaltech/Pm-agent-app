from __future__ import annotations

from datetime import datetime

from pydantic import Field

from models.common import ORMModel, StrictModel
from models.enums import (
    AgentType,
    AlertSeverity,
    AuditActorType,
    AutomationPreset,
    BranchPattern,
    Classification,
    ConnectionType,
    DeliveryStatus,
    DeliveryTool,
    DispatchStatus,
    DocIndexStatus,
    IntegrationStatus,
    PipelineStage,
    RepoStatus,
    RuleAction,
    Scope,
)


class PipelineCardResponseSchema(StrictModel):
    id: str
    ticket_id: str
    title: str
    stage: PipelineStage
    assignee_name: str | None = None
    assignee_initials: str | None = None
    destination_tool: str | None = None
    code_area: str | None = None
    external_id: str | None = None
    stage_entered_at: str


class PipelineMoveRequestSchema(StrictModel):
    stage: PipelineStage


class PipelineCardDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    ticket_id: str
    title: str
    stage: PipelineStage
    assignee_name: str | None = None
    assignee_initials: str | None = None
    destination_tool: str | None = None
    code_area: str | None = None
    external_id: str | None = None
    stage_entered_at: datetime


class ConnectionResponseSchema(StrictModel):
    id: str
    type: ConnectionType
    provider: str
    name: str
    status: IntegrationStatus
    ticket_count: int | None = None
    target_project: str | None = None
    connected_at: str | None = None


class RepoResponseSchema(StrictModel):
    id: str
    platform: str
    name: str
    full_name: str
    status: RepoStatus
    last_indexed: str
    selected: bool = True


class ConnectionCreateRequestSchema(StrictModel):
    provider: str = Field(min_length=1, max_length=40)
    name: str | None = Field(default=None, max_length=120)
    target_project: str | None = None
    api_key: str | None = Field(default=None, max_length=400)
    team_id: str | None = Field(default=None, max_length=120)
    domain: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=254)
    password: str | None = Field(default=None, max_length=400)
    imap_host: str | None = Field(default=None, max_length=200)
    spreadsheet_id: str | None = Field(default=None, max_length=120)
    sheet_name: str | None = Field(default=None, max_length=120)
    instance_url: str | None = Field(default=None, max_length=200)
    client_id: str | None = Field(default=None, max_length=400)
    client_secret: str | None = Field(default=None, max_length=400)
    security_token: str | None = Field(default=None, max_length=200)


class RepoCreateRequestSchema(StrictModel):
    full_name: str = Field(min_length=3, max_length=200)
    platform: str = "github"
    access_token: str | None = Field(default=None, max_length=400)


class IngestSettingsResponseSchema(StrictModel):
    workspace_id: str
    secret: str
    path: str


class DevAgentPatchRequestSchema(StrictModel):
    enabled: bool


class ConnectionsBundleResponseSchema(StrictModel):
    sources: list[ConnectionResponseSchema]
    outputs: list[ConnectionResponseSchema]
    repos: list[RepoResponseSchema]
    dev_agent_enabled: bool


class ConnectionDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    type: ConnectionType
    provider: str
    name: str
    status: IntegrationStatus
    ticket_count: int | None = None
    target_project: str | None = None
    connected_at: datetime | None = None
    dev_agent_enabled: bool = False


class RepoDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    platform: str
    name: str
    full_name: str
    status: RepoStatus
    last_indexed: datetime
    selected: bool = True


class ProductDocResponseSchema(StrictModel):
    id: str
    name: str
    size: str
    type: str
    indexing_status: DocIndexStatus
    created_at: str


class ProductDocPresignRequestSchema(StrictModel):
    name: str = Field(min_length=1, max_length=240)
    content_type: str = Field(min_length=1, max_length=120)
    size_bytes: int = Field(gt=0)


class ProductDocPresignResponseSchema(StrictModel):
    upload_url: str
    object_key: str
    expires_in: int
    doc_id: str


class ProductDocConfirmRequestSchema(StrictModel):
    doc_id: str
    name: str
    size: str
    type: str


class ProductDocDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    name: str
    size: str
    type: str
    object_key: str
    indexing_status: DocIndexStatus
    created_at: datetime


class AutoAcceptRuleSchema(StrictModel):
    id: str
    classification: Classification | str
    scope: Scope | str
    enabled: bool
    action: RuleAction = "auto_accept"
    label: str | None = None


class AutoAcceptRuleCreateRequestSchema(StrictModel):
    classification: Classification | str = "any"
    scope: Scope | str = "any"
    enabled: bool = True
    action: RuleAction = "auto_accept"
    label: str | None = None


class AutomationResponseSchema(StrictModel):
    preset: AutomationPreset
    auto_classify: bool
    scope_estimation: bool
    auto_dispatch: bool
    auto_accept_rules: list[AutoAcceptRuleSchema]


class AutomationPatchRequestSchema(StrictModel):
    preset: AutomationPreset | None = None
    auto_classify: bool | None = None
    scope_estimation: bool | None = None
    auto_dispatch: bool | None = None


class PresetRequestSchema(StrictModel):
    preset: AutomationPreset


class RulePreviewRequestSchema(StrictModel):
    classification: Classification | str = "any"
    scope: Scope | str = "any"


class AutomationDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    preset: AutomationPreset
    auto_classify: bool
    scope_estimation: bool
    auto_dispatch: bool
    auto_accept_rules: list[dict]
    updated_at: datetime


class DeliveryConfigSchema(StrictModel):
    enabled: bool
    default_tool: DeliveryTool
    auto_deliver: bool
    default_assignee_id: str
    tool_webhook_url: str = ""
    linear_configured: bool = False
    linear_team_id: str = ""
    linear_api_key: str | None = None


class DeliveryRecordSchema(StrictModel):
    ticket_id: str
    ticket_title: str
    assignee_id: str
    assignee_name: str
    assignee_initials: str
    tool: DeliveryTool
    external_url: str | None = None
    external_id: str | None = None
    status: DeliveryStatus
    delivered_at: str
    error: str | None = None


class DeliveryRequestSchema(StrictModel):
    ticket_id: str
    assignee_id: str
    assignee_name: str
    assignee_initials: str
    tool: DeliveryTool


class DeliveryConfigDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    enabled: bool
    default_tool: DeliveryTool
    auto_deliver: bool
    default_assignee_id: str
    tool_webhook_url: str
    updated_at: datetime


class DeliveryRecordDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    ticket_id: str
    ticket_title: str
    assignee_id: str
    assignee_name: str
    assignee_initials: str
    tool: DeliveryTool
    external_url: str | None = None
    external_id: str | None = None
    status: DeliveryStatus
    delivered_at: datetime
    error: str | None = None


class DispatchConfigSchema(StrictModel):
    enabled: bool
    agent_type: AgentType
    webhook_url: str = ""
    branch_pattern: BranchPattern
    custom_branch_pattern: str = ""
    include_code_refs: bool
    include_approach: bool


class DispatchRecordSchema(StrictModel):
    ticket_id: str
    ticket_title: str
    status: DispatchStatus
    dispatched_at: str
    branch_name: str
    agent_type: AgentType
    error: str | None = None


class DispatchRequestSchema(StrictModel):
    ticket_id: str
    branch_name: str | None = None
    agent_type: AgentType | None = None
    webhook_url: str | None = None


class DispatchConfigDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    enabled: bool
    agent_type: AgentType
    webhook_url: str
    branch_pattern: BranchPattern
    custom_branch_pattern: str
    include_code_refs: bool
    include_approach: bool
    updated_at: datetime


class DispatchRecordDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    ticket_id: str
    ticket_title: str
    status: DispatchStatus
    dispatched_at: datetime
    branch_name: str
    agent_type: AgentType
    error: str | None = None


class AlertResponseSchema(StrictModel):
    id: str
    title: str
    description: str
    ticket_ids: list[str]
    cluster_id: str | None = None
    severity: AlertSeverity
    created_at: str
    dismissed: bool
    snoozed_until: str | None = None


class AlertDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    title: str
    description: str
    ticket_ids: list[str]
    cluster_id: str | None = None
    severity: AlertSeverity
    created_at: datetime
    dismissed: bool = False
    snoozed_until: datetime | None = None


class AuditLogResponseSchema(StrictModel):
    id: str
    action: str
    actor: str
    actor_type: AuditActorType
    detail: str
    ticket_id: str | None = None
    ticket_title: str | None = None
    timestamp: str


class AuditLogDBModel(ORMModel):
    # COMPLIANCE: audit trail. Actor display name is stored; prefer user_id for identity.
    id: str = Field(alias="_id")
    workspace_id: str
    action: str
    actor: str
    actor_user_id: str | None = None
    actor_type: AuditActorType
    detail: str
    ticket_id: str | None = None
    ticket_title: str | None = None
    timestamp: datetime
