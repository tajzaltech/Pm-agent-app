import { MOCK_ACTIVITY } from "@/lib/mock/activity";
import { MOCK_TICKETS } from "@/lib/mock/tickets";
import type {
  ActivityAction,
  ActivityEntry,
  Attachment,
  Classification,
  ConversationMessage,
  Scope,
  Ticket,
  TicketStatus,
} from "@/lib/types";

type SourceProvider = Ticket["source"];

interface SourceTicketInput {
  provider: SourceProvider;
  externalId?: string;
  subject?: string;
  body?: string;
  customerName?: string;
  customerEmail?: string;
  customerPlan?: Ticket["customer"]["plan"];
  internalNotes?: string;
  attachments?: Attachment[];
  rawPayload?: unknown;
}

interface ProductDocRecord {
  id: string;
  name: string;
  size: string;
  type: string;
  indexingStatus: "pending" | "indexed" | "failed";
  createdAt: string;
}

interface PublishedIssue {
  draftTicketId: string;
  provider: "linear";
  externalId: string;
  externalUrl: string;
  publishedAt: string;
}

interface ServerState {
  tickets: Ticket[];
  activity: ActivityEntry[];
  productDocs: ProductDocRecord[];
  publishedIssues: PublishedIssue[];
}

const globalForPmAgent = globalThis as typeof globalThis & {
  __pmAgentState?: ServerState;
};

function initialState(): ServerState {
  return {
    tickets: [...MOCK_TICKETS],
    activity: [...MOCK_ACTIVITY],
    productDocs: [],
    publishedIssues: [],
  };
}

function state(): ServerState {
  if (!globalForPmAgent.__pmAgentState) {
    globalForPmAgent.__pmAgentState = initialState();
  }

  return globalForPmAgent.__pmAgentState;
}

function id(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}_${Date.now().toString(36)}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CU";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function classify(subject: string, body: string): Classification {
  const text = `${subject} ${body}`.toLowerCase();
  if (/(cancel|churn|leave|competitor|angry|urgent|audit|compliance|broken)/.test(text)) return "churn_signal";
  if (/(bug|error|broken|fail|timeout|crash|loop|not working|double|stuck|stale|outdated|old content)/.test(text)) return "bug";
  if (/(\bhow\b|\bwhat\b|\bwhere\b|\bcan you\b|\bdocs\b|\bdocumentation\b|\?)/.test(text)) return "question";
  return "feature_request";
}

function scopeFor(classification: Classification, text: string): Scope {
  const lower = text.toLowerCase();
  if (classification === "churn_signal" || /(enterprise|compliance|audit|large|migration|cross-service)/.test(lower)) {
    return "L";
  }
  if (/(api|database|webhook|payment|auth|integration|background|worker|index)/.test(lower)) return "M";
  return "S";
}

function codeRefsFor(text: string): Ticket["codeRefs"] {
  const lower = text.toLowerCase();

  if (/(payment|stripe|charge|checkout|webhook)/.test(lower)) {
    return [
      {
        id: id("cr"),
        filePath: "src/checkout/webhook_handler.py",
        functionName: "handle_stripe_event",
        lineStart: 42,
        lineEnd: 89,
        language: "python",
        snippet: "# PM Agent matched payment/webhook language in the customer ticket.",
      },
      {
        id: id("cr"),
        filePath: "src/api/orders.py",
        functionName: "process_payment",
        lineStart: 112,
        lineEnd: 145,
        language: "python",
      },
    ];
  }

  if (/(login|password|sso|auth|reset)/.test(lower)) {
    return [
      {
        id: id("cr"),
        filePath: "src/auth/password_reset.py",
        functionName: "initiate_password_reset",
        lineStart: 15,
        lineEnd: 40,
        language: "python",
      },
    ];
  }

  if (/(search|stale|index|cache)/.test(lower)) {
    return [
      {
        id: id("cr"),
        filePath: "src/search/cache.py",
        functionName: "get_search_results",
        lineStart: 8,
        lineEnd: 35,
        language: "python",
      },
    ];
  }

  if (/(export|csv|audit)/.test(lower)) {
    return [
      {
        id: id("cr"),
        filePath: "src/api/export/handler.py",
        functionName: "export_audit_logs",
        lineStart: 23,
        lineEnd: 65,
        language: "python",
      },
    ];
  }

  return [
    {
      id: id("cr"),
      filePath: "src/app/routes.ts",
      language: "typescript",
      snippet: "No exact code match yet. Treat this as a starting reference for manual review.",
    },
  ];
}

function titleFor(classification: Classification, subject: string) {
  const clean = subject.trim().replace(/\s+/g, " ");
  if (!clean) return "Review customer request and create engineering follow-up";
  if (classification === "bug") return clean.toLowerCase().startsWith("fix") ? clean : `Fix ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
  if (classification === "feature_request") return clean.toLowerCase().startsWith("add") ? clean : `Add ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
  if (classification === "question") return clean.toLowerCase().startsWith("document") ? clean : `Document ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
  return clean.toLowerCase().startsWith("resolve") ? clean : `Resolve ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
}

function generateTicket(input: Required<Pick<SourceTicketInput, "provider" | "subject" | "body" | "customerName" | "customerEmail">> & SourceTicketInput): Ticket {
  const text = `${input.subject}\n${input.body}`;
  const classification = classify(input.subject, input.body);
  const scope = scopeFor(classification, text);
  const codeRefs = codeRefsFor(text);
  const customerName = input.customerName || "Unknown Customer";
  const externalId = input.externalId || `${input.provider.toUpperCase()}-${Date.now().toString().slice(-5)}`;
  const ticketId = id("t");

  const conversation: ConversationMessage[] = [
    {
      id: id("msg"),
      author: customerName,
      authorType: "customer",
      content: input.body,
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    id: ticketId,
    status: "pending",
    classification,
    scope,
    draftTitle: titleFor(classification, input.subject),
    draftDescription:
      `Customer reported: ${input.body.slice(0, 420)}${input.body.length > 420 ? "..." : ""} PM Agent created this draft from the incoming ${input.provider} ticket and matched it against available product/code context.`,
    suggestedApproach:
      codeRefs.length > 0
        ? `Start by reviewing ${codeRefs.map((ref) => ref.filePath).join(", ")}. Confirm the reproduction path, add the smallest safe fix, and cover it with a focused regression test.`
        : "Clarify the missing details with support, then create a small implementation plan before assigning to engineering.",
    acceptanceCriteria: [
      "Issue is reproducible or clearly documented with customer evidence",
      "Relevant implementation area is confirmed by engineering",
      "Fix or documentation update addresses the customer request",
      "Regression test or manual verification notes are added",
    ],
    scopeRationale: `${codeRefs.length} likely code reference${codeRefs.length === 1 ? "" : "s"} matched; scope estimated from classification and affected surface area.`,
    codeRefs,
    customer: {
      id: id("c"),
      name: customerName,
      email: input.customerEmail,
      plan: input.customerPlan ?? "starter",
      avatarInitials: initials(customerName),
    },
    source: input.provider,
    originalTicketId: externalId,
    originalSubject: input.subject,
    originalBody: input.body,
    conversation,
    internalNotes: input.internalNotes ?? "Created by PM Agent ingestion API. Review before publishing.",
    attachments: input.attachments ?? [],
    createdAt: new Date().toISOString(),
  };
}

function activity(action: ActivityAction, ticket: Ticket): ActivityEntry {
  return {
    id: id("act"),
    action,
    ticketTitle: ticket.draftTitle,
    ticketId: ticket.id,
    timestamp: new Date().toISOString(),
  };
}

function pendingCount(tickets: Ticket[]) {
  return tickets.filter((ticket) => ticket.status === "pending").length;
}

/** Live demo: re-seed mock queue when in-memory state has no pending tickets left. */
function ensureDemoSeed() {
  const current = state();
  if (pendingCount(current.tickets) === 0) {
    globalForPmAgent.__pmAgentState = initialState();
  }
}

export function listDraftTickets() {
  ensureDemoSeed();
  return state().tickets;
}

export function getDraftTicketById(id: string) {
  return state().tickets.find((t) => t.id === id) ?? null;
}

export function listActivity() {
  return state().activity;
}

export function ingestSourceTicket(input: SourceTicketInput) {
  const provider = input.provider;
  const subject = input.subject?.trim() || "Untitled customer request";
  const body = input.body?.trim() || "No body was provided.";
  const customerName = input.customerName?.trim() || "Customer";
  const customerEmail = input.customerEmail?.trim() || "customer@example.com";
  const externalId = input.externalId?.trim() || `${provider.toUpperCase()}-${Date.now().toString().slice(-5)}`;
  const current = state();
  const duplicate = current.tickets.find((ticket) => ticket.source === provider && ticket.originalTicketId === externalId);

  if (duplicate) {
    return { ticket: duplicate, duplicate: true };
  }

  const ticket = generateTicket({
    ...input,
    provider,
    externalId,
    subject,
    body,
    customerName,
    customerEmail,
  });

  current.tickets = [ticket, ...current.tickets];
  current.activity = [activity("new_draft", ticket), ...current.activity];

  return { ticket, duplicate: false };
}

export function normalizeFreshdeskPayload(payload: Record<string, unknown>): SourceTicketInput {
  const requester = (payload.requester || payload.customer || {}) as Record<string, unknown>;

  return {
    provider: "freshdesk",
    externalId: String(payload.id ?? payload.ticket_id ?? payload.external_id ?? ""),
    subject: String(payload.subject ?? payload.title ?? "Freshdesk ticket"),
    body: String(payload.description_text ?? payload.description ?? payload.body ?? payload.message ?? ""),
    customerName: String(requester.name ?? payload.customer_name ?? payload.name ?? "Freshdesk Customer"),
    customerEmail: String(requester.email ?? payload.customer_email ?? payload.email ?? "customer@example.com"),
    internalNotes: typeof payload.internal_notes === "string" ? payload.internal_notes : undefined,
    rawPayload: payload,
  };
}

export function updateDraftStatus(ticketId: string, status: TicketStatus, updates?: Partial<Ticket>) {
  const current = state();
  const ticket = current.tickets.find((item) => item.id === ticketId);
  if (!ticket) return null;

  const updated: Ticket = { ...ticket, ...updates, status };
  current.tickets = current.tickets.map((item) => (item.id === ticketId ? updated : item));
  current.activity = [activity(status === "accepted" ? "accepted" : "rejected", updated), ...current.activity];

  if (status === "accepted") {
    publishToLinear(updated);
  }

  return updated;
}

export function publishToLinear(ticket: Ticket) {
  const current = state();
  const existing = current.publishedIssues.find((issue) => issue.draftTicketId === ticket.id);
  if (existing) return existing;

  const externalId = `LIN-${Math.floor(1000 + Math.random() * 9000)}`;
  const issue: PublishedIssue = {
    draftTicketId: ticket.id,
    provider: "linear",
    externalId,
    externalUrl: `https://linear.app/pm-agent/issue/${externalId}`,
    publishedAt: new Date().toISOString(),
  };

  current.publishedIssues = [issue, ...current.publishedIssues];
  return issue;
}

export function addProductDoc(input: Pick<ProductDocRecord, "name" | "size" | "type">) {
  const current = state();
  const existing = current.productDocs.find((doc) => doc.name === input.name);
  if (existing) return existing;

  const doc: ProductDocRecord = {
    id: id("doc"),
    ...input,
    indexingStatus: "indexed",
    createdAt: new Date().toISOString(),
  };

  current.productDocs = [doc, ...current.productDocs];
  return doc;
}

export function listProductDocs() {
  return state().productDocs;
}

export function freshdeskStatus() {
  return {
    provider: "freshdesk",
    status: "connected",
    mode: process.env.FRESHDESK_API_KEY ? "api_configured" : "webhook_ready",
    webhookSecretConfigured: Boolean(process.env.FRESHDESK_WEBHOOK_SECRET),
    receivedTickets: state().tickets.filter((ticket) => ticket.source === "freshdesk").length,
  };
}
