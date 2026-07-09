import type { PipelineCard, Ticket } from "@/lib/types";

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

const ACTIVE_PIPELINE_STAGES = new Set(["accepted", "assigned", "dev_working", "pr_open"]);
const DEV_AGENT_STAGES = new Set(["assigned", "dev_working", "pr_open"]);

export function computeProcessingStats(
  tickets: Ticket[],
  pipelineCards: PipelineCard[]
): ProcessingStats {
  const pending = tickets.filter((t) => t.status === "pending").length;
  const processed = tickets.filter((t) =>
    ["accepted", "rejected", "ignored"].includes(t.status)
  ).length;
  const sentToDeveloper = tickets.filter(
    (t) => t.status === "accepted" && t.resolution === "dev"
  ).length;
  const respondedBack = tickets.filter(
    (t) => t.status === "accepted" && t.resolution === "non_technical"
  ).length;
  const inPipeline = pipelineCards.filter((c) => ACTIVE_PIPELINE_STAGES.has(c.stage)).length;
  const inDevAgent = pipelineCards.filter((c) => DEV_AGENT_STAGES.has(c.stage)).length;
  const shippedThisWeek = pipelineCards.filter((c) => c.stage === "shipped").length;

  const chatTickets = tickets.filter((t) => t.source === "pm_chat" || t.viaPmChat);
  const chatAccepted = chatTickets.filter((t) => t.status === "accepted").length;
  const chatOriginated = chatTickets.length;

  return {
    processed,
    inProcess: pending + inPipeline,
    sentToDeveloper,
    respondedBack,
    pending,
    inPipeline,
    inDevAgent,
    shippedThisWeek,
    chatOriginated,
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
