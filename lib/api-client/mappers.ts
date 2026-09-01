import type {
  ActivityEntry,
  AgentDispatchConfig,
  AnomalyAlert,
  AuditLogEntry,
  AutoAcceptRule,
  AutomationPreset,
  Classification,
  Cluster,
  DeliveryConfig,
  DeliveryRecord,
  DeliveryTool,
  DispatchRecord,
  Integration,
  PipelineCard,
  PipelineStage,
  PmChatMessage,
  PmChatSession,
  Repo,
  Scope,
  TeamMember,
  Ticket,
  TicketStatus,
} from "@/lib/types";
import type { Workspace } from "@/lib/mock/workspaces";
import type { ProductDoc } from "@/lib/store/product-docs";
import type { TicketSourceConfig } from "@/lib/store/onboarding";

const WORKSPACE_PALETTES: Array<{ color: string; gradient: [string, string] }> = [
  { color: "bg-blue-500", gradient: ["#2563EB", "#0EA5E9"] },
  { color: "bg-teal-500", gradient: ["#0D9488", "#0891B2"] },
  { color: "bg-orange-500", gradient: ["#F97316", "#EF4444"] },
  { color: "bg-violet-500", gradient: ["#7C3AED", "#6366F1"] },
];

function hashHue(id: string) {
  return id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

export function mapWorkspace(raw: Record<string, unknown>, index = 0): Workspace {
  const palette = WORKSPACE_PALETTES[(index + hashHue(String(raw.id))) % WORKSPACE_PALETTES.length];
  return {
    id: String(raw.id),
    name: String(raw.name ?? "Workspace"),
    initials: String(raw.initials ?? "WS"),
    description: String(raw.description ?? ""),
    color: palette.color,
    gradient: palette.gradient,
  };
}

export function mapUser(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    emailVerified: Boolean(raw.email_verified),
    defaultWorkspaceId: (raw.default_workspace_id as string | null) ?? null,
  };
}

function mapCodeRef(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    filePath: String(raw.file_path ?? ""),
    functionName: raw.function_name ? String(raw.function_name) : undefined,
    lineStart: typeof raw.line_start === "number" ? raw.line_start : undefined,
    lineEnd: typeof raw.line_end === "number" ? raw.line_end : undefined,
    snippet: raw.snippet ? String(raw.snippet) : undefined,
    language: raw.language ? String(raw.language) : undefined,
  };
}

export function mapTicket(raw: Record<string, unknown>): Ticket {
  const customer = (raw.customer as Record<string, unknown>) ?? {};
  return {
    id: String(raw.id),
    status: raw.status as TicketStatus,
    classification: raw.classification as Classification,
    scope: raw.scope as Scope,
    draftTitle: String(raw.draft_title ?? ""),
    draftDescription: String(raw.draft_description ?? ""),
    suggestedApproach: String(raw.suggested_approach ?? ""),
    acceptanceCriteria: Array.isArray(raw.acceptance_criteria) ? (raw.acceptance_criteria as string[]) : [],
    scopeRationale: String(raw.scope_rationale ?? ""),
    codeRefs: Array.isArray(raw.code_refs)
      ? (raw.code_refs as Record<string, unknown>[]).map(mapCodeRef)
      : [],
    aiConfidence: typeof raw.ai_confidence === "number" ? raw.ai_confidence : undefined,
    aiConfidenceLevel: raw.ai_confidence_level as Ticket["aiConfidenceLevel"],
    aiReasoning: Array.isArray(raw.ai_reasoning)
      ? (raw.ai_reasoning as Record<string, unknown>[]).map((s) => ({
          label: String(s.label ?? ""),
          detail: String(s.detail ?? ""),
          weight: Number(s.weight ?? 0),
        }))
      : undefined,
    clusterId: raw.cluster_id ? String(raw.cluster_id) : undefined,
    priorityScore: typeof raw.priority_score === "number" ? raw.priority_score : undefined,
    customer: {
      id: String(customer.id ?? ""),
      name: String(customer.name ?? ""),
      email: String(customer.email ?? ""),
      plan: (customer.plan as Ticket["customer"]["plan"]) ?? "starter",
      avatarInitials: String(customer.avatar_initials ?? "CU"),
    },
    source: raw.source as Ticket["source"],
    resolution: raw.resolution as Ticket["resolution"],
    viaPmChat: Boolean(raw.via_pm_chat),
    linkedChatId: raw.linked_chat_id ? String(raw.linked_chat_id) : undefined,
    originalTicketId: String(raw.original_ticket_id ?? ""),
    originalSubject: String(raw.original_subject ?? ""),
    originalBody: String(raw.original_body ?? ""),
    conversation: Array.isArray(raw.conversation)
      ? (raw.conversation as Record<string, unknown>[]).map((m) => ({
          id: String(m.id),
          author: String(m.author ?? ""),
          authorType: (m.author_type as "customer" | "agent" | "internal") ?? "customer",
          content: String(m.content ?? ""),
          timestamp: String(m.timestamp ?? ""),
        }))
      : [],
    internalNotes: String(raw.internal_notes ?? ""),
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as Record<string, unknown>[]).map((a) => ({
          id: String(a.id),
          name: String(a.name ?? ""),
          type: String(a.type ?? ""),
          size: String(a.size ?? ""),
        }))
      : [],
    createdAt: String(raw.created_at ?? ""),
    processingState: raw.processing_state as Ticket["processingState"],
  };
}

export function mapActivity(raw: Record<string, unknown>): ActivityEntry {
  return {
    id: String(raw.id),
    action: raw.action as ActivityEntry["action"],
    ticketTitle: String(raw.ticket_title ?? ""),
    ticketId: String(raw.ticket_id ?? ""),
    timestamp: String(raw.timestamp ?? ""),
  };
}

export function mapCluster(raw: Record<string, unknown>): Cluster {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    ticketCount: Number(raw.ticket_count ?? 0),
    affectedCodeArea: String(raw.affected_code_area ?? ""),
    combinedScope: raw.combined_scope as Scope,
    representativeQuotes: Array.isArray(raw.representative_quotes)
      ? (raw.representative_quotes as string[])
      : [],
    tickets: Array.isArray(raw.tickets)
      ? (raw.tickets as Record<string, unknown>[]).map((t) => ({
          ticketId: String(t.ticket_id),
          title: String(t.title ?? ""),
          classification: t.classification as Classification,
          scope: t.scope as Scope,
        }))
      : [],
    createdAt: String(raw.created_at ?? ""),
  };
}

export function mapPipelineCard(raw: Record<string, unknown>): PipelineCard {
  return {
    id: String(raw.id),
    ticketId: String(raw.ticket_id),
    title: String(raw.title ?? ""),
    stage: raw.stage as PipelineStage,
    assigneeName: raw.assignee_name ? String(raw.assignee_name) : undefined,
    assigneeInitials: raw.assignee_initials ? String(raw.assignee_initials) : undefined,
    destinationTool: raw.destination_tool ? String(raw.destination_tool) : undefined,
    codeArea: raw.code_area ? String(raw.code_area) : undefined,
    externalId: raw.external_id ? String(raw.external_id) : undefined,
    stageEnteredAt: String(raw.stage_entered_at ?? ""),
  };
}

export function mapConnection(raw: Record<string, unknown>): Integration {
  return {
    id: String(raw.id),
    type: raw.type as Integration["type"],
    provider: String(raw.provider ?? ""),
    name: String(raw.name ?? ""),
    status: raw.status as Integration["status"],
    ticketCount: typeof raw.ticket_count === "number" ? raw.ticket_count : undefined,
    targetProject: raw.target_project ? String(raw.target_project) : undefined,
    connectedAt: raw.connected_at ? String(raw.connected_at) : undefined,
  };
}

export function mapRepo(raw: Record<string, unknown>): Repo {
  return {
    id: String(raw.id),
    platform: (raw.platform as Repo["platform"]) ?? "github",
    name: String(raw.name ?? ""),
    fullName: String(raw.full_name ?? ""),
    status: raw.status as Repo["status"],
    lastIndexed: String(raw.last_indexed ?? ""),
    selected: raw.selected !== false,
  };
}

export function mapTeamMember(raw: Record<string, unknown>): TeamMember {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    role: raw.role as TeamMember["role"],
    status: (raw.status as TeamMember["status"]) ?? "active",
    avatarInitials: String(raw.avatar_initials ?? "NM"),
  };
}

export function mapOnboarding(raw: Record<string, unknown>) {
  const sources = Array.isArray(raw.ticket_sources) ? (raw.ticket_sources as Record<string, unknown>[]) : [];
  return {
    step: (raw.step as string) ?? "1",
    isSetup: Boolean(raw.is_setup),
    workspaceRole: (raw.workspace_role as "pm" | "cs_agent") ?? "pm",
    ticketSources: sources.map(
      (s): TicketSourceConfig => ({
        provider: String(s.provider),
        status: (s.status as TicketSourceConfig["status"]) ?? "idle",
        issueCategories: Array.isArray(s.issue_categories)
          ? (s.issue_categories as TicketSourceConfig["issueCategories"])
          : [],
        accountLabel: s.account_label ? String(s.account_label) : undefined,
        connectedAt: s.connected_at ? String(s.connected_at) : undefined,
        lastImported: typeof s.last_imported === "number" ? s.last_imported : undefined,
      }),
    ),
    repoProvider: (raw.repo_provider as string | null) ?? null,
    repoProviderStatus: (raw.repo_provider_status as TicketSourceConfig["status"]) ?? "idle",
    selectedRepos: Array.isArray(raw.selected_repos) ? (raw.selected_repos as string[]) : [],
    outputTool: (raw.output_tool as string | null) ?? null,
    outputToolStatus: (raw.output_tool_status as TicketSourceConfig["status"]) ?? "idle",
    selectedProject: (raw.selected_project as string | null) ?? null,
    indexingStatus: (raw.indexing_status as string) ?? "idle",
    indexingStep: String(raw.indexing_step ?? ""),
  };
}

export function mapProductDoc(raw: Record<string, unknown>): ProductDoc {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    size: String(raw.size ?? ""),
    type: String(raw.type ?? ""),
  };
}

export function mapAutomation(raw: Record<string, unknown>) {
  return {
    preset: raw.preset as AutomationPreset,
    autoClassify: Boolean(raw.auto_classify),
    scopeEstimation: Boolean(raw.scope_estimation),
    autoDispatch: Boolean(raw.auto_dispatch),
    autoAcceptRules: Array.isArray(raw.auto_accept_rules)
      ? (raw.auto_accept_rules as Record<string, unknown>[]).map(
          (r): AutoAcceptRule => ({
            id: String(r.id),
            classification: r.classification as AutoAcceptRule["classification"],
            scope: r.scope as AutoAcceptRule["scope"],
            enabled: Boolean(r.enabled),
            action: r.action as AutoAcceptRule["action"],
            label: r.label ? String(r.label) : undefined,
          }),
        )
      : [],
  };
}

export function mapDeliveryConfig(raw: Record<string, unknown>): DeliveryConfig {
  return {
    enabled: Boolean(raw.enabled),
    defaultTool: (raw.default_tool as DeliveryTool) ?? "jira",
    autoDeliver: Boolean(raw.auto_deliver),
    defaultAssigneeId: String(raw.default_assignee_id ?? ""),
    toolWebhookUrl: String(raw.tool_webhook_url ?? ""),
    linearConfigured: Boolean(raw.linear_configured),
    linearTeamId: String(raw.linear_team_id ?? ""),
  };
}

export function mapDeliveryRecord(raw: Record<string, unknown>): DeliveryRecord {
  return {
    ticketId: String(raw.ticket_id),
    ticketTitle: String(raw.ticket_title ?? ""),
    assigneeId: String(raw.assignee_id ?? ""),
    assigneeName: String(raw.assignee_name ?? ""),
    assigneeInitials: String(raw.assignee_initials ?? ""),
    tool: raw.tool as DeliveryTool,
    externalUrl: raw.external_url ? String(raw.external_url) : undefined,
    externalId: raw.external_id ? String(raw.external_id) : undefined,
    status: raw.status as DeliveryRecord["status"],
    deliveredAt: String(raw.delivered_at ?? ""),
    error: raw.error ? String(raw.error) : undefined,
  };
}

export function mapDispatchConfig(raw: Record<string, unknown>): AgentDispatchConfig {
  return {
    enabled: Boolean(raw.enabled),
    agentType: (raw.agent_type as AgentDispatchConfig["agentType"]) ?? "claude-code",
    webhookUrl: String(raw.webhook_url ?? ""),
    branchPattern: (raw.branch_pattern as AgentDispatchConfig["branchPattern"]) ?? "fix/{id}",
    customBranchPattern: String(raw.custom_branch_pattern ?? ""),
    includeCodeRefs: raw.include_code_refs !== false,
    includeApproach: raw.include_approach !== false,
  };
}

export function mapDispatchRecord(raw: Record<string, unknown>): DispatchRecord {
  return {
    ticketId: String(raw.ticket_id),
    ticketTitle: String(raw.ticket_title ?? ""),
    status: raw.status as DispatchRecord["status"],
    dispatchedAt: String(raw.dispatched_at ?? ""),
    branchName: String(raw.branch_name ?? ""),
    agentType: raw.agent_type as DispatchRecord["agentType"],
    error: raw.error ? String(raw.error) : undefined,
  };
}

export function mapChatSession(raw: Record<string, unknown>): PmChatSession {
  return {
    id: String(raw.id),
    ticketId: raw.ticket_id ? String(raw.ticket_id) : undefined,
    title: String(raw.title ?? "New task"),
    preview: String(raw.preview ?? ""),
    updatedAt: String(raw.updated_at ?? ""),
    createdAt: String(raw.created_at ?? ""),
  };
}

export function mapChatMessage(raw: Record<string, unknown>): PmChatMessage {
  const proposal = raw.proposal as Record<string, unknown> | null | undefined;
  const reply = raw.customer_reply as Record<string, unknown> | null | undefined;
  return {
    id: String(raw.id),
    ticketId: raw.ticket_id ? String(raw.ticket_id) : undefined,
    sessionId: String(raw.session_id),
    role: raw.role as PmChatMessage["role"],
    content: String(raw.content ?? ""),
    timestamp: String(raw.timestamp ?? ""),
    proposal: proposal
      ? {
          title: String(proposal.title ?? ""),
          classification: proposal.classification as Classification,
          scope: proposal.scope as Scope,
          summary: String(proposal.summary ?? ""),
          severity: (proposal.severity as "simple" | "escalate") ?? "simple",
        }
      : undefined,
    customerReply: reply
      ? {
          subject: String(reply.subject ?? ""),
          body: String(reply.body ?? ""),
          channel: String(reply.channel ?? ""),
          customerName: String(reply.customer_name ?? ""),
        }
      : undefined,
    createdTicketId: raw.created_ticket_id ? String(raw.created_ticket_id) : undefined,
  };
}

export function mapAlert(raw: Record<string, unknown>): AnomalyAlert {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    ticketIds: Array.isArray(raw.ticket_ids) ? (raw.ticket_ids as string[]) : [],
    clusterId: raw.cluster_id ? String(raw.cluster_id) : undefined,
    severity: raw.severity as AnomalyAlert["severity"],
    createdAt: String(raw.created_at ?? ""),
    dismissed: Boolean(raw.dismissed),
  };
}

export function mapAudit(raw: Record<string, unknown>): AuditLogEntry {
  return {
    id: String(raw.id),
    action: String(raw.action ?? ""),
    actor: String(raw.actor ?? ""),
    actorType: (raw.actor_type as AuditLogEntry["actorType"]) ?? "user",
    detail: String(raw.detail ?? ""),
    ticketId: raw.ticket_id ? String(raw.ticket_id) : undefined,
    ticketTitle: raw.ticket_title ? String(raw.ticket_title) : undefined,
    timestamp: String(raw.timestamp ?? ""),
  };
}
