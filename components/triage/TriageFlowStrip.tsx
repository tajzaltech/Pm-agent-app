"use client";

import { Bot, CheckCircle, Inbox, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = [
  { step: 1, label: "Query in", Icon: Inbox },
  { step: 2, label: "Ask PM Agent", Icon: Bot },
  { step: 3, label: "Review draft", Icon: Sparkles },
  { step: 4, label: "Decide", Icon: CheckCircle },
] as const;

export type TriageFlowStep = 1 | 2 | 3 | 4;

export function TriageFlowStrip({
  activeStep,
  compact = false,
  className,
}: {
  activeStep: TriageFlowStep;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex items-center gap-1", compact ? "gap-0.5" : "gap-1 sm:gap-2")}>
        {STEPS.map(({ step, label, Icon }, i) => {
          const done = step < activeStep;
          const active = step === activeStep;
          return (
            <div key={step} className="flex min-w-0 flex-1 items-center gap-1">
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors",
                  active && "bg-primary/10 text-primary",
                  done && "text-emerald-600",
                  !active && !done && "text-muted-foreground/60"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-emerald-500/15",
                    !active && !done && "bg-muted"
                  )}
                >
                  {done ? "✓" : <Icon className="size-3" />}
                </span>
                {!compact && (
                  <span className="truncate text-[10px] font-medium sm:text-[11px]">{label}</span>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-2 shrink-0 sm:w-4",
                    done ? "bg-emerald-400/60" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
