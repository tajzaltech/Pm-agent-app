"use client";

import { useEffect } from "react";
import { PmChatShell } from "@/components/chat/PmChatShell";
import { usePmChatStore } from "@/lib/store/pm-chat";

export default function GlobalChatPage() {
  const activeSessionId = usePmChatStore((s) => s.activeSessionId);
  const ensureGlobalSession = usePmChatStore((s) => s.ensureGlobalSession);

  useEffect(() => {
    ensureGlobalSession();
  }, [ensureGlobalSession]);

  return (
    <div className="h-screen min-h-0">
      <PmChatShell sessionId={activeSessionId} />
    </div>
  );
}
