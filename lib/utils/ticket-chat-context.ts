import type { PmChatMessage, Ticket } from "@/lib/types";

function pmContextBody(ticket: Ticket): string {
  const codeLine = ticket.codeRefs[0]
    ? `\n**Likely code:** \`${ticket.codeRefs[0].filePath}\`${ticket.codeRefs[0].functionName ? ` · \`${ticket.codeRefs[0].functionName}()\`` : ""}`
    : "";

  return `I've loaded this ticket from Triage.

**Customer:** ${ticket.customer.name} (${ticket.customer.plan})
**Report:** ${ticket.originalSubject}

${ticket.originalBody.slice(0, 420)}${ticket.originalBody.length > 420 ? "…" : ""}

**Draft summary:** ${ticket.draftDescription.split(".")[0]}.${codeLine}

What would you like to explore — root cause, customer impact, or next steps?`;
}

/** Seed messages when opening PM Agent from a triage ticket. */
export function buildTicketContextMessages(sessionId: string, ticket: Ticket): PmChatMessage[] {
  const now = new Date().toISOString();
  return [
    {
      id: `u_ctx_${Date.now()}`,
      sessionId,
      ticketId: ticket.id,
      role: "user",
      content: `I'm reviewing **#${ticket.originalTicketId}** — ${ticket.originalSubject}`,
      timestamp: now,
    },
    {
      id: `pm_ctx_${Date.now() + 1}`,
      sessionId,
      ticketId: ticket.id,
      role: "pm",
      content: pmContextBody(ticket),
      timestamp: now,
    },
  ];
}
