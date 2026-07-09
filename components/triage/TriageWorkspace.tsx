"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownUp,
  Focus,
  Keyboard,
  Layers,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { AskPmAgentButton } from "@/components/triage/AskPmAgentButton";
import { TicketDetailPane } from "@/components/triage/TicketDetailPane";
import { useAskPmAgent } from "@/components/triage/useAskPmAgent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTriageAlertsStore } from "@/lib/store/triage-alerts";
import { MOCK_CLUSTERS } from "@/lib/mock/clusters";
import { useTicketStore } from "@/lib/store/tickets";
import type { Ticket } from "@/lib/types";
import { buildTriageList, enrichTicket, type TriageListItem } from "@/lib/utils/workspace";
import { cn, formatRelativeTime } from "@/lib/utils";

type SortOption = "priority" | "newest" | "confidence_low" | "scope_large";

function confidenceRing(score: number, level: string) {
  const color =
    level === "low" ? "text-red-500" : level === "high" ? "text-emerald-500" : "text-amber-500";
  return (
    <div className="relative size-8 shrink-0">
      <svg className="size-8 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" className="stroke-muted/60" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          className={cn("stroke-current", color)}
          strokeWidth="3"
          strokeDasharray={`${score * 0.88} 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-[9px] font-bold", color)}>
        {score}
      </span>
    </div>
  );
}

export function TriageWorkspace() {
  const searchParams = useSearchParams();
  const askPmAgent = useAskPmAgent();
  const { tickets, accept, reject, undo, getPending } = useTicketStore();
  const markSeen = useTriageAlertsStore((s) => s.markSeen);
  const alertsReadyRef = useRef(false);
  const prevPendingRef = useRef<string[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("priority");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  const listItems = useMemo(() => {
    let items = buildTriageList(tickets, MOCK_CLUSTERS);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((item) => {
        if (item.kind === "cluster") {
          return (
            item.cluster!.title.toLowerCase().includes(q) ||
            item.cluster!.tickets.some((t) => t.title.toLowerCase().includes(q))
          );
        }
        return (
          item.ticket!.draftTitle.toLowerCase().includes(q) ||
          item.ticket!.customer.name.toLowerCase().includes(q)
        );
      });
    }
    if (sort === "priority") return items.sort((a, b) => b.priorityScore - a.priorityScore);
    if (sort === "newest") {
      return [...items].sort((a, b) => {
        const ta = a.kind === "ticket" ? a.ticket!.createdAt : a.cluster!.createdAt;
        const tb = b.kind === "ticket" ? b.ticket!.createdAt : b.cluster!.createdAt;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
    }
    return items;
  }, [search, sort, tickets]);

  const flatTickets = useMemo(() => {
    const out: Ticket[] = [];
    const pending = tickets.filter((t) => t.status === "pending");
    for (const item of listItems) {
      if (item.kind === "ticket" && item.ticket) out.push(item.ticket);
      if (item.kind === "cluster" && item.cluster) {
        for (const ref of item.cluster.tickets) {
          const t = pending.find((x) => x.id === ref.ticketId);
          if (t) out.push(enrichTicket(t));
        }
      }
    }
    return out;
  }, [listItems, tickets]);

  const stats = useMemo(() => {
    const pending = getPending();
    const enriched = pending.map(enrichTicket);
    return {
      pending: pending.length,
      clusters: listItems.filter((i) => i.kind === "cluster").length,
      lowConfidence: enriched.filter((t) => t.aiConfidenceLevel === "low").length,
    };
  }, [getPending, listItems]);

  const activeTicket = useMemo(() => {
    if (selectedTicketId) {
      return tickets.find((t) => t.id === selectedTicketId) ?? null;
    }
    if (selectedId) {
      const item = listItems.find((i) => i.id === selectedId);
      if (item?.kind === "ticket" && item.ticket) return item.ticket;
      if (item?.kind === "cluster" && item.cluster) {
        const first = item.cluster.tickets[0];
        return tickets.find((t) => t.id === first.ticketId) ?? null;
      }
    }
    return flatTickets[0] ?? null;
  }, [flatTickets, listItems, selectedId, selectedTicketId, tickets]);

  useEffect(() => {
    const ticketParam = searchParams.get("ticket");
    if (ticketParam) {
      setSelectedTicketId(ticketParam);
      setSelectedId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId && !selectedTicketId && flatTickets[0]) {
      setSelectedId(flatTickets[0].clusterId ?? flatTickets[0].id);
    }
  }, [flatTickets, selectedId, selectedTicketId]);

  const selectItem = (item: TriageListItem) => {
    setSelectedId(item.id);
    setSelectedTicketId(null);
    if (item.kind === "ticket" && item.ticket) {
      setSelectedTicketId(item.ticket.id);
      markSeen(item.ticket.id);
    }
    if (item.kind === "cluster" && item.cluster?.tickets[0]) {
      setSelectedTicketId(item.cluster.tickets[0].ticketId);
      markSeen(item.cluster.tickets[0].ticketId);
    }
  };

  useEffect(() => {
    const onCreated = (e: Event) => {
      const detail = (e as CustomEvent<{ ticketId: string }>).detail;
      if (!detail?.ticketId) return;
      setSelectedTicketId(detail.ticketId);
      setSelectedId(null);
    };
    window.addEventListener("pm-agent:ticket-created", onCreated);
    return () => window.removeEventListener("pm-agent:ticket-created", onCreated);
  }, []);

  // Toast when a new query lands in the queue
  useEffect(() => {
    const pending = getPending();
    const ids = pending.map((t) => t.id);

    if (!alertsReadyRef.current) {
      alertsReadyRef.current = true;
      prevPendingRef.current = ids;
      return;
    }

    const incoming = pending.filter((t) => !prevPendingRef.current.includes(t.id));
    for (const t of incoming) {
      toast("New query received", {
        description: `${t.customer.name}: ${t.draftTitle.slice(0, 64)}${t.draftTitle.length > 64 ? "…" : ""}`,
        duration: 6000,
        action: {
          label: "Ask PM Agent",
          onClick: () => askPmAgent(t, { silent: true }),
        },
      });
    }
    prevPendingRef.current = ids;
  }, [tickets, getPending, askPmAgent]);

  const handleAccept = useCallback(
    (ticket: Ticket) => {
      accept(ticket.id);
      toast.success("Accepted — added to Pipeline", { action: { label: "Undo", onClick: undo } });
    },
    [accept, undo]
  );

  const handleReject = useCallback(
    (ticket: Ticket) => {
      reject(ticket.id);
      toast.error("Rejected", { action: { label: "Undo", onClick: undo } });
    },
    [reject, undo]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      const ticket = focusMode ? flatTickets[focusIndex] : activeTicket;
      if (!ticket) return;
      if (e.key === "a" || e.key === "A") handleAccept(ticket);
      if (e.key === "r" || e.key === "R") handleReject(ticket);
      if (focusMode) {
        if (e.key === "ArrowRight") setFocusIndex((i) => Math.min(i + 1, flatTickets.length - 1));
        if (e.key === "ArrowLeft") setFocusIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTicket, flatTickets, focusIndex, focusMode, handleAccept, handleReject]);

  if (focusMode && flatTickets.length > 0) {
    const ticket = enrichTicket(flatTickets[focusIndex]);
    return (
      <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-violet-50/40 to-white">
        <div className="sticky top-0 z-10 shrink-0 border-b px-4 md:px-6 h-14 flex items-center justify-between bg-white/90 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <Focus className="size-4" />
              </span>
              <h1 className="text-base font-semibold">Focus Mode</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {focusIndex + 1} of {flatTickets.length} · <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">A</kbd> accept · <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">R</kbd> reject · ← → navigate
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setFocusMode(false)}>
            <X className="size-4" /> Exit
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <TicketDetailPane ticket={ticket} onAccept={handleAccept} onReject={handleReject} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b bg-card/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center">
        <h1 className="text-sm font-medium tracking-tight">Triage</h1>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Ticket list */}
        <div className="flex w-full min-h-0 shrink-0 flex-col bg-muted/10 lg:w-[min(380px,32vw)] xl:w-[400px]">
          <div className="shrink-0 space-y-3 p-3">
            <div className="grid grid-cols-3 gap-2">
              <MiniPill icon={Zap} label="Pending" value={stats.pending} accent="text-primary" />
              <MiniPill icon={Layers} label="Clusters" value={stats.clusters} accent="text-violet-600" />
              <MiniPill icon={Sparkles} label="Low AI" value={stats.lowConfidence} accent="text-red-600" />
            </div>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search queue…"
                  className="h-9 border-0 bg-background/80 pl-9 shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={sort} onValueChange={(v) => v && setSort(v as SortOption)}>
                <SelectTrigger className="h-9 w-[110px] shrink-0 border-0 bg-background/80 text-xs shadow-sm">
                  <ArrowDownUp className="size-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="confidence_low">Low AI</SelectItem>
                  <SelectItem value="scope_large">Large scope</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2 space-y-2">
            {listItems.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-sm font-medium text-muted-foreground">Queue is clear</p>
                <p className="text-xs text-muted-foreground mt-1">No pending tickets match your filters</p>
              </div>
            ) : (
              listItems.map((item) => {
                const isSelected = selectedId === item.id;
                if (item.kind === "cluster" && item.cluster) {
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border border-l-4 border-l-violet-500 p-3 cursor-pointer transition-all hover:shadow-md",
                        isSelected
                          ? "border-violet-300 bg-violet-50/50 ring-2 ring-violet-200/60 shadow-sm"
                          : "border-border bg-white hover:border-violet-200"
                      )}
                      onClick={() => selectItem(item)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                          <Layers className="size-4" />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="line-clamp-2 min-h-[2.625rem] text-sm font-semibold leading-snug">
                            {item.cluster.title}
                          </p>
                          <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs leading-snug text-muted-foreground">
                            {item.ticketCount} tickets · {item.cluster.affectedCodeArea}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <ScopeBadge scope={item.cluster.combinedScope} className="size-5 text-[10px]" />
                            <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                              P{item.priorityScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                const t = enrichTicket(item.ticket!);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative rounded-xl bg-card p-3 cursor-pointer transition-all shadow-sm hover:shadow-md",
                      isSelected
                        ? "ring-2 ring-primary/25 shadow-md"
                        : "hover:ring-1 hover:ring-primary/10"
                    )}
                    onClick={() => selectItem(item)}
                  >
                    <div className="flex gap-3">
                      {confidenceRing(t.aiConfidence ?? 70, t.aiConfidenceLevel ?? "medium")}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-mono text-muted-foreground mb-1">#{t.originalTicketId}</p>
                        <p className="text-sm font-semibold leading-snug line-clamp-2">{t.draftTitle}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground gap-2">
                          <span className="truncate">{t.customer.name}</span>
                          <span className="shrink-0">{formatRelativeTime(t.createdAt)}</span>
                        </div>
                        <div
                          className={cn(
                            "mt-2 overflow-hidden transition-all duration-150",
                            "max-h-0 opacity-0 group-hover:max-h-8 group-hover:opacity-100",
                            isSelected && "max-h-8 opacity-100"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AskPmAgentButton ticket={t} variant="row" silent />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="shrink-0 px-3 py-2 hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
            <Keyboard className="size-3.5 shrink-0" />
            <span><kbd className="rounded border bg-muted px-1 font-mono">A</kbd> accept</span>
            <span><kbd className="rounded border bg-muted px-1 font-mono">R</kbd> reject</span>
          </div>
        </div>

        {/* Detail — fills remaining width */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <TicketDetailPane ticket={activeTicket} onAccept={handleAccept} onReject={handleReject} />
        </div>
      </div>
    </div>
  );
}

function MiniPill({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex h-[52px] items-center gap-2 rounded-lg bg-background/80 px-2.5 shadow-sm">
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/50", accent)}>
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex flex-col justify-center gap-0.5">
        <p className={cn("text-sm font-bold leading-none tabular-nums", accent)}>{value}</p>
        <p className="text-[9px] leading-none text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}
