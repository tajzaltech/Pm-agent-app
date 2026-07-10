import type { PmChatMessage, Ticket } from "@/lib/types";

export function buildTicketContextMessages(sessionId: string, ticket: Ticket): PmChatMessage[] {
  const now = new Date().toISOString();
  return [
    {
      id: `sys_ctx_${sessionId}`,
      sessionId,
      ticketId: ticket.id,
      role: "user",
      content: `I need help with ticket **#${ticket.originalTicketId}** — "${ticket.originalSubject}"`,
      timestamp: now,
    },
  ];
}
