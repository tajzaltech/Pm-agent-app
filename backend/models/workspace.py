from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, Field

from models.common import ORMModel, StrictModel
from models.enums import UserRole, WorkspaceRole


class WorkspaceCreateRequestSchema(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=280)


class WorkspaceUpdateRequestSchema(StrictModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=280)


class WorkspaceResponseSchema(StrictModel):
    id: str
    name: str
    slug: str
    description: str
    initials: str
    role: UserRole
    created_at: str


class WorkspaceDBModel(ORMModel):
    id: str = Field(alias="_id")
    name: str
    slug: str
    description: str = ""
    initials: str
    owner_id: str
    created_at: datetime
    updated_at: datetime


class MemberInviteRequestSchema(StrictModel):
    email: str = Field(min_length=3, max_length=254)
    role: UserRole = "user"
    name: str | None = Field(default=None, max_length=120)


class MemberUpdateRequestSchema(StrictModel):
    role: UserRole


class TeamMemberResponseSchema(StrictModel):
    # COMPLIANCE: PII — name, email.
    id: str
    user_id: str | None = None
    name: str
    email: str
    role: UserRole
    status: str
    avatar_initials: str


class OnboardingConnectSourceRequestSchema(StrictModel):
    provider: str = Field(min_length=1, max_length=40)
    account_label: str | None = Field(default=None, max_length=160)
    domain: str | None = Field(default=None, max_length=200)
    api_key: str | None = Field(default=None, max_length=400)
    email: str | None = Field(default=None, max_length=254)
    password: str | None = Field(default=None, max_length=400)
    imap_host: str | None = Field(default=None, max_length=200)
    spreadsheet_id: str | None = Field(default=None, max_length=120)
    sheet_name: str | None = Field(default=None, max_length=120)
    instance_url: str | None = Field(default=None, max_length=200)
    client_id: str | None = Field(default=None, max_length=400)
    client_secret: str | None = Field(default=None, max_length=400)
    security_token: str | None = Field(default=None, max_length=200)


class OnboardingConnectRepoRequestSchema(StrictModel):
    provider: str = Field(min_length=1, max_length=40)
    repos: list[str] = Field(default_factory=list)
    access_token: str | None = Field(default=None, max_length=400)


class OnboardingConnectOutputRequestSchema(StrictModel):
    tool: str = Field(min_length=1, max_length=40)
    project: str | None = Field(default=None, max_length=160)
    api_key: str | None = Field(default=None, max_length=400)
    team_id: str | None = Field(default=None, max_length=120)


class TicketSourceConfigSchema(StrictModel):
    model_config = ConfigDict(extra="ignore")
    provider: str
    status: str
    issue_categories: list[str]
    account_label: str | None = None
    connected_at: str | None = None
    last_imported: int | None = None


class SourceSyncRequestSchema(StrictModel):
    provider: str = Field(min_length=1, max_length=40)


class SourceSyncResponseSchema(StrictModel):
    provider: str
    imported: int
    skipped: int


class OnboardingResponseSchema(StrictModel):
    step: str
    is_setup: bool
    workspace_role: WorkspaceRole
    ticket_sources: list[TicketSourceConfigSchema]
    repo_provider: str | None
    repo_provider_status: str
    selected_repos: list[str]
    output_tool: str | None
    output_tool_status: str
    selected_project: str | None
    indexing_status: str
    indexing_step: str


class OnboardingPatchRequestSchema(StrictModel):
    step: str | None = None
    workspace_role: WorkspaceRole | None = None
    selected_repos: list[str] | None = None
    selected_project: str | None = None


class OnboardingDBModel(ORMModel):
    id: str = Field(alias="_id")
    workspace_id: str
    step: str = "1"
    is_setup: bool = False
    workspace_role: WorkspaceRole = "pm"
    ticket_sources: list[dict] = Field(default_factory=list)
    repo_provider: str | None = None
    repo_provider_status: str = "idle"
    selected_repos: list[str] = Field(default_factory=list)
    output_tool: str | None = None
    output_tool_status: str = "idle"
    selected_project: str | None = None
    indexing_status: str = "idle"
    indexing_step: str = ""
    updated_at: datetime
