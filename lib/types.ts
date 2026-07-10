export type Classification = "bug" | "feature_request" | "question" | "churn_signal";
export type Scope = "S" | "M" | "L";
export type TicketStatus = "pending" | "accepted" | "rejected" | "ignored";
export type TicketResolution = "dev" | "non_technical";
export type ConfidenceLevel = "high" | "medium" | "low";
export type PipelineStage = "accepted" | "assigned" | "dev_working" | "pr_open" | "merged" | "shipped";
export type AutomationPreset = "conservative" | "balanced" | "aggressive";
export type AuditActorType = "user" | "automation";
export type IntegrationStatus = "disconnected" | "connecting" | "connected" | "error";
export type UserRole = "owner" | "admin" | "user";
export type RepoStatus = "indexed" | "indexing" | "error" | "needs_reindex";
export type ActivityAction =
  | "accepted"
  | "rejected"
  | "ignored"
  | "edited"
  | "edited_accepted"
  | "new_draft"
  | "accepted_non_technical";

export interface Customer {
  id: string;
  name: string;
  email: string;
  plan: "starter" | "growth" | "enterprise";
  avatarInitials: string;
}

export interface ConversationMessage {
  id: string;
  author: string;
  authorType: "customer" | "agent" | "internal";
  content: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
}

export interface CodeRef {
  id: string;
  filePath: string;
  functionName?: string;
  lineStart?: number;
  lineEnd?: number;
  snippet?: string;
  language?: string;
}

export interface ReasoningSignal {
  label: string;
  detail: string;
  weight: number;
}

export interface Ticket {
  id: string;
  status: TicketStatus;
  classification: Classification;
  scope: Scope;
  draftTitle: string;
  draftDescription: string;
  suggestedApproach: string;
  acceptanceCriteria: string[];
  scopeRationale: string;
  codeRefs: CodeRef[];
  aiConfidence?: number;
  aiConfidenceLevel?: ConfidenceLevel;
  aiReasoning?: ReasoningSignal[];
  clusterId?: string;
  priorityScore?: number;

  // Customer / source
  customer: Customer;
  source: "freshdesk" | "zendesk" | "jira_sm" | "salesforce" | "sheets" | "webhook" | "email" | "pm_chat";
  resolution?: TicketResolution;
  viaPmChat?: boolean;
  linkedChatId?: string;
  originalTicketId: string;
  originalSubject: string;
  originalBody: string;
  conversation: ConversationMessage[];
  internalNotes: string;
  attachments: Attachment[];
  createdAt: string;
  processingState?: "analyzing" | "no_code_match";
}

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  ticketTitle: string;
  ticketId: string;
  timestamp: string;
}

export interface Repo {
  id: string;
  platform: "github" | "bitbucket";
  name: string;
  fullName: string;
  status: RepoStatus;
  lastIndexed: string;
  selected: boolean;
}

export interface Integration {
  id: string;
  type: "source" | "repo" | "output";
  provider: string;
  name: string;
  status: IntegrationStatus;
  ticketCount?: number;
  targetProject?: string;
  connectedAt?: string;
}

export interface ClusterTicketRef {
  ticketId: string;
  title: string;
  classification: Classification;
  scope: Scope;
}

export interface Cluster {
  id: string;
  title: string;
  description: string;
  ticketCount: number;
  affectedCodeArea: string;
  combinedScope: Scope;
  representativeQuotes: string[];
  tickets: ClusterTicketRef[];
  createdAt: string;
}

export interface AnomalyAlert {
  id: string;
  title: string;
  description: string;
  ticketIds: string[];
  clusterId?: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  dismissed: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "invited";
  avatarInitials: string;
}

export interface AutoAcceptRule {
  id: string;
  classification: Classification | "any";
  scope: Scope | "any";
  enabled: boolean;
}

export interface Preferences {
  autoClassify: boolean;
  scopeEstimation: boolean;
  notifications: {
    emailDigest: "daily" | "weekly" | "off";
    realTime: boolean;
  };
  autoAcceptRules: AutoAcceptRule[];
  ticketTemplate: {
    description: boolean;
    codeContext: boolean;
    acceptanceCriteria: boolean;
    suggestedApproach: boolean;
  };
}

// Delivery flow — assign ticket to dev + push to PM tool
export type DeliveryTool = "jira" | "linear" | "github" | "clickup" | "asana" | "trello";
export type DeliveryStatus = "idle" | "delivering" | "delivered" | "failed";
export type TicketPriority = "urgent" | "high" | "medium" | "low";

export interface DeliveryRecord {
  ticketId: string;
  ticketTitle: string;
  assigneeId: string;
  assigneeName: string;
  assigneeInitials: string;
  tool: DeliveryTool;
  externalUrl?: string;
  externalId?: string;
  status: DeliveryStatus;
  deliveredAt: string;
  error?: string;
}

export interface DeliveryConfig {
  enabled: boolean;
  defaultTool: DeliveryTool;
  autoDeliver: boolean;
  defaultAssigneeId: string;
  toolWebhookUrl: string;
}

export interface AnalyticsSeries {
  date: string;
  processed: number;
  accepted: number;
  rejected: number;
}

export type AgentType = "claude-code" | "cursor" | "custom";
export type DispatchStatus = "idle" | "dispatching" | "dispatched" | "failed";
export type BranchPattern = "fix/{id}" | "feat/{id}" | "custom";

export interface AgentDispatchConfig {
  enabled: boolean;
  agentType: AgentType;
  webhookUrl: string;
  branchPattern: BranchPattern;
  customBranchPattern: string;
  includeCodeRefs: boolean;
  includeApproach: boolean;
}

export interface DispatchRecord {
  ticketId: string;
  ticketTitle: string;
  status: DispatchStatus;
  dispatchedAt: string;
  branchName: string;
  agentType: AgentType;
  error?: string;
}

export interface AutoAcceptRule {
  id: string;
  classification: Classification | "any";
  scope: Scope | "any";
  enabled: boolean;
  action?: "auto_accept" | "auto_reply" | "escalate" | "tag";
  label?: string;
}

export interface PipelineCard {
  id: string;
  ticketId: string;
  title: string;
  stage: PipelineStage;
  assigneeName?: string;
  assigneeInitials?: string;
  destinationTool?: string;
  codeArea?: string;
  externalId?: string;
  stageEnteredAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  actorType: AuditActorType;
  detail: string;
  ticketId?: string;
  ticketTitle?: string;
  timestamp: string;
}

export interface AiPerformancePoint {
  date: string;
  overrideRate: number;
  editRate: number;
  acceptanceRate: number;
}

export type WorkspaceRole = "pm" | "cs_agent";
export type IssueCategory =
  | "bug"
  | "suggestion"
  | "feature_request"
  | "how_to"
  | "billing"
  | "complaint"
  | "major_outage";

export type PmChatRole = "user" | "pm" | "system";

export interface PmChatCustomerReply {
  subject: string;
  body: string;
  channel: string;
  customerName: string;
}

export interface PmChatMessage {
  id: string;
  ticketId?: string;
  sessionId: string;
  role: PmChatRole;
  content: string;
  timestamp: string;
  proposal?: PmChatTicketProposal;
  customerReply?: PmChatCustomerReply;
  createdTicketId?: string;
}

export interface PmChatTicketProposal {
  title: string;
  classification: Classification;
  scope: Scope;
  summary: string;
  severity: "simple" | "escalate";
}

export interface PmChatSession {
  id: string;
  ticketId?: string;
  title: string;
  preview: string;
  updatedAt: string;
  createdAt: string;
}
