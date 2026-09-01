import type { Classification, DeliveryTool, PipelineStage, Scope, Ticket, UserRole } from "@/lib/types";

import { apiRequest } from "./http";
import {
  mapActivity,
  mapAlert,
  mapAudit,
  mapAutomation,
  mapChatMessage,
  mapChatSession,
  mapCluster,
  mapConnection,
  mapDeliveryConfig,
  mapDeliveryRecord,
  mapDispatchConfig,
  mapDispatchRecord,
  mapOnboarding,
  mapPipelineCard,
  mapProductDoc,
  mapRepo,
  mapTeamMember,
  mapTicket,
  mapUser,
  mapWorkspace,
} from "./mappers";
import { setSession } from "./session";

type Dict = Record<string, unknown>;

function asDict(value: unknown): Dict {
  return value && typeof value === "object" ? (value as Dict) : {};
}

function asList(value: unknown): Dict[] {
  return Array.isArray(value) ? (value as Dict[]) : [];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: ReturnType<typeof mapUser>;
}

function mapAuth(raw: Dict): AuthSession {
  const user = mapUser(asDict(raw.user));
  const session: AuthSession = {
    accessToken: String(raw.access_token ?? ""),
    refreshToken: String(raw.refresh_token ?? ""),
    user,
  };
  setSession({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    workspaceId: user.defaultWorkspaceId,
  });
  return session;
}

export const api = {
  async signup(body: { name: string; email: string; password: string; company: string }) {
    return mapAuth(await apiRequest<Dict>("/auth/signup", { method: "POST", body, auth: false }));
  },
  async signin(body: { email: string; password: string }) {
    return mapAuth(await apiRequest<Dict>("/auth/signin", { method: "POST", body, auth: false }));
  },
  async googleAuth(body: { code: string; company?: string }) {
    return mapAuth(await apiRequest<Dict>("/auth/google", { method: "POST", body, auth: false }));
  },
  async signout() {
    await apiRequest("/auth/signout", { method: "POST" }).catch(() => undefined);
  },
  async me() {
    return mapUser(await apiRequest<Dict>("/auth/me"));
  },
  async forgotPassword(email: string) {
    await apiRequest("/auth/forgot-password", { method: "POST", body: { email }, auth: false });
  },
  async resetPassword(token: string, password: string) {
    await apiRequest("/auth/reset-password", { method: "POST", body: { token, password }, auth: false });
  },
  async verifyEmail(token: string) {
    await apiRequest("/auth/verify-email", { method: "POST", body: { token }, auth: false });
  },

  async listWorkspaces() {
    const data = await apiRequest<Dict>("/workspaces");
    return asList(data.items).map((item, i) => mapWorkspace(item, i));
  },

  async listTeam() {
    const data = await apiRequest<Dict>("/team");
    return asList(data.items).map(mapTeamMember);
  },
  async inviteMember(email: string, role: UserRole, name?: string) {
    return mapTeamMember(await apiRequest<Dict>("/team/invites", { method: "POST", body: { email, role, name } }));
  },
  async removeMember(memberId: string) {
    await apiRequest(`/team/${memberId}`, { method: "DELETE" });
  },

  async getOnboarding() {
    return mapOnboarding(await apiRequest<Dict>("/onboarding"));
  },
  async connectSource(provider: string, creds?: import("@/lib/constants/source-connect").SourceCredentials) {
    return mapOnboarding(
      await apiRequest<Dict>("/onboarding/connect-source", {
        method: "POST",
        body: {
          provider,
          account_label: creds?.accountLabel,
          domain: creds?.domain,
          api_key: creds?.apiKey,
          email: creds?.email,
          password: creds?.password,
          imap_host: creds?.imapHost,
          spreadsheet_id: creds?.spreadsheetId,
          sheet_name: creds?.sheetName,
          instance_url: creds?.instanceUrl,
          client_id: creds?.clientId,
          client_secret: creds?.clientSecret,
          security_token: creds?.securityToken,
        },
      }),
    );
  },
  async syncSource(provider: string) {
    return apiRequest<{ provider: string; imported: number; skipped: number }>("/onboarding/sync-source", {
      method: "POST",
      body: { provider },
    });
  },
  async connectRepo(provider: string, repos: string[], accessToken?: string) {
    return mapOnboarding(
      await apiRequest<Dict>("/onboarding/connect-repo", {
        method: "POST",
        body: { provider, repos, access_token: accessToken },
      }),
    );
  },
  async connectOutput(tool: string, project?: string, creds?: { apiKey?: string; teamId?: string }) {
    return mapOnboarding(
      await apiRequest<Dict>("/onboarding/connect-output", {
        method: "POST",
        body: { tool, project, api_key: creds?.apiKey, team_id: creds?.teamId },
      }),
    );
  },
  async completeOnboarding() {
    return mapOnboarding(await apiRequest<Dict>("/onboarding/complete", { method: "POST" }));
  },

  async listTickets(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = await apiRequest<Dict>(`/tickets${query}`);
    return {
      tickets: asList(data.tickets).map(mapTicket),
      activity: asList(data.activity).map(mapActivity),
    };
  },
  async createTicket(payload: {
    title: string;
    classification: Classification;
    scope: Scope;
    description: string;
    chatSessionId: string;
  }) {
    return mapTicket(
      await apiRequest<Dict>("/tickets", {
        method: "POST",
        body: {
          title: payload.title,
          classification: payload.classification,
          scope: payload.scope,
          description: payload.description,
          chat_session_id: payload.chatSessionId,
        },
      }),
    );
  },
  async patchTicket(id: string, updates: Partial<Ticket>) {
    return mapTicket(
      await apiRequest<Dict>(`/tickets/${id}`, {
        method: "PATCH",
        body: {
          draft_title: updates.draftTitle,
          draft_description: updates.draftDescription,
          suggested_approach: updates.suggestedApproach,
          acceptance_criteria: updates.acceptanceCriteria,
          classification: updates.classification,
          scope: updates.scope,
          internal_notes: updates.internalNotes,
        },
      }),
    );
  },
  async reviewTicket(
    id: string,
    action: "accept" | "reject" | "ignore" | "accept_non_technical",
    updates?: Partial<Ticket>,
  ) {
    return mapTicket(
      await apiRequest<Dict>(`/tickets/${id}/review`, {
        method: "POST",
        body: {
          action,
          updates: updates
            ? {
                draft_title: updates.draftTitle,
                draft_description: updates.draftDescription,
                suggested_approach: updates.suggestedApproach,
                acceptance_criteria: updates.acceptanceCriteria,
                classification: updates.classification,
                scope: updates.scope,
              }
            : undefined,
        },
      }),
    );
  },

  async listClusters() {
    return (await apiRequest<Dict[]>("/clusters")).map(mapCluster);
  },

  async listPipeline() {
    return (await apiRequest<Dict[]>("/pipeline")).map(mapPipelineCard);
  },
  async movePipeline(cardId: string, stage: PipelineStage) {
    return mapPipelineCard(await apiRequest<Dict>(`/pipeline/${cardId}`, { method: "PATCH", body: { stage } }));
  },

  async getConnections() {
    const data = await apiRequest<Dict>("/connections");
    return {
      sources: asList(data.sources).map(mapConnection),
      outputs: asList(data.outputs).map(mapConnection),
      repos: asList(data.repos).map(mapRepo),
      devAgentEnabled: Boolean(data.dev_agent_enabled),
    };
  },
  async addSource(provider: string) {
    return mapConnection(await apiRequest<Dict>("/connections/sources", { method: "POST", body: { provider } }));
  },
  async removeSource(id: string) {
    await apiRequest(`/connections/sources/${id}`, { method: "DELETE" });
  },
  async addOutput(provider: string, opts?: { apiKey?: string; teamId?: string; project?: string }) {
    return mapConnection(
      await apiRequest<Dict>("/connections/outputs", {
        method: "POST",
        body: {
          provider,
          api_key: opts?.apiKey,
          team_id: opts?.teamId,
          target_project: opts?.project,
        },
      }),
    );
  },
  async removeOutput(id: string) {
    await apiRequest(`/connections/outputs/${id}`, { method: "DELETE" });
  },
  async addRepo(fullName: string, platform = "github", accessToken?: string) {
    return mapRepo(
      await apiRequest<Dict>("/connections/repos", {
        method: "POST",
        body: { full_name: fullName, platform, access_token: accessToken },
      }),
    );
  },
  async removeRepo(id: string) {
    await apiRequest(`/connections/repos/${id}`, { method: "DELETE" });
  },
  async reindexRepo(id: string) {
    await apiRequest(`/connections/repos/${id}/reindex`, { method: "POST" });
  },
  async setDevAgent(enabled: boolean) {
    await apiRequest("/connections/dev-agent", { method: "PATCH", body: { enabled } });
  },

  async listProductDocs() {
    return (await apiRequest<Dict[]>("/product-docs")).map(mapProductDoc);
  },
  async uploadProductDoc(file: File) {
    const presign = await apiRequest<Dict>("/product-docs/presign", {
      method: "POST",
      body: { name: file.name, content_type: file.type || "application/octet-stream", size_bytes: file.size },
    });
    const uploadUrl = String(presign.upload_url);
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!put.ok) {
      throw new Error("File upload failed");
    }
    return mapProductDoc(
      await apiRequest<Dict>("/product-docs", {
        method: "POST",
        body: {
          doc_id: presign.doc_id,
          name: file.name,
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          type: file.type || "application/octet-stream",
        },
      }),
    );
  },
  async deleteProductDoc(id: string) {
    await apiRequest(`/product-docs/${id}`, { method: "DELETE" });
  },

  async getAutomation() {
    return mapAutomation(await apiRequest<Dict>("/automation"));
  },
  async applyAutomationPreset(preset: string) {
    return mapAutomation(await apiRequest<Dict>("/automation/preset", { method: "POST", body: { preset } }));
  },
  async addAutomationRule(rule: { classification: string; scope: string; enabled?: boolean }) {
    return mapAutomation(await apiRequest<Dict>("/automation/rules", { method: "POST", body: rule }));
  },
  async deleteAutomationRule(id: string) {
    return mapAutomation(await apiRequest<Dict>(`/automation/rules/${id}`, { method: "DELETE" }));
  },
  async toggleAutomationRule(id: string) {
    return mapAutomation(await apiRequest<Dict>(`/automation/rules/${id}/toggle`, { method: "POST" }));
  },

  async getDeliveryConfig() {
    return mapDeliveryConfig(await apiRequest<Dict>("/delivery/config"));
  },
  async patchDeliveryConfig(patch: Dict) {
    return mapDeliveryConfig(
      await apiRequest<Dict>("/delivery/config", {
        method: "PATCH",
        body: {
          enabled: patch.enabled,
          default_tool: patch.defaultTool,
          auto_deliver: patch.autoDeliver,
          default_assignee_id: patch.defaultAssigneeId,
          tool_webhook_url: patch.toolWebhookUrl,
        },
      }),
    );
  },
  async listDeliveries() {
    return (await apiRequest<Dict[]>("/delivery")).map(mapDeliveryRecord);
  },
  async deliver(body: {
    ticketId: string;
    assigneeId: string;
    assigneeName: string;
    assigneeInitials: string;
    tool: DeliveryTool;
  }) {
    return mapDeliveryRecord(
      await apiRequest<Dict>("/delivery", {
        method: "POST",
        body: {
          ticket_id: body.ticketId,
          assignee_id: body.assigneeId,
          assignee_name: body.assigneeName,
          assignee_initials: body.assigneeInitials,
          tool: body.tool,
        },
      }),
    );
  },

  async getDispatchConfig() {
    return mapDispatchConfig(await apiRequest<Dict>("/dispatch/config"));
  },
  async patchDispatchConfig(patch: Dict) {
    return mapDispatchConfig(
      await apiRequest<Dict>("/dispatch/config", {
        method: "PATCH",
        body: {
          enabled: patch.enabled,
          agent_type: patch.agentType,
          webhook_url: patch.webhookUrl,
          branch_pattern: patch.branchPattern,
          custom_branch_pattern: patch.customBranchPattern,
          include_code_refs: patch.includeCodeRefs,
          include_approach: patch.includeApproach,
        },
      }),
    );
  },
  async listDispatches() {
    return (await apiRequest<Dict[]>("/dispatch")).map(mapDispatchRecord);
  },
  async dispatch(ticketId: string, extras?: Dict) {
    return mapDispatchRecord(
      await apiRequest<Dict>("/dispatch", {
        method: "POST",
        body: { ticket_id: ticketId, ...extras },
      }),
    );
  },

  async listChatSessions() {
    return (await apiRequest<Dict[]>("/chat/sessions")).map(mapChatSession);
  },
  async createChatSession(opts?: { ticketId?: string; title?: string }) {
    return mapChatSession(
      await apiRequest<Dict>("/chat/sessions", {
        method: "POST",
        body: { ticket_id: opts?.ticketId, title: opts?.title },
      }),
    );
  },
  async renameChatSession(id: string, title: string) {
    return mapChatSession(await apiRequest<Dict>(`/chat/sessions/${id}`, { method: "PATCH", body: { title } }));
  },
  async deleteChatSession(id: string) {
    await apiRequest(`/chat/sessions/${id}`, { method: "DELETE" });
  },
  async listChatMessages(sessionId: string) {
    return (await apiRequest<Dict[]>(`/chat/sessions/${sessionId}/messages`)).map(mapChatMessage);
  },
  async sendChatMessage(sessionId: string, content: string) {
    return (await apiRequest<Dict[]>(`/chat/sessions/${sessionId}/messages`, { method: "POST", body: { content } })).map(
      mapChatMessage,
    );
  },
  async sendProposalToDev(sessionId: string, messageId: string) {
    return mapChatMessage(
      await apiRequest<Dict>(`/chat/sessions/${sessionId}/messages/${messageId}/send-to-dev`, { method: "POST" }),
    );
  },

  async listAlerts() {
    return (await apiRequest<Dict[]>("/alerts")).map(mapAlert);
  },
  async dismissAlert(id: string) {
    return mapAlert(await apiRequest<Dict>(`/alerts/${id}/dismiss`, { method: "POST" }));
  },
  async listAudit(q = "") {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    return (await apiRequest<Dict[]>(`/audit${query}`)).map(mapAudit);
  },
  async getIngestSettings() {
    const data = await apiRequest<Dict>("/connections/ingest");
    return {
      workspaceId: String(data.workspace_id ?? ""),
      secret: String(data.secret ?? ""),
      path: String(data.path ?? ""),
    };
  },
  async ingestTicket(body: {
    subject: string;
    body: string;
    customerName?: string;
    customerEmail?: string;
    provider?: string;
  }) {
    return mapTicket(
      await apiRequest<Dict>("/tickets/ingest", {
        method: "POST",
        body: {
          provider: body.provider ?? "webhook",
          subject: body.subject,
          body: body.body,
          customer_name: body.customerName,
          customer_email: body.customerEmail,
        },
      }),
    );
  },
};
