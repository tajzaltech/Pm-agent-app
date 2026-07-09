import type { PipelineCard, Ticket } from "@/lib/types";

export type ProcessingCategory =
  | "processed"
  | "in_process"
  | "sent_to_developer"
  | "responded_back";

export interface ProcessingStats {
  processed: number;
  inProcess: number;
  sentToDeveloper: number;
  respondedBack: number;
  pending: number;
  inPipeline: number;
  inDevAgent: number;
  shippedThisWeek: number;
  chatOriginated: number;
  chatAccepted: number;
}

export interface ProcessingTicketItem {
  id: string;
  title: string;
  meta: string;
  badge: string;
  href: string;
}

const ACTIVE_PIPELINE_STAGES = new Set(["accepted", "assigned", "dev_working", "pr_open"]);
const DEV_AGENT_STAGES = new Set(["assigned", "dev_working", "pr_open"]);

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function ticketRow(ticket: Ticket, meta: string, badge: string): ProcessingTicketItem {
  return {
    id: ticket.id,
    title: ticket.draftTitle,
    meta,
    badge,
    href: `/triage?ticket=${ticket.id}`,
  };
}

export function getProcessingTicketLists(
  tickets: Ticket[],
  pipelineCards: PipelineCard[]
): Record<ProcessingCategory, ProcessingTicketItem[]> {
  const ticketById = new Map(tickets.map((t) => [t.id, t]));

  const processed = tickets
    .filter((t) => ["accepted", "rejected", "ignored"].includes(t.status))
    .map((t) =>
      ticketRow(
        t,
        `${t.customer.name} · ${statusLabel(t.status)}${t.resolution ? ` (${statusLabel(t.resolution)})` : ""}`,
        t.status
      )
    );

  const pendingItems = tickets
    .filter((t) => t.status === "pending")
    .map((t) => ticketRow(t, `${t.customer.name} · Waiting in Triage`, "pending"));

  const pipelineItems: ProcessingTicketItem[] = pipelineCards
    .filter((c) => ACTIVE_PIPELINE_STAGES.has(c.stage))
    .map((c) => {
      const ticket = ticketById.get(c.ticketId);
      return {
        id: c.ticketId,
        title: ticket?.draftTitle ?? c.title,
        meta: `${statusLabel(c.stage)} · ${c.assigneeName ?? "Dev Agent"} · ${c.destinationTool}`,
        badge: c.stage,
        href: `/pipeline`,
      };
    });

  const pendingIds = new Set(pendingItems.map((p) => p.id));
  const inProcess = [
    ...pendingItems,
    ...pipelineItems.filter((p) => !pendingIds.has(p.id)),
  ];

  const sentFromTickets = tickets.filter(
    (t) => t.status === "accepted" && t.resolution === "dev"
  );
  const sentIds = new Set(sentFromTickets.map((t) => t.id));
  const sentToDeveloper = [
    ...sentFromTickets.map((t) =>
      ticketRow(t, `${t.customer.name} · Sent to engineering`, "dev")
    ),
    ...pipelineItems.filter((p) => !sentIds.has(p.id)),
  ];

  const respondedBack = tickets
    .filter((t) => t.status === "accepted" && t.resolution === "non_technical")
    .map((t) =>
      ticketRow(t, `${t.customer.name} · Customer reply sent`, "responded")
    );

  return {
    processed,
    in_process: inProcess,
    sent_to_developer: sentToDeveloper,
    responded_back: respondedBack,
  };
}

export function computeProcessingStats(
  tickets: Ticket[],
  pipelineCards: PipelineCard[]
): ProcessingStats {
  const lists = getProcessingTicketLists(tickets, pipelineCards);
  const pending = tickets.filter((t) => t.status === "pending").length;
  const inPipeline = pipelineCards.filter((c) => ACTIVE_PIPELINE_STAGES.has(c.stage)).length;
  const inDevAgent = pipelineCards.filter((c) => DEV_AGENT_STAGES.has(c.stage)).length;
  const shippedThisWeek = pipelineCards.filter((c) => c.stage === "shipped").length;

  const chatTickets = tickets.filter((t) => t.source === "pm_chat" || t.viaPmChat);
  const chatAccepted = chatTickets.filter((t) => t.status === "accepted").length;

  return {
    processed: lists.processed.length,
    inProcess: lists.in_process.length,
    sentToDeveloper: lists.sent_to_developer.length,
    respondedBack: lists.responded_back.length,
    pending,
    inPipeline,
    inDevAgent,
    shippedThisWeek,
    chatOriginated: chatTickets.length,
    chatAccepted,
  };
}

export function computeAcceptanceBreakdown(tickets: Ticket[]) {
  const reviewed = tickets.filter((t) =>
    ["accepted", "rejected", "ignored"].includes(t.status)
  );
  if (reviewed.length === 0) {
    return { acceptedPct: 0, rejectedPct: 0, ignoredPct: 0, total: 0 };
  }
  const accepted = reviewed.filter((t) => t.status === "accepted").length;
  const rejected = reviewed.filter((t) => t.status === "rejected").length;
  const ignored = reviewed.filter((t) => t.status === "ignored").length;
  const total = reviewed.length;
  return {
    acceptedPct: Math.round((accepted / total) * 100),
    rejectedPct: Math.round((rejected / total) * 100),
    ignoredPct: Math.round((ignored / total) * 100),
    total,
  };
}

export const PROCESSING_CATEGORY_LABELS: Record<ProcessingCategory, string> = {
  processed: "Processed",
  in_process: "In process",
  sent_to_developer: "Sent to developer",
  responded_back: "Responded back",
};
