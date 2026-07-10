import type { Ticket, ActivityEntry } from "@/lib/types";

export interface Workspace {
  id: string;
  name: string;
  initials: string;
  description: string;
  color: string;
  gradient: [string, string];
}

export interface WorkspaceConnection {
  id: string;
  name: string;
  description: string;
  status: "connected" | "attention" | "disconnected";
  statusText: string;
  category: "source" | "repo" | "output";
  meta?: string;
}

export interface WorkspaceData {
  tickets: Ticket[];
  activity: ActivityEntry[];
  connections: WorkspaceConnection[];
}

export const WORKSPACES: Workspace[] = [
  { id: "acme", name: "Acme Corp", initials: "AC", description: "E-commerce SaaS platform", color: "bg-blue-500", gradient: ["#2563EB", "#0EA5E9"] },
  { id: "globaltech", name: "GlobalTech", initials: "GT", description: "Enterprise analytics", color: "bg-teal-500", gradient: ["#0D9488", "#0891B2"] },
  { id: "startuphq", name: "StartupHQ", initials: "SH", description: "Developer tools", color: "bg-orange-500", gradient: ["#F97316", "#EF4444"] },
];

const ACME_TICKETS: Ticket[] = [
  {
    id: "acme_t001",
    status: "pending",
    classification: "bug",
    scope: "M",
    draftTitle: "Fix Stripe webhook timeout causing duplicate payment charges",
    draftDescription:
      "The payment service is timing out on Stripe webhook events with large payloads (>4KB). When a timeout occurs, Stripe retries the event, resulting in duplicate charge processing. The issue manifests in the checkout service's webhook handler which does not implement idempotency checks.",
    suggestedApproach:
      "Add idempotency key validation in the webhook handler before processing. Store processed webhook IDs in Redis with a 24h TTL.",
    acceptanceCriteria: [
      "Webhook handler checks idempotency key before processing any charge",
      "Duplicate events return 200 without re-processing",
      "Unit tests cover idempotent and duplicate scenarios",
    ],
    scopeRationale: "2 files, isolated to payment service, no DB schema changes",
    codeRefs: [
      {
        id: "cr001", filePath: "src/checkout/webhook_handler.py", functionName: "handle_stripe_event",
        lineStart: 42, lineEnd: 89, language: "python",
        snippet: `def handle_stripe_event(request):\n    payload = request.body\n    event = stripe.Webhook.construct_event(payload, sig_header, secret)\n    # TODO: add idempotency check here\n    if event['type'] == 'payment_intent.succeeded':\n        handle_payment_success(event['data']['object'])`,
      },
    ],
    customer: { id: "c001", name: "Sarah Chen", email: "sarah.chen@acmetech.com", plan: "enterprise", avatarInitials: "SC" },
    source: "freshdesk", originalTicketId: "FD-4821",
    originalSubject: "Customers being charged twice for the same order!",
    originalBody: "Hi support team,\n\nWe've had 3 enterprise customers report being double-charged today. The charges are exactly 2x the order amount and the duplicates appear about 30 seconds after the first charge.\n\nOrder IDs affected: ORD-9921, ORD-9934, ORD-9967",
    conversation: [
      { id: "msg001", author: "Sarah Chen", authorType: "customer", content: "3 enterprise customers double-charged today. Critical issue.", timestamp: "2026-06-16T08:10:00Z" },
    ],
    internalNotes: "Stripe webhook events show 2x delivery. Timeout on our side causing retries.",
    attachments: [{ id: "a001", name: "stripe_webhook_logs.csv", type: "csv", size: "42 KB" }],
    createdAt: "2026-06-16T08:45:00Z",
  },
  {
    id: "acme_t002",
    status: "pending",
    classification: "question",
    scope: "S",
    draftTitle: "Document SSO configuration for SAML 2.0 providers",
    draftDescription: "Customer is unable to configure SAML 2.0 SSO with their IdP (Okta). The auth module supports SAML but the configuration flow is undocumented.",
    suggestedApproach: "Add in-app help text to the SSO configuration panel for each SAML field.",
    acceptanceCriteria: ["Help text added to each SAML configuration field", "Okta setup guide published in help docs"],
    scopeRationale: "1 settings component, copy changes only",
    codeRefs: [
      { id: "cr005", filePath: "src/settings/SSOConfiguration.tsx", functionName: "SSOConfigPanel", lineStart: 44, lineEnd: 90, language: "tsx", snippet: `export function SSOConfigPanel() {\n  return (\n    <form onSubmit={handleSubmit}>\n      <Input label="Entity ID" name="entity_id" />\n      <Input label="ACS URL" name="acs_url" />\n      {/* TODO: add help text */}\n    </form>\n  );\n}` },
    ],
    customer: { id: "c003", name: "Priya Sharma", email: "priya@innovatehq.com", plan: "growth", avatarInitials: "PS" },
    source: "freshdesk", originalTicketId: "FD-4803",
    originalSubject: "How to configure SSO with Okta?",
    originalBody: "Hi! We're trying to set up SSO with Okta for our team. I found the SSO settings page but I'm not sure what to put in the Entity ID and ACS URL fields.",
    conversation: [{ id: "msg006", author: "Priya Sharma", authorType: "customer", content: "Trying to configure SSO with Okta. Not sure what to put in Entity ID / ACS URL fields.", timestamp: "2026-06-16T07:30:00Z" }],
    internalNotes: "This comes up every week. We need in-app docs for SSO config.",
    attachments: [], createdAt: "2026-06-16T10:15:00Z",
  },
  {
    id: "acme_t003",
    status: "pending",
    classification: "feature_request",
    scope: "M",
    draftTitle: "Add bulk team member import via CSV upload",
    draftDescription: "Teams of 10+ members face significant friction when onboarding. Currently each member must be invited individually.",
    suggestedApproach: "Add a CSV upload endpoint that accepts columns: name, email, role. Validate each row, send batch invitations.",
    acceptanceCriteria: ["CSV upload accepts name, email, role columns", "Bulk invitations sent in one action", "Summary shows sent/failed counts"],
    scopeRationale: "New API endpoint + settings UI component",
    codeRefs: [
      { id: "cr009", filePath: "src/api/team/invitations.py", functionName: "invite_member", lineStart: 10, lineEnd: 35, language: "python", snippet: `@router.post("/team/invite")\nasync def invite_member(email: str, role: str):\n    invitation = Invitation.create(email=email, role=role)\n    send_invitation_email(invitation)\n    return {"status": "sent"}` },
    ],
    customer: { id: "c006", name: "Tom Bradley", email: "tom@scaleup.ventures", plan: "growth", avatarInitials: "TB" },
    source: "zendesk", originalTicketId: "ZD-18190",
    originalSubject: "Can we bulk-invite team members?",
    originalBody: "We're onboarding 45 new team members and inviting them one by one is incredibly slow. Is there a way to bulk invite or import users from a CSV?",
    conversation: [{ id: "msg011", author: "Tom Bradley", authorType: "customer", content: "Need to onboard 45 team members. Inviting one-by-one is very slow.", timestamp: "2026-06-15T13:00:00Z" }],
    internalNotes: "Commonly requested. Growth teams need this.",
    attachments: [], createdAt: "2026-06-16T10:40:00Z",
  },
];

const GLOBALTECH_TICKETS: Ticket[] = [
  {
    id: "gt_t001",
    status: "pending",
    classification: "bug",
    scope: "L",
    draftTitle: "Dashboard export generates corrupt Excel files over 50MB",
    draftDescription: "The analytics export pipeline fails silently for datasets exceeding 50MB. The generated .xlsx file is truncated and cannot be opened. The export worker runs out of memory and the job never reports an error status.",
    suggestedApproach: "Switch to streaming XLSX generation using openpyxl write-only mode. Add progress tracking and file-size validation before S3 upload.",
    acceptanceCriteria: ["Exports work for files up to 500MB", "Progress bar shows export status", "Failed exports show error message"],
    scopeRationale: "Export worker + API + dashboard UI changes",
    codeRefs: [
      { id: "gt_cr001", filePath: "src/workers/export_pipeline.py", functionName: "generate_xlsx", lineStart: 45, lineEnd: 80, language: "python", snippet: `def generate_xlsx(query_result):\n    wb = Workbook()\n    ws = wb.active\n    for row in query_result:  # can be millions\n        ws.append(row)\n    return wb.save_virtual_workbook()  # OOM for large datasets` },
    ],
    customer: { id: "gt_c001", name: "James Morrison", email: "j.morrison@megabank.com", plan: "enterprise", avatarInitials: "JM" },
    source: "zendesk", originalTicketId: "ZD-29401",
    originalSubject: "Excel export produces corrupted files",
    originalBody: "When we export our Q2 analytics dashboard (about 2M rows), the downloaded Excel file is corrupt and can't be opened. This is blocking our quarterly board report.",
    conversation: [{ id: "gt_msg001", author: "James Morrison", authorType: "customer", content: "Q2 analytics export produces corrupt Excel file. 2M rows. Board report blocked.", timestamp: "2026-06-16T09:00:00Z" }],
    internalNotes: "P1 — $200k ARR account. Export OOMs at 50MB. Need streaming XLSX.",
    attachments: [], createdAt: "2026-06-16T09:30:00Z",
  },
  {
    id: "gt_t002",
    status: "pending",
    classification: "feature_request",
    scope: "M",
    draftTitle: "Add scheduled report delivery via email",
    draftDescription: "Enterprise customers want to schedule dashboards to be emailed as PDF/Excel on a recurring basis (daily, weekly, monthly). Currently all exports are manual.",
    suggestedApproach: "Add a schedule configuration UI on dashboards. Use cron-based job scheduler to generate and email reports.",
    acceptanceCriteria: ["Schedule config on dashboard settings", "Daily/weekly/monthly options", "PDF and Excel format support", "Email delivery with retry"],
    scopeRationale: "New scheduler service + dashboard UI + email integration",
    codeRefs: [
      { id: "gt_cr002", filePath: "src/api/dashboards/routes.py", functionName: "get_dashboard", lineStart: 20, lineEnd: 45, language: "python", snippet: `@router.get("/dashboards/{id}")\nasync def get_dashboard(id: str):\n    dashboard = Dashboard.objects.get(id=id)\n    return {"data": dashboard.serialize(), "widgets": dashboard.widgets}` },
    ],
    customer: { id: "gt_c002", name: "Elena Vasquez", email: "elena@corpanalytics.com", plan: "enterprise", avatarInitials: "EV" },
    source: "freshdesk", originalTicketId: "FD-8812",
    originalSubject: "Can we schedule automatic report emails?",
    originalBody: "Our executives want a weekly email with the KPI dashboard as a PDF. Right now someone has to manually export and send it every Monday. Can we automate this?",
    conversation: [{ id: "gt_msg002", author: "Elena Vasquez", authorType: "customer", content: "Execs want weekly KPI dashboard PDF by email. Currently manual.", timestamp: "2026-06-15T14:00:00Z" }],
    internalNotes: "Top requested feature from enterprise segment. Aligns with Q3 roadmap.",
    attachments: [], createdAt: "2026-06-16T10:00:00Z",
  },
];

const STARTUPHQ_TICKETS: Ticket[] = [
  {
    id: "sh_t001",
    status: "pending",
    classification: "bug",
    scope: "S",
    draftTitle: "CLI crashes with segfault on Apple Silicon when running `shq deploy`",
    draftDescription: "The CLI binary compiled for arm64 macOS crashes with SIGSEGV when executing the deploy command. The issue is in the native FFI bridge to the Rust networking module which doesn't handle the ARM memory model correctly.",
    suggestedApproach: "Update the Rust FFI bindings to use atomic operations compatible with ARM's weak memory ordering. Rebuild arm64 binary with corrected alignment.",
    acceptanceCriteria: ["No crash on Apple Silicon M1/M2/M3", "Deploy command completes successfully", "CI adds arm64 test target"],
    scopeRationale: "1 FFI module, isolated fix, no API changes",
    codeRefs: [
      { id: "sh_cr001", filePath: "crates/network/src/ffi.rs", functionName: "deploy_bundle", lineStart: 112, lineEnd: 140, language: "rust", snippet: `pub extern "C" fn deploy_bundle(ptr: *const u8, len: usize) -> i32 {\n    let slice = unsafe { std::slice::from_raw_parts(ptr, len) };\n    // BUG: non-atomic read on ARM causes SIGSEGV\n    match runtime::deploy(slice) {\n        Ok(_) => 0,\n        Err(_) => -1,\n    }\n}` },
    ],
    customer: { id: "sh_c001", name: "Alex Rivera", email: "alex@devstudio.io", plan: "growth", avatarInitials: "AR" },
    source: "freshdesk", originalTicketId: "FD-1204",
    originalSubject: "CLI crashes on my M2 MacBook",
    originalBody: "Every time I run `shq deploy` on my M2 MacBook Pro, the CLI crashes immediately with a segfault. Works fine on my Linux server. This is blocking my team from deploying.",
    conversation: [{ id: "sh_msg001", author: "Alex Rivera", authorType: "customer", content: "shq deploy crashes on M2 MacBook. Segfault. Works on Linux.", timestamp: "2026-06-16T11:00:00Z" }],
    internalNotes: "ARM FFI alignment bug. Quick fix — update atomic ordering in Rust module.",
    attachments: [], createdAt: "2026-06-16T11:30:00Z",
  },
  {
    id: "sh_t002",
    status: "pending",
    classification: "question",
    scope: "S",
    draftTitle: "Document SDK authentication flow for OAuth2 providers",
    draftDescription: "Customer is confused about how to implement OAuth2 authentication using the SDK. The current docs only cover API key auth.",
    suggestedApproach: "Add an OAuth2 authentication guide to the SDK docs with code examples for Node.js, Python, and Go.",
    acceptanceCriteria: ["OAuth2 guide added to docs", "Code examples for 3 languages", "Link from SDK README"],
    scopeRationale: "Documentation only, no code changes",
    codeRefs: [
      { id: "sh_cr002", filePath: "sdk/src/auth.ts", functionName: "authenticate", lineStart: 8, lineEnd: 30, language: "typescript", snippet: `export async function authenticate(config: AuthConfig): Promise<Token> {\n  if (config.type === 'api_key') {\n    return validateApiKey(config.key);\n  }\n  // TODO: OAuth2 flow not documented\n  if (config.type === 'oauth2') {\n    return handleOAuth2Flow(config);\n  }\n}` },
    ],
    customer: { id: "sh_c002", name: "Maya Patel", email: "maya@cloudnative.dev", plan: "starter", avatarInitials: "MP" },
    source: "zendesk", originalTicketId: "ZD-5501",
    originalSubject: "How do I set up OAuth2 with the SDK?",
    originalBody: "I need to use OAuth2 instead of API keys for our integration. The docs only show API key setup. How do I configure OAuth2?",
    conversation: [{ id: "sh_msg002", author: "Maya Patel", authorType: "customer", content: "Need OAuth2 docs for the SDK. Only API key auth is documented.", timestamp: "2026-06-16T10:30:00Z" }],
    internalNotes: "Common question. OAuth2 works but is undocumented. Quick docs win.",
    attachments: [], createdAt: "2026-06-16T11:00:00Z",
  },
];

const ACME_CONNECTIONS: WorkspaceConnection[] = [
  { id: "freshdesk", name: "Freshdesk", description: "Ticket source", status: "connected", statusText: "847 tickets/week", category: "source", meta: "Connected 24d ago" },
  { id: "zendesk", name: "Zendesk", description: "Ticket source", status: "connected", statusText: "312 tickets/week", category: "source", meta: "Connected 24d ago" },
  { id: "acme-api", name: "api-backend", description: "acme/api-backend", status: "connected", statusText: "Last indexed 2h ago", category: "repo" },
  { id: "acme-web", name: "web-storefront", description: "acme/web-storefront", status: "connected", statusText: "Last indexed 2h ago", category: "repo" },
  { id: "linear", name: "Linear", description: "Ticket delivery", status: "connected", statusText: "94 tickets pushed", category: "output", meta: "Backend — Q3" },
];

const GLOBALTECH_CONNECTIONS: WorkspaceConnection[] = [
  { id: "zendesk", name: "Zendesk", description: "Ticket source", status: "connected", statusText: "1,204 tickets/week", category: "source", meta: "Connected 18d ago" },
  { id: "gt-engine", name: "data-engine", description: "globaltech/data-engine", status: "connected", statusText: "Last indexed 1h ago", category: "repo" },
  { id: "gt-dash", name: "dashboard", description: "globaltech/dashboard", status: "connected", statusText: "Last indexed 3h ago", category: "repo" },
  { id: "gt-pipeline", name: "etl-pipeline", description: "globaltech/etl-pipeline", status: "attention", statusText: "Re-index needed", category: "repo" },
  { id: "jira", name: "Jira", description: "Ticket delivery", status: "connected", statusText: "156 tickets pushed", category: "output", meta: "Analytics — Sprint 14" },
];

const STARTUPHQ_CONNECTIONS: WorkspaceConnection[] = [
  { id: "freshdesk", name: "Freshdesk", description: "Ticket source", status: "connected", statusText: "189 tickets/week", category: "source", meta: "Connected 30d ago" },
  { id: "sh-cli", name: "cli", description: "startuphq/cli", status: "connected", statusText: "Last indexed 30m ago", category: "repo" },
  { id: "sh-sdk", name: "sdk", description: "startuphq/sdk", status: "connected", statusText: "Last indexed 30m ago", category: "repo" },
  { id: "github-issues", name: "GitHub Issues", description: "Ticket delivery", status: "connected", statusText: "38 issues created", category: "output", meta: "startuphq/cli" },
];

export const WORKSPACE_DATA: Record<string, WorkspaceData> = {
  acme: {
    tickets: ACME_TICKETS,
    activity: ACME_TICKETS.map((t, i) => ({ id: `acme_act${i}`, action: "new_draft" as const, ticketTitle: t.draftTitle, ticketId: t.id, timestamp: t.createdAt })),
    connections: ACME_CONNECTIONS,
  },
  globaltech: {
    tickets: GLOBALTECH_TICKETS,
    activity: GLOBALTECH_TICKETS.map((t, i) => ({ id: `gt_act${i}`, action: "new_draft" as const, ticketTitle: t.draftTitle, ticketId: t.id, timestamp: t.createdAt })),
    connections: GLOBALTECH_CONNECTIONS,
  },
  startuphq: {
    tickets: STARTUPHQ_TICKETS,
    activity: STARTUPHQ_TICKETS.map((t, i) => ({ id: `sh_act${i}`, action: "new_draft" as const, ticketTitle: t.draftTitle, ticketId: t.id, timestamp: t.createdAt })),
    connections: STARTUPHQ_CONNECTIONS,
  },
};
