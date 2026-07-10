"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { PmChatView } from "@/components/chat/PmChatView";
import { useTicketStore } from "@/lib/store/tickets";
import { cn } from "@/lib/utils";

const CLASS_COLORS: Record<string, string> = {
  bug: "bg-red-50 text-red-700 border-red-100",
  feature_request: "bg-blue-50 text-blue-700 border-blue-100",
  question: "bg-amber-50 text-amber-700 border-amber-100",
  churn_signal: "bg-orange-50 text-orange-700 border-orange-100",
};

const SCOPE_LABELS: Record<string, string> = { S: "Small", M: "Medium", L: "Large" };

interface PmChatShellProps {
  sessionId: string;
  ticketId?: string;
}

export function PmChatShell({ sessionId, ticketId }: PmChatShellProps) {
  const ticket = useTicketStore((s) => (ticketId ? s.getById(ticketId) : undefined));
  const classColor = ticket ? (CLASS_COLORS[ticket.classification] ?? "") : "";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {ticket && (
        <div className="shrink-0 border-b px-4 h-10 flex items-center gap-3 bg-muted/20">
          <Link
            href="/pipeline"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} />
            Pipeline
          </Link>
          <span className="w-px h-3.5 bg-border" />
          <span className="text-[12px] font-mono text-muted-foreground">#{ticket.originalTicketId}</span>
          <span className="text-[12px] font-medium truncate">{ticket.customer.name}</span>
          <span className={cn("hidden sm:inline-flex shrink-0 rounded border px-1.5 py-px text-[9px] font-medium", classColor)}>
            {ticket.classification.replace("_", " ")}
          </span>
          <span className="hidden md:inline text-[10px] text-muted-foreground/60 shrink-0">
            {SCOPE_LABELS[ticket.scope] ?? ticket.scope} scope
          </span>
        </div>
      )}
      <PmChatView sessionId={sessionId} ticketId={ticketId} />
    </div>
  );
}
