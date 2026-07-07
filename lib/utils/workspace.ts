import { MOCK_CLUSTERS } from "@/lib/mock/clusters";
import type {
  Classification,
  Cluster,
  ConfidenceLevel,
  ReasoningSignal,
  Scope,
  Ticket,
} from "@/lib/types";

const SCOPE_HOURS: Record<Scope, number> = { S: 2, M: 6, L: 14 };

export function hoursSavedForTicket(ticket: Ticket): number {
  return SCOPE_HOURS[ticket.scope] ?? 4;
}

export function computeConfidence(ticket: Ticket): { score: number; level: ConfidenceLevel } {
  let score = 72;
  if (ticket.codeRefs.length >= 2) score += 12;
  if (ticket.codeRefs.length === 0 || ticket.processingState === "no_code_match") score -= 28;
  if (ticket.classification === "question") score += 8;
  if (ticket.classification === "churn_signal") score -= 6;
  if (ticket.scope === "L") score -= 10;
  if (ticket.internalNotes) score += 5;
  score = Math.max(18, Math.min(98, score));
  const level: ConfidenceLevel = score >= 80 ? "high" : score >= 55 ? "medium" : "low";
  return { score, level };
}

export function buildReasoning(ticket: Ticket): ReasoningSignal[] {
  const signals: ReasoningSignal[] = [
    {
      label: "Classification",
      detail: `Matched ${ticket.classification.replace("_", " ")} from customer language and support notes`,
      weight: 0.35,
    },
  ];
  if (ticket.codeRefs.length > 0) {
    signals.push({
      label: "Code match",
      detail: `Found ${ticket.codeRefs.length} relevant file(s): ${ticket.codeRefs
        .slice(0, 2)
        .map((r) => r.filePath)
        .join(", ")}`,
      weight: 0.4,
    });
  } else {
    signals.push({
      label: "Code match",
      detail: "No strong code match — scope estimate may be less reliable",
      weight: 0.15,
    });
  }
  if (ticket.scopeRationale) {
    signals.push({
      label: "Scope",
      detail: ticket.scopeRationale,
      weight: 0.15,
    });
  }
  if (ticket.internalNotes) {
    signals.push({
      label: "Support context",
      detail: ticket.internalNotes.slice(0, 120),
      weight: 0.1,
    });
  }
  return signals;
}

export function enrichTicket(ticket: Ticket): Ticket {
  const cluster = MOCK_CLUSTERS.find((c) => c.tickets.some((t) => t.ticketId === ticket.id));
  const { score, level } = computeConfidence(ticket);
  const priorityScore = computePriorityScore(ticket, score);
  return {
    ...ticket,
    clusterId: cluster?.id,
    aiConfidence: score,
    aiConfidenceLevel: level,
    aiReasoning: buildReasoning(ticket),
    priorityScore,
  };
}

export function computePriorityScore(ticket: Ticket, confidence = ticket.aiConfidence ?? 70): number {
  let score = 0;
  if (ticket.classification === "churn_signal") score += 40;
  const ageHours = (Date.now() - new Date(ticket.createdAt).getTime()) / 3_600_000;
  if (ageHours > 48) score += 25;
  else if (ageHours > 24) score += 15;
  if (confidence < 55) score += 20;
  if (ticket.scope === "L") score += 10;
  return score;
}

export interface TriageListItem {
  kind: "cluster" | "ticket";
  id: string;
  cluster?: Cluster;
  ticket?: Ticket;
  priorityScore: number;
  ticketCount: number;
}

export function buildTriageList(tickets: Ticket[], clusters: Cluster[]): TriageListItem[] {
  const pending = tickets.filter((t) => t.status === "pending").map(enrichTicket);
  const clusteredIds = new Set<string>();
  const items: TriageListItem[] = [];

  for (const cluster of clusters) {
    const clusterTickets = cluster.tickets
      .map((ref) => pending.find((t) => t.id === ref.ticketId))
      .filter(Boolean) as Ticket[];
    if (clusterTickets.length === 0) continue;
    clusterTickets.forEach((t) => clusteredIds.add(t.id));
    const priorityScore = Math.max(...clusterTickets.map((t) => t.priorityScore ?? 0));
    items.push({
      kind: "cluster",
      id: cluster.id,
      cluster,
      priorityScore,
      ticketCount: clusterTickets.length,
    });
  }

  for (const ticket of pending) {
    if (clusteredIds.has(ticket.id)) continue;
    items.push({
      kind: "ticket",
      id: ticket.id,
      ticket,
      priorityScore: ticket.priorityScore ?? 0,
      ticketCount: 1,
    });
  }

  return items.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function attentionTickets(tickets: Ticket[]): Ticket[] {
  return tickets
    .filter((t) => t.status === "pending")
    .map(enrichTicket)
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
    .slice(0, 8);
}

export function confidenceDistribution(tickets: Ticket[]) {
  const pending = tickets.filter((t) => t.status === "pending").map(enrichTicket);
  return {
    high: pending.filter((t) => t.aiConfidenceLevel === "high").length,
    medium: pending.filter((t) => t.aiConfidenceLevel === "medium").length,
    low: pending.filter((t) => t.aiConfidenceLevel === "low").length,
  };
}

export const KPI_SPARKLINES = {
  tickets: [12, 15, 11, 18, 14, 22, 19],
  acceptance: [68, 70, 71, 69, 74, 76, 74],
  cycle: [4.2, 3.8, 3.5, 3.2, 2.9, 2.6, 2.4],
  autoResolved: [2, 3, 2, 4, 5, 6, 8],
  hoursSaved: [18, 22, 20, 28, 32, 38, 42],
};

export function filterTicketsByClassification(tickets: Ticket[], classification: Classification) {
  return tickets.filter((t) => t.classification === classification);
}
