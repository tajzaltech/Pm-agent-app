import type { Classification, PmChatMessage, PmChatTicketProposal, Scope, Ticket } from "@/lib/types";

/* ─── Quick prompts for UI ─── */

export const PM_QUICK_PROMPTS = [
  "A customer reported something broken",
  "Help me understand an issue",
  "Draft a ticket for dev",
];

export const TICKET_QUICK_PROMPTS = [
  "What's going on with this ticket?",
  "Check the system for related issues",
  "What should we do next?",
];

export type PmChatStarter = { label: string; prompt: string; hint: string };
export const PM_CHAT_STARTERS: PmChatStarter[] = [
  { label: "Customer report", prompt: "A customer says exports fail after they retry — help me triage this", hint: "Repro steps & impact" },
  { label: "Error logs", prompt: "Help me understand this 500 error from production logs", hint: "Parse stack traces" },
  { label: "Post-deploy", prompt: "We noticed odd behaviour right after yesterday's deploy", hint: "Diff & rollback options" },
  { label: "Search system", prompt: "Where would webhook retries be handled?", hint: "Read-only system search" },
  { label: "Prioritize", prompt: "How urgent is this if only one enterprise customer is affected?", hint: "Severity & SLA" },
  { label: "Draft ticket", prompt: "I have enough context — walk me through filing a ticket", hint: "When you're ready" },
];

/* ─── Intent detection ─── */

const CODE_SEARCH = /code|github|repo|file|search|where|function|route|api|codebase/i;
const DECIDE = /accept|reject|ignore|decide|what should (i|we) do|recommend|next step/i;
const FILE_INTENT = /file.*ticket|create.*ticket|generate.*ticket|log.*ticket|make.*ticket/i;
const DEV_INTENT = /send.*(dev|development)|escalate.*dev|hand.*off.*dev/i;
const ROOT_CAUSE = /root cause|why is|why does|what'?s causing|what happened|what went wrong/i;
const EXPLAIN = /explain|summary|what'?s.*(issue|problem|happening|going on|this about)/i;

const QUICK_PROMPTS = [...PM_QUICK_PROMPTS, ...TICKET_QUICK_PROMPTS];
function isQuickPrompt(text: string) {
  const t = text.trim().toLowerCase();
  return QUICK_PROMPTS.some((p) => p.toLowerCase() === t);
}

/* ─── Helpers ─── */

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
  if (ticket) {
    if (turns.length >= 2) return true;
    const last = turns[turns.length - 1] ?? "";
    if (isQuickPrompt(last)) return false;
    return last.length >= 40 || text.length >= 60;
  }
  if (turns.length >= 3 && text.length >= 100) return true;
  if (turns.length >= 2 && text.length >= 120) return true;
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

/* ─── Proposal builder ─── */

export function buildTicketProposal(turns: string[], ticket?: Ticket): PmChatTicketProposal {
  const text = combinedText(turns);
  const classification = ticket?.classification ?? inferClassification(text);
  const scope = ticket?.scope ?? inferScope(text);
  const summary = ticket
    ? `${ticket.originalSubject}\n\n${ticket.originalBody}\n\n---\nPM notes from chat:\n${text}`
    : text;

  return {
    title: ticket?.draftTitle ?? (turns[0]?.length > 72 ? `${turns[0].slice(0, 72)}…` : turns[0] || "Customer issue from PM Agent Chat"),
    classification,
    scope,
    summary,
    severity: "escalate",
  };
}

export function classifyChatMessage(text: string): "simple" | "escalate" {
  if (/bug|broken|not working|error|fail|crash|outage|urgent|double|wrong/i.test(text)) return "escalate";
  if (/how (do|does|to)|what is|where is|expected|work\?/i.test(text)) return "simple";
  return text.length > 120 || text.includes("?") ? "simple" : "escalate";
}

/* ─── Ticket-aware investigation replies ─── */

function investigationReply(ticket: Ticket): string {
  const refs = ticket.codeRefs.slice(0, 3);
  const codeSection = refs.length
    ? refs.map((r, i) =>
        `${i + 1}. \`${r.filePath}\`${r.functionName ? ` → \`${r.functionName}()\`` : ""} (lines ${r.lineStart}–${r.lineEnd})`
      ).join("\n")
    : "No direct code references found yet.";

  const scopeLabel = ticket.scope === "S" ? "Small" : ticket.scope === "M" ? "Medium" : "Large";
  const classLabel = ticket.classification.replace("_", " ");

  return `I've analyzed ticket **#${ticket.originalTicketId}** from **${ticket.customer.name}** (${ticket.customer.plan} plan).

**What the customer reported:**
${ticket.originalSubject}

**What I found in the system:**
${codeSection}

**Root cause analysis:**
${ticket.draftDescription}

**Impact:** ${ticket.customer.plan === "enterprise" ? "High — enterprise customer, likely affecting other users on this tier" : "Moderate — affects " + ticket.customer.plan + " tier users"}
**Classification:** ${classLabel} · **Scope:** ${scopeLabel} — ${ticket.scopeRationale}

**Recommended approach:**
${ticket.suggestedApproach}

What would you like to do? I can **create a ticket for dev** or help you **draft a response to ${ticket.customer.name}**.`;
}

function codeSearchReply(ticket: Ticket): string {
  const refs = ticket.codeRefs.slice(0, 3);
  if (!refs.length) {
    return `I searched the connected repository but couldn't find a direct code match for this issue. The problem might be in configuration or infrastructure rather than application code.\n\nWant me to focus on drafting a response to ${ticket.customer.name} instead?`;
  }

  const lines = refs.map((r, i) => {
    const loc = r.lineStart ? ` (L${r.lineStart}–${r.lineEnd})` : "";
    return `**${i + 1}. \`${r.filePath}\`**${r.functionName ? ` → \`${r.functionName}()\`` : ""}${loc}\n${r.snippet ? "```" + (r.language ?? "") + "\n" + r.snippet.split("\n").slice(0, 6).join("\n") + "\n```" : ""}`;
  }).join("\n\n");

  return `Here's what I found in the system:\n\n${lines}\n\n**Analysis:** ${ticket.draftDescription.split(".")[0]}.\n\nThe fix direction would be: ${ticket.suggestedApproach.split(".")[0]}.\n\nWant me to create a dev ticket with this context, or do you need more detail?`;
}

function rootCauseReply(ticket: Ticket): string {
  const code = ticket.codeRefs[0];
  const codeRef = code
    ? `The issue traces to \`${code.filePath}\`${code.functionName ? ` in the \`${code.functionName}()\` function` : ""} (lines ${code.lineStart}–${code.lineEnd}).`
    : "I'm still narrowing down the exact code path.";

  return `**Root cause for #${ticket.originalTicketId}:**

${ticket.draftDescription}

**Code trace:**
${codeRef}

**Suggested fix:**
${ticket.suggestedApproach}

**Acceptance criteria:**
${ticket.acceptanceCriteria.map((c) => `• ${c}`).join("\n")}

This is a ${ticket.scope === "S" ? "small" : ticket.scope === "M" ? "medium" : "large"}-scope fix. Want me to turn this into a dev ticket?`;
}

function explainReply(ticket: Ticket): string {
  return `Here's ticket **#${ticket.originalTicketId}** in plain language:

**Who:** ${ticket.customer.name} (${ticket.customer.email}) — ${ticket.customer.plan} plan
**What they said:** "${ticket.originalSubject}"

${ticket.originalBody.slice(0, 600)}${ticket.originalBody.length > 600 ? "…" : ""}

**What I think is happening:**
${ticket.draftDescription.split(".").slice(0, 2).join(".")}.

**Internal notes:** ${ticket.internalNotes}

What would you like to explore — the code behind this, the impact, or ready to decide on next steps?`;
}

function decideReply(ticket: Ticket): string {
  if (ticket.classification === "bug" || ticket.classification === "churn_signal") {
    return `Based on my analysis, this needs engineering attention. Here's what I'd recommend:

**${ticket.draftTitle}**
• Classification: ${ticket.classification.replace("_", " ")}
• Scope: ${ticket.scope} — ${ticket.scopeRationale}
• Customer: ${ticket.customer.name} (${ticket.customer.plan})

The fix is clear: ${ticket.suggestedApproach.split(".")[0]}.

I'd say **send this to dev**. Want me to create the ticket?`;
  }

  if (ticket.classification === "question") {
    return `This looks like a support/documentation gap rather than a code bug.

**${ticket.customer.name}** is asking about: ${ticket.originalSubject}

I'd recommend **drafting a customer reply** with the answer, rather than creating a dev ticket. The underlying fix (${ticket.suggestedApproach.split(".")[0].toLowerCase()}) is small enough to handle separately.

What would you prefer — reply to the customer, or still create a dev ticket?`;
  }

  return `Here's my recommendation for **#${ticket.originalTicketId}**:

This is a ${ticket.classification.replace("_", " ")} with ${ticket.scope} scope. ${ticket.suggestedApproach.split(".")[0]}.

You can:
• **Create a ticket for dev** — if this needs engineering work
• **Draft a customer reply** — if this can be resolved with guidance
• **Skip for now** — if you need more info

What makes sense?`;
}

/* ─── Global chat (no ticket) replies ─── */

function pickFollowUp(turns: string[], ticket?: Ticket): string {
  const text = combinedText(turns).toLowerCase();

  if (ticket && turns.length === 1 && isQuickPrompt(turns[0])) {
    return investigationReply(ticket);
  }

  if (!text.match(/customer|user|client|who/)) {
    return `Who is affected — one customer, a segment, or everyone? And do you have a ticket ID or customer name I can look up?`;
  }
  if (!text.match(/when|since|started|after|before|today|yesterday|week/)) {
    return `Got it. When did this start — is it new, or has it been happening for a while?`;
  }
  if (!text.match(/error|message|screenshot|log|500|404|timeout|broken|bug/)) {
    return `Do you have an error message, screenshot, or log entry? Even a rough description of what they see helps me search the system.`;
  }
  if (!text.match(/tried|repro|step|click|flow|route/)) {
    return `What steps lead to the problem? If the customer shared repro steps, paste them here.`;
  }
  if (ticket) {
    return `I think I have enough to work with. Want me to search the system for related issues, or are you ready to decide on next steps?`;
  }
  return `That's helpful context. I can either help you draft a ticket for dev, or help craft a customer response. What would you like to do?`;
}

function discoveryReply(turns: string[], ticket?: Ticket): string {
  const last = turns[turns.length - 1] ?? "";

  if (turns.length === 1 && !ticket) {
    if (isQuickPrompt(last)) {
      return `Sure — give me the details. Who reported it, what they expected to happen, and what went wrong instead. If you have a ticket ID, I can pull the context automatically.`;
    }
    return `Got it — let me dig into this.\n\n${pickFollowUp(turns, ticket)}`;
  }

  if (turns.length === 1 && ticket) {
    return investigationReply(ticket);
  }

  const ack = last.length > 30
    ? `Thanks for that detail.`
    : `Understood.`;

  return `${ack}\n\n${pickFollowUp(turns, ticket)}`;
}

function summarizeForProposal(turns: string[], ticket?: Ticket): string {
  if (ticket) {
    return `I've completed my analysis of **#${ticket.originalTicketId}**.

**Summary:** ${ticket.draftTitle}
**Root cause:** ${ticket.draftDescription.split(".")[0]}.
**Scope:** ${ticket.scope} — ${ticket.scopeRationale}
**Fix:** ${ticket.suggestedApproach.split(".")[0]}.

Ready to take action:`;
  }

  const text = combinedText(turns);
  return `I think I have enough context on this issue.

**Summary:** ${text.slice(0, 200)}${text.length > 200 ? "…" : ""}

Ready to take action:`;
}

/* ─── Main entry point ─── */

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
    if (turns.length === 1) {
      return { text: investigationReply(ticket) };
    }

    if (CODE_SEARCH.test(userMessage)) {
      return { text: codeSearchReply(ticket) };
    }
    if (ROOT_CAUSE.test(userMessage)) {
      return { text: rootCauseReply(ticket) };
    }
    if (EXPLAIN.test(userMessage)) {
      return { text: explainReply(ticket) };
    }
    if (DECIDE.test(userMessage) || FILE_INTENT.test(userMessage) || DEV_INTENT.test(userMessage)) {
      return { text: summarizeForProposal(turns, ticket), proposal: buildTicketProposal(turns, ticket) };
    }
    if (/who|assign|developer|team/i.test(userMessage)) {
      const code = ticket.codeRefs[0];
      const team = code?.filePath.includes("api") || code?.filePath.includes("checkout") || code?.filePath.includes("service")
        ? "backend" : "frontend";
      return {
        text: `Based on the code paths involved (\`${code?.filePath ?? "TBD"}\`), this routes to the **${team} team**.\n\nWant me to create the ticket and assign it?`,
      };
    }

    if (ready && !alreadyOffered) {
      return { text: summarizeForProposal(turns, ticket), proposal: buildTicketProposal(turns, ticket) };
    }
    if (ready && alreadyOffered) {
      return { text: `I've already provided my analysis and action options above. Is there something specific you'd like me to dig into further, or are you ready to pick an action?` };
    }
  }

  if (FILE_INTENT.test(userMessage) || DEV_INTENT.test(userMessage)) {
    if (ready) {
      return { text: summarizeForProposal(turns, ticket), proposal: buildTicketProposal(turns, ticket) };
    }
    return { text: `I can create a ticket once I understand the issue a bit better.\n\n${pickFollowUp(turns, ticket)}` };
  }

  if (ready && !alreadyOffered) {
    return { text: summarizeForProposal(turns, ticket), proposal: buildTicketProposal(turns, ticket) };
  }

  if (ready && alreadyOffered) {
    return { text: `I've already suggested action options above. Let me know if anything changed, or pick an action from the card.` };
  }

  return { text: discoveryReply(turns, ticket) };
}
