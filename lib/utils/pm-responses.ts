import type { Classification, PmChatMessage, PmChatTicketProposal, Scope, Ticket } from "@/lib/types";

export const PM_QUICK_PROMPTS = [
  "A customer says something is broken",
  "Help me understand an error report",
  "We noticed odd behaviour after a deploy",
];

export type PmChatStarter = {
  label: string;
  prompt: string;
  hint: string;
};

export const PM_CHAT_STARTERS: PmChatStarter[] = [
  {
    label: "Customer report",
    prompt: "A customer says exports fail after they retry — help me triage this",
    hint: "Repro steps & impact",
  },
  {
    label: "Error logs",
    prompt: "Help me understand this 500 error from production logs",
    hint: "Parse stack traces",
  },
  {
    label: "Post-deploy",
    prompt: "We noticed odd behaviour right after yesterday's deploy",
    hint: "Diff & rollback options",
  },
  {
    label: "Search codebase",
    prompt: "Where in GitHub would webhook retries be handled?",
    hint: "Read-only repo search",
  },
  {
    label: "Prioritize",
    prompt: "How urgent is this if only one enterprise customer is affected?",
    hint: "Severity & SLA",
  },
  {
    label: "Draft ticket",
    prompt: "I have enough context — walk me through filing a ticket",
    hint: "When you're ready",
  },
];

export const TICKET_QUICK_PROMPTS = [
  "What do we know about this so far?",
  "Search GitHub for related code",
  "How bad is the customer impact?",
];

const CODE_SEARCH = /code|github|repo|file|search|where|function|route|api/i;
const DECIDE = /accept|reject|ignore|decide|what should i do|recommend/i;
const FILE_INTENT = /file.*ticket|create.*ticket|generate.*ticket|log.*ticket|make.*ticket/i;
const DEV_INTENT = /send.*(dev|development)|escalate.*dev|hand.*off.*dev/i;

const QUICK_PROMPTS = [...PM_QUICK_PROMPTS, ...TICKET_QUICK_PROMPTS];

function isQuickPrompt(text: string) {
  const t = text.trim().toLowerCase();
  return QUICK_PROMPTS.some((p) => p.toLowerCase() === t);
}

function userTurns(history: PmChatMessage[], current: string): string[] {
  return [...history.filter((m) => m.role === "user").map((m) => m.content), current];
}

function combinedText(turns: string[]): string {
  return turns.join("\n");
}

function proposalAlreadyOffered(history: PmChatMessage[]): boolean {
  return history.some((m) => m.role === "pm" && m.proposal);
}

function hasEnoughContext(turns: string[], ticket?: Ticket): boolean {
  const text = combinedText(turns);
  const totalLen = text.length;

  if (ticket) {
    if (turns.length >= 2) return true;
    const last = turns[turns.length - 1] ?? "";
    if (isQuickPrompt(last)) return false;
    return last.length >= 40 || totalLen >= 60;
  }

  if (turns.length >= 3 && totalLen >= 100) return true;
  if (turns.length >= 2 && totalLen >= 120) return true;
  if (turns.some((t) => t.length >= 150)) return true;
  return false;
}

function inferClassification(text: string): Classification {
  if (/feature|suggest|add |would like|request/i.test(text)) return "feature_request";
  if (/churn|cancel|leave|switching/i.test(text)) return "churn_signal";
  if (/how (do|does|to)|what is|where is|documentation/i.test(text)) return "question";
  return "bug";
}

function inferScope(text: string): Scope {
  if (/refactor|entire|all users|major|platform/i.test(text)) return "L";
  if (/small|typo|copy|label|wording/i.test(text)) return "S";
  return "M";
}

export function buildTicketProposal(turns: string[], ticket?: Ticket): PmChatTicketProposal {
  const text = combinedText(turns);
  const classification = ticket?.classification ?? inferClassification(text);
  const scope = ticket?.scope ?? inferScope(text);
  const summary = ticket
    ? `${ticket.originalSubject}\n\n${ticket.originalBody}\n\n---\nPM notes from chat:\n${text}`
    : text;

  return {
    title:
      ticket?.draftTitle ??
      (turns[0]?.length > 72 ? `${turns[0].slice(0, 72)}…` : turns[0] || "Customer issue from PM Agent Chat"),
    classification,
    scope,
    summary,
    severity: "escalate",
  };
}

function githubSearchReply(ticket: Ticket): string {
  const refs = ticket.codeRefs.slice(0, 3);
  const repo = "acmetech/api-backend";
  const lines = refs.length
    ? refs
        .map(
          (r, i) =>
            `${i + 1}. \`${r.filePath}\`${r.functionName ? ` → \`${r.functionName}()\`` : ""}${r.lineStart ? ` (L${r.lineStart}–${r.lineEnd})` : ""}`
        )
        .join("\n")
    : "1. `src/exports/audit-log.ts` → `exportAuditBatch()`\n2. `src/webhooks/delivery.ts` → `retryFailedExport()`";

  return `I searched **${repo}** (read-only) for areas tied to this report:

${lines}

From the code and docs, the likely problem is: ${ticket.draftDescription.split(".")[0]}.

A sensible fix direction: ${ticket.suggestedApproach.split(".")[0]}.

Does that line up with what you're seeing? If anything from the customer thread changes the picture, tell me.`;
}

function decideReply(ticket: Ticket): string {
  const highRisk = (ticket.priorityScore ?? 0) >= 70 || ticket.classification === "churn_signal";
  if (highRisk) {
    return `Given the urgency and ${ticket.customer.name}'s report, I'd lean toward **Accept & send to Dev** in Triage.

The classification looks like ${ticket.classification.replace("_", " ")} with elevated priority. Want me to walk through the code refs first, or are you ready to decide back in Triage?`;
  }
  if (ticket.aiConfidenceLevel === "low") {
    return `Confidence is only **${ticket.aiConfidence}%** on the auto-draft — there may be missing context.

Before deciding in Triage, is there anything the customer said that we haven't accounted for yet?`;
  }
  return `If the code refs look right, **Accept & send to Dev** is reasonable. If it's ops/process-only, **Accept (non-technical)** may fit better.

Anything still unclear about the customer's situation?`;
}

function explainTicket(ticket: Ticket): string {
  return `Here's the issue in plain language:

**Customer:** ${ticket.customer.name}
**They reported:** ${ticket.originalSubject}

${ticket.originalBody.slice(0, 500)}${ticket.originalBody.length > 500 ? "…" : ""}

**My read:** ${ticket.draftDescription.split(".")[0]}.

What part of this do you want to dig into — impact, repro steps, or the code path?`;
}

function rootCauseReply(ticket: Ticket): string {
  const code = ticket.codeRefs[0];
  return `Based on what's indexed in GitHub and the customer report:

**What's going wrong:** ${ticket.draftDescription.split(".")[0]}.
**Relevant code:** ${code ? `\`${code.filePath}\`${code.functionName ? ` · \`${code.functionName}()\`` : ""}` : "still narrowing down the match"}
**Suggested approach:** ${ticket.suggestedApproach}

Is there customer context that contradicts this, or does it match what you know?`;
}

function pickFollowUp(turns: string[], ticket?: Ticket): string {
  const text = combinedText(turns).toLowerCase();
  const last = turns[turns.length - 1] ?? "";

  if (ticket && turns.length === 1 && isQuickPrompt(last)) {
    if (/github|code|search/i.test(last)) {
      return `Before I search the repo — anything the customer said that isn't in the ticket yet? Even one detail can change where I look.`;
    }
    if (/impact|bad|know/i.test(last)) {
      return `Happy to assess impact. Are customers blocked entirely, or is this intermittent / affecting a subset?`;
    }
    if (/explain|know|what do we/i.test(last)) {
      return explainTicket(ticket);
    }
  }

  if (!text.match(/customer|user|client/)) {
    return `Who is affected — one customer, a segment, or everyone?`;
  }
  if (!text.match(/when|since|started|after|before|today|yesterday|week/)) {
    return `When did this start, and does it happen every time or only sometimes?`;
  }
  if (!text.match(/error|message|screenshot|log|500|404|timeout/)) {
    return `Have you seen an error message, failed request, or any logs that point to where it breaks?`;
  }
  if (!text.match(/tried|repro|step|click|flow|route/)) {
    return `What steps lead to the problem — or what has the customer already tried?`;
  }
  if (!text.match(/urgent|critical|block|workaround|sla/)) {
    return `How urgent is this for the customer — are they blocked, or is there a workaround?`;
  }
  if (ticket) {
    return `Anything else from ${ticket.customer.name}'s thread that changes how we should handle this?`;
  }
  return `Thanks — that helps. Anything else I should know before we decide whether to file a ticket or send this to the dev team?`;
}

function discoveryReply(turns: string[], ticket?: Ticket): string {
  const last = turns[turns.length - 1] ?? "";

  if (turns.length === 1 && !ticket) {
    if (isQuickPrompt(last)) {
      return `Sure — tell me what's happening in your own words. Who reported it, what they expected, and what's going wrong instead.`;
    }
    return `Got it. ${pickFollowUp(turns, ticket)}`;
  }

  if (turns.length === 1 && ticket) {
    if (/explain|simply|summary|what.*issue/i.test(last)) {
      return explainTicket(ticket);
    }
    if (isQuickPrompt(last)) {
      return pickFollowUp(turns, ticket);
    }
    return `I've got **#${ticket.originalTicketId}** from ${ticket.customer.name} loaded. ${pickFollowUp(turns, ticket)}`;
  }

  const ack =
    last.length > 20
      ? `Thanks — "${last.length > 60 ? `${last.slice(0, 60)}…` : last}" gives me more to work with.`
      : `Understood.`;

  return `${ack}\n\n${pickFollowUp(turns, ticket)}`;
}

function summarizeForProposal(turns: string[], ticket?: Ticket): string {
  const text = combinedText(turns);
  const headline = ticket
    ? `I think I have enough context on **#${ticket.originalTicketId}** (${ticket.customer.name}).`
    : `I think I have enough context on this issue.`;

  const gist = ticket
    ? `${ticket.originalSubject} — ${ticket.draftDescription.split(".")[0]}.`
    : text.slice(0, 200) + (text.length > 200 ? "…" : "");

  return `${headline}

**Summary:** ${gist}

When you're ready, choose below:
• **Generate ticket** — file in Triage for review
• **Send to development team** — create and route straight to dev
• **Not now** — keep chatting or drop it`;
}

export function classifyChatMessage(text: string): "simple" | "escalate" {
  if (/bug|broken|not working|error|fail|crash|outage|urgent|double|wrong/i.test(text)) return "escalate";
  if (/how (do|does|to)|what is|where is|expected|work\?/i.test(text)) return "simple";
  return text.length > 120 || text.includes("?") ? "simple" : "escalate";
}

export function generatePmReply(
  userMessage: string,
  opts?: { ticket?: Ticket; history?: PmChatMessage[] }
): { text: string; proposal?: PmChatTicketProposal } {
  const ticket = opts?.ticket;
  const history = opts?.history ?? [];
  const turns = userTurns(history, userMessage);
  const ready = hasEnoughContext(turns, ticket);
  const alreadyOffered = proposalAlreadyOffered(history);

  if (ticket) {
    if (CODE_SEARCH.test(userMessage) && !isQuickPrompt(userMessage)) {
      return { text: githubSearchReply(ticket) };
    }
    if (CODE_SEARCH.test(userMessage) && isQuickPrompt(userMessage)) {
      return { text: `${githubSearchReply(ticket)}\n\nWant to add anything from the customer before we decide next steps?` };
    }
    if (DECIDE.test(userMessage) && ready) {
      return { text: decideReply(ticket), proposal: buildTicketProposal(turns, ticket) };
    }
    if (DECIDE.test(userMessage) && !ready) {
      return { text: `${decideReply(ticket)}\n\nI can suggest filing options once we've covered a bit more context.` };
    }
    if (/root cause|why is|why does|what's causing/i.test(userMessage)) {
      return { text: rootCauseReply(ticket) };
    }
    if (/explain|simply|summary|what.*(issue|problem|happening)/i.test(userMessage)) {
      return { text: explainTicket(ticket) };
    }
    if (/who|assign|developer|team/i.test(userMessage)) {
      const code = ticket.codeRefs[0];
      return {
        text: `Based on \`${code?.filePath ?? "the codebase"}\`, this likely routes to **backend** for API/webhooks, or **frontend** if it's UI-only.\n\nDoes that match your understanding of the report?`,
      };
    }
  }

  if (FILE_INTENT.test(userMessage) || DEV_INTENT.test(userMessage)) {
    if (ready) {
      return { text: summarizeForProposal(turns, ticket), proposal: buildTicketProposal(turns, ticket) };
    }
    return {
      text: `I can file this once I understand the problem a little better.\n\n${pickFollowUp(turns, ticket)}`,
    };
  }

  if (ready && !alreadyOffered) {
    return { text: summarizeForProposal(turns, ticket), proposal: buildTicketProposal(turns, ticket) };
  }

  if (ready && alreadyOffered) {
    return {
      text: `I've already suggested filing options above. Tell me if anything changed, or pick an action there.`,
    };
  }

  return { text: discoveryReply(turns, ticket) };
}
