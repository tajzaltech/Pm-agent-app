"use client";

import { useEffect, useState } from "react";
import { PmChatShell } from "@/components/chat/PmChatShell";
import { usePmChatStore } from "@/lib/store/pm-chat";

export default function GlobalChatPage() {
  const ensureGlobalSession = usePmChatStore((s) => s.ensureGlobalSession);
  const activeSessionId = usePmChatStore((s) => s.activeSessionId);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSessionId) {
      setSessionId(activeSessionId);
    } else {
      setSessionId(ensureGlobalSession());
    }
  }, [activeSessionId, ensureGlobalSession]);

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const ticketId = sessionId.startsWith("ticket_") ? sessionId.slice("ticket_".length) : undefined;

  return <PmChatShell sessionId={sessionId} ticketId={ticketId} />;
}
