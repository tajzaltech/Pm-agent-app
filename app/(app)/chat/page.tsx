"use client";

import { useEffect, useState } from "react";
import { PmChatShell } from "@/components/chat/PmChatShell";
import { usePmChatStore } from "@/lib/store/pm-chat";

export default function GlobalChatPage() {
  const ensureGlobalSession = usePmChatStore((s) => s.ensureGlobalSession);
  const activeSessionId = usePmChatStore((s) => s.activeSessionId);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(ensureGlobalSession());
  }, [ensureGlobalSession]);

  useEffect(() => {
    if (!sessionId || activeSessionId.startsWith("ticket_")) return;
    if (activeSessionId !== sessionId) {
      setSessionId(activeSessionId);
    }
  }, [activeSessionId, sessionId]);

  if (!sessionId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-screen min-h-0">
      <PmChatShell sessionId={sessionId} />
    </div>
  );
}
