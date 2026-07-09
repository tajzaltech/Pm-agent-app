"use client";

import { use, useEffect } from "react";
import { PmChatShell } from "@/components/chat/PmChatShell";
import { usePmChatStore } from "@/lib/store/pm-chat";

export default function TicketChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const openChat = usePmChatStore((s) => s.openChat);
  const sessionId = `ticket_${id}`;

  useEffect(() => {
    openChat({ ticketId: id });
  }, [id, openChat]);

  return (
    <div className="h-screen min-h-0">
      <PmChatShell sessionId={sessionId} ticketId={id} />
    </div>
  );
}
