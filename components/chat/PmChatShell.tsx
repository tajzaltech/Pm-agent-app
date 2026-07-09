"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  MessageSquarePlus,
  PanelLeft,
  PanelLeftClose,
  Search,
  Sparkles,
  Ticket,
} from "lucide-react";

import { PmChatView } from "@/components/chat/PmChatView";
import { Input } from "@/components/ui/input";
import { usePmChatStore } from "@/lib/store/pm-chat";
import { cn, formatRelativeTime } from "@/lib/utils";

interface PmChatShellProps {
  sessionId: string;
  ticketId?: string;
}

const SIDEBAR_W = 260;

function cleanPreview(text: string) {
  const cleaned = text
    .replace(/\*\*/g, "")
    .replace(/\n/g, " ")
    .replace(/^I'm your PM Agent.*$/i, "")
    .trim();
  if (!cleaned || /^new conversation$/i.test(cleaned) || /^no messages yet$/i.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function sessionHasMessages(id: string, messagesBySession: Record<string, { role: string }[]>) {
  return (messagesBySession[id] ?? []).some((m) => m.role === "user");
}

export function PmChatShell({ sessionId, ticketId }: PmChatShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");
  const rawSessions = usePmChatStore((s) => s.sessions);
  const messagesBySession = usePmChatStore((s) => s.messagesBySession);
  const createGlobalSession = usePmChatStore((s) => s.createGlobalSession);
  const selectSession = usePmChatStore((s) => s.selectSession);

  const sessions = useMemo(() => {
    const sorted = [...rawSessions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const seen = new Set<string>();
    return sorted.filter((s) => {
      const hasMessages = sessionHasMessages(s.id, messagesBySession);
      if (hasMessages) return true;
      if (s.id === sessionId) return true;
      if (seen.has("__empty__")) return false;
      seen.add("__empty__");
      return true;
    });
  }, [rawSessions, messagesBySession, sessionId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const preview = cleanPreview(s.preview) ?? "";
      return s.title.toLowerCase().includes(q) || preview.toLowerCase().includes(q);
    });
  }, [query, sessions]);

  const backHref = ticketId ? `/triage?ticket=${ticketId}` : "/triage";

  const handleSelectSession = (id: string, sessionTicketId?: string) => {
    selectSession(id);
    if (sessionTicketId) {
      router.push(`/chat/ticket/${sessionTicketId}`);
    } else {
      router.push("/chat");
    }
  };

  const handleNewChat = () => {
    const id = createGlobalSession();
    selectSession(id);
    router.push("/chat");
  };

  const grouped = useMemo(() => {
    const ticketSessions = filtered.filter((s) => s.ticketId);
    const globalSessions = filtered.filter((s) => !s.ticketId);
    return { ticketSessions, globalSessions };
  }, [filtered]);

  return (
    <div className="relative flex h-screen min-h-0 bg-background">
      <aside
        style={{ width: sidebarOpen ? SIDEBAR_W : 0 }}
        className={cn(
          "relative z-10 flex shrink-0 flex-col transition-[width] duration-200 ease-out",
          "border-r border-border/50 bg-gradient-to-b from-muted/30 via-background to-muted/20",
          "shadow-[inset_-1px_0_0_rgba(0,0,0,0.03)]",
          !sidebarOpen && "overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 shadow-sm">
              <Sparkles className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-foreground leading-none">AI PM</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/80">Product assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
            aria-label="Hide history"
          >
            <PanelLeftClose className="size-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-2 px-3 pb-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-95 hover:shadow-lg hover:shadow-primary/25"
          >
            <MessageSquarePlus className="size-3.5" />
            New conversation
          </button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              className="h-8 rounded-xl border-border/40 bg-background/70 pl-8 text-xs shadow-sm ring-0 backdrop-blur-sm placeholder:text-muted-foreground/50 focus-visible:border-primary/30 focus-visible:ring-primary/15"
            />
          </div>

          <Link
            href={backHref}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            {ticketId ? "Back to Triage" : "Back to workspace"}
          </Link>
        </div>

        <div className="mx-3 h-px bg-border/50" />

        {/* History */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {grouped.ticketSessions.length > 0 && (
            <SessionGroup
              label="From Triage"
              icon={Ticket}
              sessions={grouped.ticketSessions}
              activeSessionId={sessionId}
              onSelect={handleSelectSession}
            />
          )}
          {grouped.globalSessions.length > 0 && (
            <SessionGroup
              label="Recent"
              sessions={grouped.globalSessions}
              activeSessionId={sessionId}
              onSelect={handleSelectSession}
            />
          )}
          {filtered.length === 0 && (
            <div className="px-2 py-8 text-center">
              <p className="text-xs font-medium text-muted-foreground/70">
                {query ? "No matches" : "No conversations yet"}
              </p>
              {!query && (
                <p className="mt-1 text-[10px] text-muted-foreground/50">Start with New conversation above</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/40 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground/60">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500/80 mr-1.5 align-middle" />
            GitHub connected · read-only
          </p>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 top-3 z-20 flex size-8 items-center justify-center rounded-xl border border-border/50 bg-background/95 text-muted-foreground shadow-md backdrop-blur-sm transition-colors hover:text-foreground"
            aria-label="Show history"
          >
            <PanelLeft className="size-4" />
          </button>
        )}

        <PmChatView sessionId={sessionId} ticketId={ticketId} sidebarOpen={sidebarOpen} />
      </div>
    </div>
  );
}

function SessionGroup({
  label,
  icon: Icon,
  sessions,
  activeSessionId,
  onSelect,
}: {
  label: string;
  icon?: typeof Ticket;
  sessions: { id: string; ticketId?: string; title: string; preview: string; updatedAt: string }[];
  activeSessionId: string;
  onSelect: (id: string, ticketId?: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 px-2">
        {Icon && <Icon className="size-3 text-muted-foreground/50" />}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/55">
          {label}
        </p>
      </div>
      <ul className="space-y-0.5">
        {sessions.map((s) => {
          const active = s.id === activeSessionId;
          const preview = cleanPreview(s.preview);
          const title = s.title === "New conversation" ? "New chat" : s.title;
          const isDraft = !preview;

          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id, s.ticketId)}
                className={cn(
                  "group relative w-full rounded-xl px-2.5 py-2.5 text-left transition-all duration-150",
                  active
                    ? "bg-background shadow-sm ring-1 ring-primary/20"
                    : "hover:bg-background/80"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary" />
                )}
                <div className="flex items-start justify-between gap-2 pl-0.5">
                  <p
                    className={cn(
                      "min-w-0 flex-1 text-[11px] font-medium leading-snug line-clamp-2",
                      active ? "text-foreground" : "text-foreground/85 group-hover:text-foreground"
                    )}
                  >
                    {title}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 text-[9px] tabular-nums",
                      active ? "text-muted-foreground/70" : "text-muted-foreground/45"
                    )}
                  >
                    {formatRelativeTime(s.updatedAt)}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1 pl-0.5 text-[10px] leading-snug line-clamp-1",
                    isDraft
                      ? "italic text-muted-foreground/40"
                      : active
                        ? "text-muted-foreground/75"
                        : "text-muted-foreground/55 group-hover:text-muted-foreground/70"
                  )}
                >
                  {isDraft ? "Waiting for first message" : preview}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
