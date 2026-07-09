"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, MessageSquarePlus, PanelLeft, PanelLeftClose, Search } from "lucide-react";

import { PmChatView } from "@/components/chat/PmChatView";
import { Input } from "@/components/ui/input";
import { usePmChatStore } from "@/lib/store/pm-chat";
import { cn, formatRelativeTime } from "@/lib/utils";

interface PmChatShellProps {
  sessionId: string;
  ticketId?: string;
}

function cleanPreview(text: string) {
  const cleaned = text
    .replace(/\*\*/g, "")
    .replace(/\n/g, " ")
    .replace(/^I'm your PM Agent.*$/i, "")
    .trim();
  if (!cleaned || /^new conversation$/i.test(cleaned)) return "No messages yet";
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
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        cleanPreview(s.preview).toLowerCase().includes(q)
    );
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
        className={cn(
          "relative z-10 flex shrink-0 flex-col border-r border-border/60 bg-muted/30 transition-[width] duration-200 ease-out",
          sidebarOpen ? "w-[260px]" : "w-0 overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-3">
          <p className="text-sm font-semibold tracking-tight text-foreground">AI PM</p>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background/80 hover:text-foreground"
            aria-label="Hide history"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <div className="space-y-2 border-b border-border/50 p-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            <MessageSquarePlus className="size-3.5" />
            New chat
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="h-8 border-0 bg-background/80 pl-8 text-xs shadow-none"
            />
          </div>
          <Link
            href={backHref}
            className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            {ticketId ? "Back to Triage" : "Back to workspace"}
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-3">
          {grouped.ticketSessions.length > 0 && (
            <SessionGroup
              label="From Triage"
              sessions={grouped.ticketSessions}
              activeSessionId={sessionId}
              onSelect={handleSelectSession}
            />
          )}
          {grouped.globalSessions.length > 0 && (
            <SessionGroup
              label="Chats"
              sessions={grouped.globalSessions}
              activeSessionId={sessionId}
              onSelect={handleSelectSession}
            />
          )}
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">
              {query ? "No matches" : "Start a new chat above"}
            </p>
          )}
        </div>
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 top-3 z-20 flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground shadow-sm hover:text-foreground"
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
  sessions,
  activeSessionId,
  onSelect,
}: {
  label: string;
  sessions: { id: string; ticketId?: string; title: string; preview: string; updatedAt: string }[];
  activeSessionId: string;
  onSelect: (id: string, ticketId?: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <ul className="space-y-0.5">
        {sessions.map((s) => {
          const active = s.id === activeSessionId;
          const preview = cleanPreview(s.preview);
          const title = s.title === "New conversation" ? "Draft" : s.title;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id, s.ticketId)}
                className={cn(
                  "w-full rounded-lg px-2.5 py-2 text-left transition-colors",
                  active ? "bg-background shadow-sm ring-1 ring-border/60" : "hover:bg-background/70"
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs font-medium text-foreground">{title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground/60">
                    {formatRelativeTime(s.updatedAt)}
                  </span>
                </div>
                <p className="truncate text-[11px] text-muted-foreground mt-0.5">{preview}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
