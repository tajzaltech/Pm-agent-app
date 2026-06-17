"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownUp,
  BotMessageSquare,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Code2,
  ExternalLink,
  Eye,
  GitFork,
  Inbox,
  Loader2,
  Search,
  SendHorizonal,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";

import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTicketStore } from "@/lib/store/tickets";
import { useDispatchStore, AGENT_LABELS } from "@/lib/store/dispatch";
import { useDeliveryStore, TOOL_LABELS } from "@/lib/store/delivery";
import type { DeliveryTool, Ticket, TicketStatus } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

const MOCK_TEAM = [
  { id: "1", name: "Ali Khan",    initials: "AK", role: "Backend",    color: "bg-violet-100 text-violet-700" },
  { id: "2", name: "Sara Ahmed",  initials: "SA", role: "Frontend",   color: "bg-blue-100 text-blue-700" },
  { id: "3", name: "Umar Dev",    initials: "UD", role: "Full Stack", color: "bg-emerald-100 text-emerald-700" },
  { id: "4", name: "Rabia M",     initials: "RM", role: "Mobile",     color: "bg-amber-100 text-amber-700" },
];

const DELIVERY_TOOLS: { value: DeliveryTool; label: string; color: string }[] = [
  { value: "jira",    label: "Jira",         color: "text-blue-600" },
  { value: "linear",  label: "Linear",       color: "text-indigo-600" },
  { value: "github",  label: "GitHub Issues",color: "text-gray-700" },
  { value: "clickup", label: "ClickUp",      color: "text-violet-600" },
  { value: "asana",   label: "Asana",        color: "text-rose-600" },
];

type TabFilter = "pending" | "accepted" | "rejected" | "all";
type SortOption = "newest" | "oldest" | "scope_large" | "scope_small";

const SCOPE_ORDER: Record<string, number> = { L: 0, M: 1, S: 2 };

function sortTickets(tickets: Ticket[], sort: SortOption): Ticket[] {
  return [...tickets].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "scope_large") return SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope];
    if (sort === "scope_small") return SCOPE_ORDER[b.scope] - SCOPE_ORDER[a.scope];
    return 0;
  });
}

function filterByStatus(tickets: Ticket[], tab: TabFilter): Ticket[] {
  if (tab === "all") return tickets;
  return tickets.filter((ticket) => ticket.status === tab);
}

function filterBySearch(tickets: Ticket[], query: string): Ticket[] {
  if (!query.trim()) return tickets;
  const q = query.toLowerCase();

  return tickets.filter(
    (ticket) =>
      ticket.draftTitle.toLowerCase().includes(q) ||
      ticket.draftDescription.toLowerCase().includes(q) ||
      ticket.customer.name.toLowerCase().includes(q) ||
      ticket.customer.email.toLowerCase().includes(q) ||
      ticket.originalTicketId.toLowerCase().includes(q) ||
      ticket.codeRefs.some((ref) => ref.filePath.toLowerCase().includes(q))
  );
}

export default function QueuePage() {
  const router = useRouter();
  const { tickets, accept, reject, undo, undoRecord } = useTicketStore();
  const deliver = useDeliveryStore((s) => s.deliver);
  const deliveryConfig = useDeliveryStore((s) => s.config);
  const [activeTab, setActiveTab] = useState<TabFilter>("pending");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [loading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [assignModal, setAssignModal] = useState<Ticket | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState(MOCK_TEAM[0].id);
  const [selectedTool, setSelectedTool] = useState<DeliveryTool>(deliveryConfig.defaultTool);

  const counts = useMemo(
    () => ({
      pending: tickets.filter((ticket) => ticket.status === "pending").length,
      accepted: tickets.filter((ticket) => ticket.status === "accepted").length,
      rejected: tickets.filter((ticket) => ticket.status === "rejected").length,
      all: tickets.length,
      large: tickets.filter((ticket) => ticket.status === "pending" && ticket.scope === "L").length,
      churn: tickets.filter((ticket) => ticket.status === "pending" && ticket.classification === "churn_signal").length,
    }),
    [tickets]
  );

  const filtered = useMemo(
    () => sortTickets(filterBySearch(filterByStatus(tickets, activeTab), search), sort),
    [activeTab, search, sort, tickets]
  );
  const safeFocusedIdx = Math.min(focusedIdx, Math.max(filtered.length - 1, 0));

  const openAssignModal = useCallback(
    (ticket: Ticket, event?: React.MouseEvent) => {
      event?.stopPropagation();
      setAssignModal(ticket);
      setSelectedAssignee(deliveryConfig.defaultAssigneeId || MOCK_TEAM[0].id);
      setSelectedTool(deliveryConfig.defaultTool);
    },
    [deliveryConfig]
  );

  const confirmAccept = useCallback(
    async (withDelivery: boolean) => {
      const ticket = assignModal;
      if (!ticket) return;
      setAssignModal(null);
      accept(ticket.id);
      if (withDelivery) {
        const member = MOCK_TEAM.find((m) => m.id === selectedAssignee) ?? MOCK_TEAM[0];
        void deliver(ticket.id, ticket.draftTitle, member.id, member.name, member.initials, selectedTool);
        toast.success(`Accepted · Assigned to ${member.name} · Pushing to ${TOOL_LABELS[selectedTool]}`, {
          description: ticket.draftTitle.slice(0, 72),
          action: { label: "Undo", onClick: undo },
          duration: 5000,
        });
      } else {
        toast.success("Ticket accepted", {
          description: ticket.draftTitle.slice(0, 72),
          action: { label: "Undo", onClick: undo },
          duration: 5000,
        });
      }
      setSelected((prev) => { const n = new Set(prev); n.delete(ticket.id); return n; });
      setFocusedIdx((prev) => Math.min(prev, Math.max(filtered.length - 2, 0)));
    },
    [accept, assignModal, deliver, filtered.length, selectedAssignee, selectedTool, undo]
  );

  const handleAccept = useCallback(
    (ticket: Ticket, event?: React.MouseEvent) => {
      openAssignModal(ticket, event);
    },
    [openAssignModal]
  );

  const handleReject = useCallback(
    (ticket: Ticket, event?: React.MouseEvent) => {
      event?.stopPropagation();
      reject(ticket.id);
      toast.error("Ticket rejected", {
        description: ticket.draftTitle.slice(0, 72),
        action: { label: "Undo", onClick: undo },
        duration: 5000,
      });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(ticket.id);
        return next;
      });
      setFocusedIdx((prev) => Math.min(prev, Math.max(filtered.length - 2, 0)));
    },
    [filtered.length, reject, undo]
  );

  const handleBatchAccept = () => {
    const selectedTickets = tickets.filter((ticket) => selected.has(ticket.id));
    selectedTickets.forEach((ticket) => accept(ticket.id));
    toast.success(`${selectedTickets.length} tickets accepted and pushed to Linear`, {
      action: { label: "Undo", onClick: undo },
    });
    setSelected(new Set());
  };

  const handleBatchReject = () => {
    const selectedTickets = tickets.filter((ticket) => selected.has(ticket.id));
    selectedTickets.forEach((ticket) => reject(ticket.id));
    toast.error(`${selectedTickets.length} tickets rejected`, {
      action: { label: "Undo", onClick: undo },
    });
    setSelected(new Set());
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const tag = target.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIdx((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        const ticket = filtered[safeFocusedIdx];
        if (ticket) router.push(`/queue/${ticket.id}`);
      } else if (event.key === "a" || event.key === "A") {
        const ticket = filtered[safeFocusedIdx];
        if (ticket?.status === "pending") handleAccept(ticket);
      } else if (event.key === "r" || event.key === "R") {
        const ticket = filtered[safeFocusedIdx];
        if (ticket?.status === "pending") handleReject(ticket);
      } else if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "Escape") {
        setSelected(new Set());
        searchRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, handleAccept, handleReject, router, safeFocusedIdx]);

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "accepted", label: "Accepted", count: counts.accepted },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "all", label: "All", count: counts.all },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b bg-white/80 backdrop-blur-sm">
        <div className="px-6 h-14 flex items-center gap-2.5">
          <h1 className="text-base font-semibold tracking-tight">Queue</h1>
          <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
            {filtered.length} visible
          </span>
          {undoRecord && (
            <Button variant="outline" size="sm" className="gap-2 rounded-xl animate-in slide-in-from-top-1 ml-auto" onClick={undo}>
              Undo last action
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3">
          <div className="flex rounded-xl border bg-muted/40 p-1 gap-0.5">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setFocusedIdx(0);
                  setSelected(new Set());
                }}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-all",
                  activeTab === key
                    ? "bg-white text-foreground shadow-sm border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold",
                    activeTab === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 min-w-[320px]">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search ticket, customer, file... (/)"
                className="h-9 pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (value) setSort(value as SortOption);
              }}
            >
              <SelectTrigger className="h-9 w-48 bg-white">
                <ArrowDownUp className="mr-2 size-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="scope_large">Scope: largest first</SelectItem>
                <SelectItem value="scope_small">Scope: smallest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {selected.size > 0 && (
        <div className="shrink-0 border-b bg-white/60 backdrop-blur-sm px-6 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {selected.size} ticket{selected.size > 1 ? "s" : ""} selected
            </span>
            <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handleBatchAccept}>
              <CheckCheck className="size-3.5" />
              Accept all
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 border-red-200 text-red-600 hover:bg-red-50" onClick={handleBatchReject}>
              <X className="size-3.5" />
              Reject all
            </Button>
            <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelected(new Set())}>
              Clear selection
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-xl border bg-white p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          activeTab === "pending" && !search ? (
            <EmptyState
              icon={Inbox}
              heading="No tickets waiting for review"
              description="New drafts will appear here as customer tickets come in. Last ticket analyzed 3 minutes ago."
            />
          ) : (
            <EmptyState
              icon={Search}
              heading="No tickets found"
              description={search ? `No results for "${search}"` : "Nothing in this category yet."}
              ctaLabel={search ? "Clear search" : undefined}
              onCta={() => setSearch("")}
            />
          )
        ) : (
          <div className="p-6">
            <div className="space-y-3">
              {filtered.map((ticket, index) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  isFocused={index === safeFocusedIdx}
                  isSelected={selected.has(ticket.id)}
                  onFocus={() => setFocusedIdx(index)}
                  onSelect={(checked) => {
                    const next = new Set(selected);
                    if (checked) next.add(ticket.id);
                    else next.delete(ticket.id);
                    setSelected(next);
                  }}
                  onAccept={(event) => handleAccept(ticket, event)}
                  onReject={(event) => handleReject(ticket, event)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t bg-white px-6 py-2">
        <div className="flex flex-wrap items-center gap-4">
          <KbdHint keys={["Up", "Down"]} label="Navigate" />
          <KbdHint keys={["Enter"]} label="Open" />
          <KbdHint keys={["A"]} label="Accept" />
          <KbdHint keys={["R"]} label="Reject" />
          <KbdHint keys={["/"]} label="Search" />
          <KbdHint keys={["Esc"]} label="Clear" />
        </div>
      </footer>

      {/* Assign & Deliver Modal */}
      <Dialog open={!!assignModal} onOpenChange={(open) => { if (!open) setAssignModal(null); }}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-base font-semibold">Accept & Assign Ticket</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {assignModal?.draftTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-5">
            {/* Assign to developer */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <User className="size-3.5" /> Assign to Developer
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_TEAM.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedAssignee(member.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                      selectedAssignee === member.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <span className={cn("size-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", member.color)}>
                      {member.initials}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-none">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{member.role}</p>
                    </div>
                    {selectedAssignee === member.id && (
                      <CheckCircle2 className="size-4 text-primary ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination tool */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <SendHorizonal className="size-3.5" /> Push to Tool
              </p>
              <div className="flex flex-wrap gap-2">
                {DELIVERY_TOOLS.map((tool) => (
                  <button
                    key={tool.value}
                    onClick={() => setSelectedTool(tool.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                      selectedTool === tool.value
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch info */}
            {assignModal && (
              <div className="rounded-xl bg-muted/40 border px-3 py-2 flex items-center gap-2">
                <GitFork className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-muted-foreground">
                  fix/{assignModal.id.replace("ticket-", "")}
                </span>
              </div>
            )}
          </div>

          <div className="px-6 pb-5 flex items-center gap-2">
            <Button
              className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              onClick={() => confirmAccept(true)}
            >
              <SendHorizonal className="size-3.5" />
              Accept &amp; Push to {TOOL_LABELS[selectedTool]}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => confirmAccept(false)}>
              Accept only
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => setAssignModal(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TicketRow({
  ticket,
  isFocused,
  isSelected,
  onFocus,
  onSelect,
  onAccept,
  onReject,
}: {
  ticket: Ticket;
  isFocused: boolean;
  isSelected: boolean;
  onFocus: () => void;
  onSelect: (checked: boolean) => void;
  onAccept: (event: React.MouseEvent) => void;
  onReject: (event: React.MouseEvent) => void;
}) {
  const router = useRouter();
  const isUrgent = ticket.classification === "churn_signal" || ticket.scope === "L";
  const dispatchRecord = useDispatchStore((s) => s.getRecord(ticket.id));
  const deliveryRecord = useDeliveryStore((s) => s.getRecord(ticket.id));

  const priorityColor = ticket.status === "accepted"
    ? "bg-emerald-400"
    : ticket.status === "rejected"
    ? "bg-red-400"
    : isUrgent ? "bg-amber-400" : "bg-primary/60";

  const ticketNum = ticket.originalTicketId || ticket.id.slice(-4).toUpperCase();

  return (
    <article
      className={cn(
        "group relative cursor-pointer rounded-xl bg-white/75 backdrop-blur-sm transition-all",
        "hover:bg-white/95 hover:shadow-md",
        isFocused && "bg-white/95 shadow-md ring-1 ring-primary/15",
        isSelected && "bg-white/90 ring-1 ring-primary/30"
      )}
      onClick={() => router.push(`/queue/${ticket.id}`)}
      onMouseEnter={onFocus}
    >
      <div className="flex divide-x divide-border/50">
        {/* LEFT — title + description + code refs */}
        <div className="flex-1 min-w-0 px-4 py-3 space-y-1.5">
          {/* Ticket ID + time */}
          <div className="flex items-center gap-2">
            <div
              className={cn("opacity-0 transition-opacity group-hover:opacity-100", isSelected && "opacity-100")}
              onClick={(e) => { e.stopPropagation(); onSelect(!isSelected); }}
            >
              <Checkbox checked={isSelected} className="size-3.5" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/70 font-semibold">PM-{ticketNum}</span>
            <span className="text-[10px] text-muted-foreground/50 ml-auto flex items-center gap-0.5">
              <Clock3 className="size-2.5" />{formatRelativeTime(ticket.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-sm font-semibold leading-snug text-foreground line-clamp-1">
            {ticket.draftTitle}
          </h2>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {ticket.draftDescription}
          </p>

          {/* Code refs */}
          {ticket.codeRefs.length > 0 && (
            <div className="flex items-center gap-1 pt-0.5">
              <Code2 className="size-3 text-muted-foreground/40 shrink-0" />
              {ticket.codeRefs.slice(0, 2).map((ref) => (
                <span key={ref.id} className="truncate max-w-[180px] font-mono text-[10px] text-muted-foreground/70">
                  {ref.filePath.split("/").pop()}
                </span>
              ))}
              {ticket.codeRefs.length > 2 && (
                <span className="text-[10px] text-muted-foreground/50">+{ticket.codeRefs.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — badges + status + actions */}
        <div className="w-48 shrink-0 px-3 py-3 flex flex-col justify-between gap-2">
          {/* Top: badges */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              <ClassificationBadge classification={ticket.classification} size="sm" />
              <ScopeBadge scope={ticket.scope} className="size-5 text-[10px]" />
            </div>
            <StatusPill status={ticket.status} />
            {deliveryRecord?.status === "delivered" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 truncate max-w-full">
                {TOOL_LABELS[deliveryRecord.tool]}
                {deliveryRecord.externalId && <span className="opacity-60">· {deliveryRecord.externalId}</span>}
              </span>
            )}
            {deliveryRecord?.status === "delivering" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
                <Loader2 className="size-2.5 animate-spin" /> Pushing…
              </span>
            )}
            {dispatchRecord?.status === "dispatched" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                <BotMessageSquare className="size-2.5" /> {AGENT_LABELS[dispatchRecord.agentType]}
              </span>
            )}
          </div>

          {/* Bottom: customer + actions */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex size-4 shrink-0 items-center justify-center rounded text-[8px] font-bold bg-muted/60 text-muted-foreground border">
                {ticket.customer.avatarInitials}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">{ticket.customer.name}</span>
              {deliveryRecord?.assigneeInitials && (
                <span className="flex size-4 shrink-0 items-center justify-center rounded bg-violet-100 text-[8px] font-bold text-violet-700 border border-violet-200 ml-auto" title={deliveryRecord.assigneeName}>
                  {deliveryRecord.assigneeInitials}
                </span>
              )}
            </div>
            {ticket.status === "pending" && (
              <div className="flex items-center gap-1">
                <Button size="sm" className="h-6 gap-0.5 bg-emerald-600 hover:bg-emerald-700 px-2 text-[10px] rounded-md flex-1" onClick={onAccept}>
                  <CheckCircle2 className="size-2.5" /> Accept
                </Button>
                <Button size="sm" variant="outline" className="h-6 gap-0.5 border-red-200 px-2 text-[10px] text-red-600 hover:bg-red-50 rounded-md" onClick={onReject}>
                  <XCircle className="size-2.5" /> Reject
                </Button>
                <Link href={`/queue/${ticket.id}`} onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="size-6 text-muted-foreground rounded-md">
                    <Eye className="size-2.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="size-3" />
        Accepted
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
        <XCircle className="size-3" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
      <Sparkles className="size-3" />
      Draft
    </span>
  );
}

function KbdHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border bg-background px-1 font-mono text-[10px] shadow-sm"
        >
          {key}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}
