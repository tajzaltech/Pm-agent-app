"use client";

import { PmChatView } from "@/components/chat/PmChatView";

interface PmChatShellProps {
  sessionId: string;
  ticketId?: string;
}

/** Ticket context now lives in TopNav (see TicketBreadcrumb), so this is just the view. */
export function PmChatShell({ sessionId, ticketId }: PmChatShellProps) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PmChatView sessionId={sessionId} ticketId={ticketId} />
      </div>
    </div>
  );
}
