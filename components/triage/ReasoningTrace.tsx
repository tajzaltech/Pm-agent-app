"use client";

import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Brain, ChevronRight, Sparkles } from "lucide-react";

export function ReasoningTrace({ ticket }: { ticket: Ticket }) {
  const score = ticket.aiConfidence ?? 70;
  const level = ticket.aiConfidenceLevel ?? "medium";
  const signals = ticket.aiReasoning ?? [];

  const levelConfig = {
    high: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      bar: "bg-gradient-to-r from-emerald-400 to-emerald-600",
      glow: "shadow-emerald-100",
    },
    medium: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      bar: "bg-gradient-to-r from-amber-400 to-orange-500",
      glow: "shadow-amber-100",
    },
    low: {
      badge: "bg-red-50 text-red-700 border-red-200",
      bar: "bg-gradient-to-r from-red-400 to-rose-600",
      glow: "shadow-red-100",
    },
  };

  const cfg = levelConfig[level];

  return (
    <div className={cn("rounded-2xl border bg-white overflow-hidden shadow-sm", cfg.glow)}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-gradient-to-r from-slate-50/80 to-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Brain className="size-3.5" />
          </span>
          AI reasoning trace
        </p>
        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", cfg.badge)}>
          {score}% · {level}
        </span>
      </div>

      <div className="px-4 pt-3 pb-4 space-y-3">
        <div className="relative h-2 rounded-full bg-muted/80 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
            style={{ width: `${score}%` }}
          />
          <Sparkles className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-white/80" style={{ left: `calc(${Math.min(score, 92)}% - 8px)` }} />
        </div>

        <ul className="space-y-2.5">
          {signals.map((signal, i) => (
            <li
              key={signal.label}
              className="flex gap-2.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">{signal.label}</span>
                  <ChevronRight className="size-3 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{signal.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
