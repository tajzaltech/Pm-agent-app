"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownUp,
  CheckCheck,
  Focus,
  Layers,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { TicketDetailPane } from "@/components/triage/TicketDetailPane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_CLUSTERS } from "@/lib/mock/clusters";
import { useTicketStore } from "@/lib/store/tickets";
import type { Ticket } from "@/lib/types";
import { buildTriageList, enrichTicket, type TriageListItem } from "@/lib/utils/workspace";
import { cn, formatRelativeTime } from "@/lib/utils";

type SortOption = "priority" | "newest" | "confidence_low" | "scope_large";

export function TriageWorkspace() {
  const searchParams = useSearchParams();
  const { tickets, accept, reject, undo, getPending } = useTicketStore();
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
    if (item.kind === "ticket" && item.ticket) setSelectedTicketId(item.ticket.id);
    if (item.kind === "cluster" && item.cluster?.tickets[0]) {
      setSelectedTicketId(item.cluster.tickets[0].ticketId);
    }
  };

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

  const handleBulkCluster = (item: TriageListItem, action: "accept" | "reject") => {
    if (item.kind !== "cluster" || !item.cluster) return;
    const ids = item.cluster.tickets.map((t) => t.ticketId);
    ids.forEach((id) => (action === "accept" ? accept(id) : reject(id)));
    toast.success(`${ids.length} tickets ${action === "accept" ? "accepted" : "rejected"}`);
  };

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
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="sticky top-0 z-10 shrink-0 border-b px-4 h-14 flex items-center justify-between bg-white/90 backdrop-blur-sm">
          <div>
            <h1 className="text-base font-semibold">Focus Mode</h1>
            <p className="text-xs text-muted-foreground">{focusIndex + 1} of {flatTickets.length} · A accept · R reject · ← → navigate</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setFocusMode(false)}><X className="size-4" /> Exit</Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <TicketDetailPane ticket={ticket} onAccept={handleAccept} onReject={handleReject} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b bg-white/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Triage Workspace</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{getPending().length} pending · clusters merged</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFocusMode(true)}>
          <Focus className="size-4" /> Focus Mode
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden divide-x">
        {/* Smart list */}
        <div className="flex w-full shrink-0 flex-col bg-white/60 lg:w-[380px] xl:w-[420px] min-h-0">
          <div className="shrink-0 border-b p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={sort} onValueChange={(v) => v && setSort(v as SortOption)}>
              <SelectTrigger className="h-8 text-xs"><ArrowDownUp className="size-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority (risk-ranked)</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="confidence_low">Low confidence first</SelectItem>
                <SelectItem value="scope_large">Largest scope first</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 space-y-2">
            {listItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending items</p>
            ) : (
              listItems.map((item) => {
                const isSelected = selectedId === item.id;
                if (item.kind === "cluster" && item.cluster) {
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border bg-white p-3 cursor-pointer transition-all hover:border-primary/30",
                        isSelected && "border-primary ring-2 ring-primary/10"
                      )}
                      onClick={() => selectItem(item)}
                    >
                      <div className="flex items-start gap-2">
                        <Layers className="size-4 text-violet-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.cluster.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.ticketCount} tickets · {item.cluster.affectedCodeArea}</p>
                          <div className="flex gap-1 mt-2">
                            <ScopeBadge scope={item.cluster.combinedScope} className="size-5 text-[10px]" />
                            <span className="text-[10px] rounded-full bg-red-50 text-red-700 px-2 py-0.5 font-medium">Priority {item.priorityScore}</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex gap-1 mt-3 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" className="h-7 text-xs bg-emerald-600" onClick={() => handleBulkCluster(item, "accept")}>
                            <CheckCheck className="size-3" /> Accept all
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => handleBulkCluster(item, "reject")}>
                            Reject all
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                }
                const t = enrichTicket(item.ticket!);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border bg-white p-3 cursor-pointer transition-all hover:border-primary/30",
                      isSelected && "border-primary ring-2 ring-primary/10"
                    )}
                    onClick={() => selectItem(item)}
                  >
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      <ClassificationBadge classification={t.classification} size="sm" />
                      <ScopeBadge scope={t.scope} className="size-5 text-[10px]" />
                    </div>
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{t.draftTitle}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{t.customer.name}</span>
                      <span>{formatRelativeTime(t.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                      <Sparkles className={cn("size-3", t.aiConfidenceLevel === "low" ? "text-red-500" : "text-emerald-500")} />
                      <span className={t.aiConfidenceLevel === "low" ? "text-red-600 font-medium" : "text-muted-foreground"}>
                        {t.aiConfidence}% confidence
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail pane */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <TicketDetailPane ticket={activeTicket} onAccept={handleAccept} onReject={handleReject} />
        </div>
      </div>
    </div>
  );
}
