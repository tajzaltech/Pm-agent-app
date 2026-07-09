"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { ProcessingCategory, ProcessingTicketItem } from "@/lib/utils/insights-stats";
import { cn } from "@/lib/utils";

interface ProcessingTicketListProps {
  category: ProcessingCategory;
  label: string;
  items: ProcessingTicketItem[];
  onClose: () => void;
}

const BADGE_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  ignored: "bg-muted text-muted-foreground border-border",
  dev: "bg-violet-50 text-violet-700 border-violet-200",
  responded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  dev_working: "bg-violet-50 text-violet-700 border-violet-200",
  pr_open: "bg-indigo-50 text-indigo-700 border-indigo-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  accepted_pipeline: "bg-slate-50 text-slate-700 border-slate-200",
};

export function ProcessingTicketList({ category, label, items, onClose }: ProcessingTicketListProps) {
  return (
    <div className="border-t bg-muted/10 animate-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b bg-card/80">
        <p className="text-xs font-semibold">
          {label} <span className="text-muted-foreground font-normal">({items.length})</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          No tickets in this category yet — triage or accept tickets to populate this list.
        </p>
      ) : (
        <ul className="max-h-64 overflow-y-auto divide-y divide-border/60">
          {items.map((item) => (
            <li key={`${category}-${item.id}`}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.meta}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                    BADGE_STYLES[item.badge] ?? "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {item.badge.replace(/_/g, " ")}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
