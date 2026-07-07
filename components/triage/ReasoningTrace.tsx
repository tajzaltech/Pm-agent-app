"use client";

import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Brain, ChevronRight } from "lucide-react";

export function ReasoningTrace({ ticket }: { ticket: Ticket }) {
  const score = ticket.aiConfidence ?? 70;
  const level = ticket.aiConfidenceLevel ?? "medium";
  const signals = ticket.aiReasoning ?? [];

  const levelStyles = {
    high: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Brain className="size-3.5" />
          Why the AI thinks this
        </p>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", levelStyles[level])}>
          {score}% · {level} confidence
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            level === "high" ? "bg-emerald-500" : level === "medium" ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <ul className="space-y-2">
        {signals.map((signal) => (
          <li key={signal.label} className="flex gap-2 text-sm">
            <ChevronRight className="size-3.5 mt-0.5 shrink-0 text-primary/60" />
            <div>
              <span className="font-medium text-foreground">{signal.label}: </span>
              <span className="text-muted-foreground">{signal.detail}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
