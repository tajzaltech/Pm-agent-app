"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTicketStore } from "@/lib/store/tickets";
import type { Ticket } from "@/lib/types";
import {
  generateAiImprovements,
  improvementsToUpdates,
  type AiImprovement,
} from "@/lib/utils/ai-improve";
import { cn } from "@/lib/utils";

interface AiImprovePanelProps {
  ticket: Ticket;
  onApplied?: () => void;
}

type Phase = "idle" | "thinking" | "preview";

export function AiImprovePanel({ ticket, onApplied }: AiImprovePanelProps) {
  const { editDraft } = useTicketStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [improvements, setImprovements] = useState<AiImprovement[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fieldKey = (field: AiImprovement["field"]) => field;

  useEffect(() => {
    setPhase("idle");
    setImprovements([]);
    setSelected(new Set());
  }, [ticket.id]);

  const runImprove = useCallback(() => {
    setPhase("thinking");
    setImprovements([]);
    setSelected(new Set());

    window.setTimeout(() => {
      const next = generateAiImprovements(ticket);
      setImprovements(next);
      setSelected(new Set(next.map((i) => fieldKey(i.field))));
      setPhase(next.length > 0 ? "preview" : "idle");
      if (next.length === 0) {
        toast.info("Draft already looks strong — no changes suggested");
      }
    }, 1400);
  }, [ticket]);

  const selectedItems = useMemo(
    () => improvements.filter((i) => selected.has(fieldKey(i.field))),
    [improvements, selected]
  );

  const applySelected = useCallback(() => {
    if (selectedItems.length === 0) return;
    const updates = improvementsToUpdates(selectedItems);
    editDraft(ticket.id, updates);
    toast.success(`Applied ${selectedItems.length} AI improvement${selectedItems.length > 1 ? "s" : ""}`);
    setPhase("idle");
    setImprovements([]);
    setSelected(new Set());
    onApplied?.();
  }, [editDraft, onApplied, selectedItems, ticket.id]);

  const toggleField = (field: AiImprovement["field"]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = fieldKey(field);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (ticket.status !== "pending") return null;

  return (
    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/50 overflow-hidden shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 py-3.5 border-b border-violet-100/80 bg-white/60">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">Improve with AI</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sharpen title, add context, structure approach & criteria — one click
            </p>
          </div>
        </div>
        {phase === "preview" ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => {
              setPhase("idle");
              setImprovements([]);
            }}
          >
            <X className="size-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 gap-1.5 shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm"
            onClick={runImprove}
            disabled={phase === "thinking"}
          >
            {phase === "thinking" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Wand2 className="size-3.5" /> Improve draft
              </>
            )}
          </Button>
        )}
      </div>

      {phase === "thinking" && (
        <div className="px-4 py-5 space-y-3">
          {["Reading customer context", "Mapping code references", "Structuring dev-ready draft"].map(
            (step, i) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <Loader2
                  className={cn(
                    "size-4 text-violet-600 animate-spin",
                    i > 0 && "opacity-40 animation-delay-150"
                  )}
                  style={{ animationDelay: `${i * 200}ms` }}
                />
                <span className={cn("text-muted-foreground", i === 0 && "text-foreground font-medium")}>
                  {step}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {phase === "preview" && improvements.length > 0 && (
        <div className="p-4 space-y-3">
          {improvements.map((item) => {
            const key = fieldKey(item.field);
            const isOn = selected.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleField(item.field)}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition-all",
                  isOn
                    ? "border-violet-300 bg-white shadow-sm ring-1 ring-violet-100"
                    : "border-transparent bg-white/50 opacity-60 hover:opacity-100"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      isOn ? "bg-violet-600 border-violet-600 text-white" : "border-muted-foreground/30"
                    )}
                  >
                    {isOn && <Check className="size-3" />}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{item.reason}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">Before</p>
                    <ImprovementPreview value={item.before} muted />
                  </div>
                  <div className="rounded-lg bg-violet-50/80 border border-violet-100 p-2.5">
                    <p className="text-[10px] font-medium text-violet-700 mb-1 flex items-center gap-1">
                      After <ArrowRight className="size-3" />
                    </p>
                    <ImprovementPreview value={item.after} />
                  </div>
                </div>
              </button>
            );
          })}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
              onClick={applySelected}
              disabled={selectedItems.length === 0}
            >
              <Check className="size-3.5" />
              Apply {selectedItems.length} selected
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set(improvements.map((i) => fieldKey(i.field))))}>
              Select all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImprovementPreview({ value, muted }: { value: string | string[]; muted?: boolean }) {
  if (Array.isArray(value)) {
    return (
      <ul className={cn("space-y-1 text-xs leading-relaxed", muted && "text-muted-foreground")}>
        {value.map((line, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-violet-400 shrink-0">•</span>
            <span className="line-clamp-3">{line}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className={cn("text-xs leading-relaxed line-clamp-4 whitespace-pre-line", muted && "text-muted-foreground")}>
      {value}
    </p>
  );
}
