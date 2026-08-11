"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";

import { usePmChatStore } from "@/lib/store/pm-chat";
import { useTicketStore } from "@/lib/store/tickets";
import { cn } from "@/lib/utils";

const CLASS_COLORS: Record<string, string> = {
  bug: "bg-red-50 text-red-700 border-red-100",
  feature_request: "bg-blue-50 text-blue-700 border-blue-100",
  question: "bg-amber-50 text-amber-700 border-amber-100",
  churn_signal: "bg-orange-50 text-orange-700 border-orange-100",
};

const SCOPE_LABELS: Record<string, string> = { S: "Small", M: "Medium", L: "Large" };

/**
 * Ticket context for the Ask PM workspace. It renders inside TopNav rather than
 * as its own strip, so the chat does not carry two stacked bars.
 */
export function TicketBreadcrumb() {
  const activeSessionId = usePmChatStore((s) => s.activeSessionId);
  const ticketId = activeSessionId.startsWith("ticket_")
    ? activeSessionId.slice("ticket_".length)
    : undefined;
  const ticket = useTicketStore((s) => (ticketId ? s.getById(ticketId) : undefined));

  if (!ticket) return null;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link
        href="/pipeline"
        className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={12} />
        Pipeline
      </Link>
      <span className="h-3.5 w-px shrink-0 bg-border" />
      <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
        #{ticket.originalTicketId}
      </span>
      <span className="truncate text-[12px] font-medium">{ticket.customer.name}</span>
      <span
        className={cn(
          "hidden shrink-0 rounded border px-1.5 py-px text-[9px] font-medium sm:inline-flex",
          CLASS_COLORS[ticket.classification] ?? ""
        )}
      >
        {ticket.classification.replace("_", " ")}
      </span>
      <span className="hidden shrink-0 text-[10px] text-muted-foreground/60 md:inline">
        {SCOPE_LABELS[ticket.scope] ?? ticket.scope} scope
      </span>
    </div>
  );
}
