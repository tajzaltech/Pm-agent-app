import type { Classification, PmChatTicketProposal, Scope, Ticket } from "@/lib/types";

export const PM_QUICK_PROMPTS = [
  "Search GitHub for related code",
  "Explain this issue simply",
  "What's the root cause?",
  "Should I accept or reject?",
];

const HOW_TO = /how (do|does|to)|what is|where is|expected|work\?/i;
const ESCALATE = /bug|broken|not working|error|fail|crash|outage|urgent|double|wrong/i;
const CODE_SEARCH = /code|github|repo|file|search|where|function|route|api/i;
const DECIDE = /accept|reject|ignore|decide|what should i do|recommend/i;

export function classifyChatMessage(text: string): "simple" | "escalate" {
  if (ESCALATE.test(text)) return "escalate";
  if (HOW_TO.test(text)) return "simple";
  return text.length > 120 || text.includes("?") ? "simple" : "escalate";
}

export function buildTicketProposal(text: string, ticket?: Ticket): PmChatTicketProposal {
  const classification: Classification = /feature|suggest|add /i.test(text)
    ? "feature_request"
    : /churn|cancel|leave/i.test(text)
      ? "churn_signal"
      : HOW_TO.test(text)
        ? "question"
        : "bug";
  const scope: Scope = /refactor|entire|all users|major/i.test(text) ? "L" : /small|typo|copy/i.test(text) ? "S" : "M";

  return {
    title: ticket?.draftTitle ?? `Chat issue: ${text.slice(0, 72)}${text.length > 72 ? "…" : ""}`,
    classification,
    scope,
    summary: ticket?.draftDescription ?? text,
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

  return `**GitHub connected** · searching \`${repo}\` (read-only)

I matched these areas to this query:

${lines}

**Likely issue:** ${ticket.draftDescription.split(".")[0]}.

**Suggested fix direction:** ${ticket.suggestedApproach.split(".")[0]}.

When this looks right, go back to **Triage** — the full draft, AI reasoning, and Accept/Reject actions will be ready.`;
}

function decideReply(ticket: Ticket): string {
  const highRisk = (ticket.priorityScore ?? 0) >= 70 || ticket.classification === "churn_signal";
  if (highRisk) {
    return `**Recommendation:** **Accept & send to Dev** — ${ticket.classification.replace("_", " ")} with priority ${ticket.priorityScore ?? "high"}.

**Why not ignore:** Customer (${ticket.customer.name}) flagged compliance/urgency language.

**Next:** Return to Triage → review the draft PM Agent built → Accept & send to Dev, or Edit first.`;
  }
  if (ticket.aiConfidenceLevel === "low") {
    return `**Recommendation:** Ask one more clarifying question in chat, or **Edit** the draft in Triage before accepting.

Confidence is **${ticket.aiConfidence}%** — code match exists but scope may need PM review.`;
  }
  return `**Recommendation:** **Accept & send to Dev** if the code refs look correct, or **Accept (non-technical)** if this is ops/process only.

Return to Triage to use the action bar — everything unlocks after this PM Agent session.`;
}

export function generatePmReply(
  userMessage: string,
  opts?: { ticket?: Ticket; categories?: string[] }
): { text: string; proposal?: PmChatTicketProposal } {
  const ticket = opts?.ticket;
  const severity = classifyChatMessage(userMessage);

  if (ticket) {
    if (CODE_SEARCH.test(userMessage)) {
      return { text: githubSearchReply(ticket) };
    }
    if (DECIDE.test(userMessage)) {
      return { text: decideReply(ticket) };
    }
    if (/theme|summary|about|explain/i.test(userMessage)) {
      return {
        text: `**Step 1 — Understand the query**

**Theme:** ${ticket.classification.replace("_", " ")}
**Customer:** ${ticket.customer.name}
**Subject:** ${ticket.originalSubject}

${ticket.draftDescription.slice(0, 400)}${ticket.draftDescription.length > 400 ? "…" : ""}

Say *Search GitHub for related code* and I'll scan the connected repo next.`,
      };
    }
    if (/root cause|why|problem|bug|fix/i.test(userMessage)) {
      const code = ticket.codeRefs[0];
      return {
        text: `**Step 2 — Root cause (from code + docs)**

**Problem:** ${ticket.draftDescription.split(".")[0]}.

**Code:** ${code ? `\`${code.filePath}\`${code.functionName ? ` · \`${code.functionName}()\`` : ""}` : "Searching indexed repo…"}

**Approach:** ${ticket.suggestedApproach}

Ask *Should I accept or reject?* when you're ready to decide in Triage.`,
      };
    }
    if (/who|assign|developer/i.test(userMessage)) {
      const code = ticket.codeRefs[0];
      return {
        text: `Based on \`${code?.filePath ?? "the codebase"}\`, route to **backend** for API/export/webhooks, or **frontend** for UI-only issues.`,
      };
    }
  }

  if (severity === "simple" && !ESCALATE.test(userMessage) && !ticket) {
    return {
      text: `**GitHub & docs connected (read-only).**

I can search your repo, explain behaviour, and file confirmed tickets into Triage.

Describe the issue or pick a quick prompt below.`,
    };
  }

  if (severity === "simple" && ticket && !ESCALATE.test(userMessage)) {
    return {
      text: `From indexed **GitHub** repos and product docs:

${ticket.suggestedApproach.slice(0, 280)}…

This may be informational — use *Should I accept or reject?* if you need a triage decision.`,
    };
  }

  const proposal = buildTicketProposal(userMessage, ticket);
  return {
    text: `**Step 3 — Confirm ticket**

This needs a formal ticket. I can file:

• **Category:** ${proposal.classification.replace("_", " ")}
• **Scope:** ${proposal.scope}
• **Summary:** ${proposal.summary.slice(0, 160)}…

Confirm below → appears in **Triage** as *via PM Agent Chat*.`,
    proposal,
  };
}
