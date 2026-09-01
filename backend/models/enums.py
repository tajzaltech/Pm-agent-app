from __future__ import annotations

from typing import Literal

Classification = Literal["bug", "feature_request", "question", "churn_signal"]
Scope = Literal["S", "M", "L"]
TicketStatus = Literal["pending", "accepted", "rejected", "ignored"]
TicketResolution = Literal["dev", "non_technical"]
ConfidenceLevel = Literal["high", "medium", "low"]
PipelineStage = Literal["accepted", "assigned", "dev_working", "pr_open", "merged", "shipped"]
AutomationPreset = Literal["conservative", "balanced", "aggressive"]
AuditActorType = Literal["user", "automation"]
IntegrationStatus = Literal["disconnected", "connecting", "connected", "error"]
UserRole = Literal["owner", "admin", "user"]
RepoStatus = Literal["indexed", "indexing", "error", "needs_reindex"]
ActivityAction = Literal[
    "accepted",
    "rejected",
    "ignored",
    "edited",
    "edited_accepted",
    "new_draft",
    "accepted_non_technical",
]
TicketSource = Literal[
    "freshdesk",
    "zendesk",
    "jira_sm",
    "salesforce",
    "sheets",
    "webhook",
    "email",
    "pm_chat",
]
CustomerPlan = Literal["starter", "growth", "enterprise"]
DeliveryTool = Literal["jira", "linear", "github", "clickup", "asana", "trello"]
DeliveryStatus = Literal["idle", "delivering", "delivered", "failed"]
AgentType = Literal["claude-code", "cursor", "custom"]
DispatchStatus = Literal["idle", "dispatching", "dispatched", "failed"]
BranchPattern = Literal["fix/{id}", "feat/{id}", "custom"]
WorkspaceRole = Literal["pm", "cs_agent"]
IssueCategory = Literal[
    "bug",
    "suggestion",
    "feature_request",
    "how_to",
    "billing",
    "complaint",
    "major_outage",
]
PmChatRole = Literal["user", "pm", "system"]
ReviewAction = Literal["accept", "reject", "ignore", "accept_non_technical"]
ProviderStatus = Literal["idle", "connecting", "connected", "error"]
OnboardingStep = Literal["1", "2", "3", "4", "indexing", "done"]
AlertSeverity = Literal["low", "medium", "high"]
ConnectionType = Literal["source", "repo", "output"]
TokenKind = Literal["email_verify", "password_reset", "refresh"]
DocIndexStatus = Literal["pending", "indexed", "failed"]
RuleAction = Literal["auto_accept", "auto_reply", "escalate", "tag"]
PipelineStageOrder: tuple[str, ...] = (
    "accepted",
    "assigned",
    "dev_working",
    "pr_open",
    "merged",
    "shipped",
)
