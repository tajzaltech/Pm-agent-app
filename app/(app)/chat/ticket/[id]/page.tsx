"use client";

import { useEffect, useState, use } from "react";
import { PmChatShell } from "@/components/chat/PmChatShell";
import { usePmChatStore } from "@/lib/store/pm-chat";

export default function TicketChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const openChat = usePmChatStore((s) => s.openChat);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sid = openChat({ ticketId: id });
    setSessionId(sid);
  }, [id, openChat]);

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <PmChatShell sessionId={sessionId} ticketId={id} />;
}
