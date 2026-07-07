import type { Ticket } from "@/lib/types";

export type AiImproveField =
  | "draftTitle"
  | "draftDescription"
  | "suggestedApproach"
  | "acceptanceCriteria";

export interface AiImprovement {
  field: AiImproveField;
  label: string;
  before: string | string[];
  after: string | string[];
  reason: string;
}

function polishTitle(title: string, classification: Ticket["classification"]): string {
  const trimmed = title.trim().replace(/\s+/g, " ");
  const verbs = ["Fix", "Add", "Update", "Resolve", "Investigate"];
  const hasVerb = verbs.some((v) => trimmed.startsWith(v));
  if (hasVerb) return trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;

  const prefix =
    classification === "bug"
      ? "Fix"
      : classification === "feature_request"
        ? "Add"
        : classification === "churn_signal"
          ? "Resolve"
          : "Clarify";
  return `${prefix}: ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`.replace(/^Fix: fix/i, "Fix");
}

function polishDescription(ticket: Ticket): string {
  const base = ticket.draftDescription.trim();
  const hasImpact = /impact|customer|user/i.test(base);
  const impactLine = hasImpact
    ? ""
    : `\n\nImpact: Affects ${ticket.customer.plan} customers via ${ticket.source.replace("_", " ")} ticket #${ticket.originalTicketId}.`;

  if (base.includes("Root cause:")) return base + impactLine;

  const rootHint = ticket.codeRefs.length
    ? `Root cause: Likely in ${ticket.codeRefs[0].filePath}${ticket.codeRefs[0].functionName ? ` (${ticket.codeRefs[0].functionName})` : ""}.`
    : "Root cause: Requires code investigation — no strong file match yet.";

  return `${base}\n\n${rootHint}${impactLine}`;
}

function polishApproach(approach: string, ticket: Ticket): string {
  const trimmed = approach.trim();
  if (/^\d+\./m.test(trimmed)) return trimmed;

  const steps = [
    "Validate reproduction and confirm affected surface area",
    trimmed.endsWith(".") ? trimmed : `${trimmed}.`,
  ];

  if (ticket.codeRefs.length > 0) {
    steps.push(`Patch ${ticket.codeRefs[0].filePath} and add regression coverage`);
  }
  steps.push("Verify in staging and monitor for 24h post-deploy");

  return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

function polishCriteria(criteria: string[], ticket: Ticket): string[] {
  const next = [...criteria];
  const lower = next.map((c) => c.toLowerCase());

  if (!lower.some((c) => c.includes("test"))) {
    next.push("Automated tests cover the fix and prevent regression");
  }
  if (ticket.classification === "bug" && !lower.some((c) => c.includes("monitor") || c.includes("log"))) {
    next.push("Error logging and monitoring confirm no duplicate occurrences in production");
  }
  if (ticket.scope === "L" && !lower.some((c) => c.includes("rollout") || c.includes("flag"))) {
    next.push("Feature flag or phased rollout plan documented for safe deployment");
  }

  return next.map((c) => (c.endsWith(".") ? c : `${c}.`));
}

export function generateAiImprovements(ticket: Ticket): AiImprovement[] {
  const improvements: AiImprovement[] = [];

  const newTitle = polishTitle(ticket.draftTitle, ticket.classification);
  if (newTitle !== ticket.draftTitle) {
    improvements.push({
      field: "draftTitle",
      label: "Title",
      before: ticket.draftTitle,
      after: newTitle,
      reason: "Clearer action verb and scannable phrasing for dev handoff",
    });
  }

  const newDescription = polishDescription(ticket);
  if (newDescription !== ticket.draftDescription) {
    improvements.push({
      field: "draftDescription",
      label: "Description",
      before: ticket.draftDescription,
      after: newDescription,
      reason: "Added root-cause context and customer impact for faster triage",
    });
  }

  const newApproach = polishApproach(ticket.suggestedApproach, ticket);
  if (newApproach !== ticket.suggestedApproach) {
    improvements.push({
      field: "suggestedApproach",
      label: "Suggested approach",
      before: ticket.suggestedApproach,
      after: newApproach,
      reason: "Structured into numbered steps with code-aware implementation hints",
    });
  }

  const newCriteria = polishCriteria(ticket.acceptanceCriteria, ticket);
  const criteriaChanged =
    newCriteria.length !== ticket.acceptanceCriteria.length ||
    newCriteria.some((c, i) => c !== ticket.acceptanceCriteria[i]);

  if (criteriaChanged) {
    improvements.push({
      field: "acceptanceCriteria",
      label: "Acceptance criteria",
      before: ticket.acceptanceCriteria,
      after: newCriteria,
      reason: "Filled gaps in test coverage, monitoring, and rollout safety",
    });
  }

  return improvements;
}

export function improvementsToUpdates(
  improvements: AiImprovement[]
): Partial<
  Pick<Ticket, "draftTitle" | "draftDescription" | "suggestedApproach" | "acceptanceCriteria">
> {
  const updates: Partial<
    Pick<Ticket, "draftTitle" | "draftDescription" | "suggestedApproach" | "acceptanceCriteria">
  > = {};

  for (const item of improvements) {
    if (item.field === "acceptanceCriteria") {
      updates.acceptanceCriteria = item.after as string[];
    } else {
      updates[item.field] = item.after as string;
    }
  }

  return updates;
}
