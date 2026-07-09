"use client";

import { Bot, MessageSquare } from "lucide-react";

import { useAskPmAgent } from "@/components/triage/useAskPmAgent";
import { useTriageAlertsStore } from "@/lib/store/triage-alerts";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

type Variant = "row" | "compact" | "fab";

interface AskPmAgentButtonProps {
  ticket: Ticket;
  variant?: Variant;
  className?: string;
  silent?: boolean;
}

export function AskPmAgentButton({
  ticket,
  variant = "compact",
  className,
  silent,
}: AskPmAgentButtonProps) {
  const askPmAgent = useAskPmAgent();
  const markSeen = useTriageAlertsStore((s) => s.markSeen);
  const markPmConsulted = useTriageAlertsStore((s) => s.markPmConsulted);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    markSeen(ticket.id);
    markPmConsulted(ticket.id);
    askPmAgent(ticket, { silent });
  };

  if (variant === "fab") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] hover:opacity-95",
          className
        )}
      >
        <Bot className="size-4" />
        Ask PM Agent
      </button>
    );
  }

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary transition-all hover:bg-primary/15",
          className
        )}
      >
        <MessageSquare className="size-3" />
        Ask PM Agent
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5",
        className
      )}
      onClick={handleClick}
    >
      <MessageSquare className="size-3.5" />
      Ask PM Agent
    </Button>
  );
}
