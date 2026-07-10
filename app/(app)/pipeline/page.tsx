"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, Tray, Clock, CheckCircle, XCircle, ArrowRight } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { useTicketStore } from "@/lib/store/tickets";
import type { Ticket, TicketStatus } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

type Tab = "pending" | "accepted" | "rejected" | "all";
const TABS: { value: Tab; label: string; icon: typeof Tray }[] = [
  { value: "pending", label: "Pending", icon: Tray },
  { value: "accepted", label: "Done", icon: CheckCircle },
  { value: "rejected", label: "Rejected", icon: XCircle },
  { value: "all", label: "All", icon: Clock },
];

const CLASS_COLORS: Record<string, string> = {
  bug: "bg-red-50 text-red-700 border-red-100",
  feature_request: "bg-blue-50 text-blue-700 border-blue-100",
  question: "bg-amber-50 text-amber-700 border-amber-100",
  churn_signal: "bg-orange-50 text-orange-700 border-orange-100",
};

export default function PipelinePage() {
  const tickets = useTicketStore((s) => s.tickets);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("pending");

  const filtered = useMemo(() => {
    let list = tab === "all" ? tickets : tickets.filter((t) => t.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.draftTitle.toLowerCase().includes(q) ||
          t.originalSubject.toLowerCase().includes(q) ||
          t.customer.name.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, search, tab]);

  const counts = useMemo(() => {
    const c = { pending: 0, accepted: 0, rejected: 0, all: tickets.length };
    for (const t of tickets) {
      if (t.status === "pending") c.pending++;
      else if (t.status === "accepted") c.accepted++;
      else if (t.status === "rejected") c.rejected++;
    }
    return c;
  }, [tickets]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-card/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center h-10 gap-4">
          <div className="relative w-56">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Filter tickets…"
              className="h-8 pl-8 text-[13px] border-0 bg-muted/40 shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-0.5 -mb-px">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 transition-colors",
                tab === value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={12} />
              {label}
              <span className={cn(
                "text-[10px] tabular-nums px-1.5 rounded-full",
                tab === value ? "bg-primary/8 text-primary" : "bg-transparent"
              )}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tray size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No matches" : "No tickets"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((t) => (
              <Row key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ ticket }: { ticket: Ticket }) {
  const classColor = CLASS_COLORS[ticket.classification] ?? "bg-muted text-muted-foreground";

  return (
    <Link
      href={`/chat/ticket/${ticket.id}`}
      className="group flex items-center gap-4 px-4 md:px-6 py-3.5 hover:bg-primary/[0.03] transition-all border-l-2 border-l-transparent hover:border-l-primary/40"
    >
      <StatusDot status={ticket.status} />

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[13px] font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {ticket.draftTitle}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono">#{ticket.originalTicketId}</span>
          <span>·</span>
          <span className="truncate">{ticket.customer.name}</span>
        </div>
      </div>

      <span className={cn("hidden sm:inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium", classColor)}>
        {ticket.classification.replace("_", " ")}
      </span>

      <span className="hidden md:block text-[11px] text-muted-foreground/70 shrink-0 w-16 text-right">
        {formatRelativeTime(ticket.createdAt)}
      </span>

      <span className="hidden sm:flex items-center gap-1 shrink-0 text-[11px] text-muted-foreground/0 group-hover:text-primary transition-colors">
        Ask PM
        <ArrowRight size={12} />
      </span>
      <ArrowRight size={14} className="sm:hidden text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
    </Link>
  );
}

function StatusDot({ status }: { status: TicketStatus }) {
  return (
    <span className={cn(
      "size-2 rounded-full shrink-0",
      status === "pending" && "bg-amber-400",
      status === "accepted" && "bg-emerald-500",
      status === "rejected" && "bg-red-400",
      status === "ignored" && "bg-muted-foreground/30"
    )} />
  );
}
