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
          "relative z-10 flex shrink-0 flex-col border-r border-border/70 bg-muted/40 transition-[width] duration-200 ease-out",
          !sidebarOpen && "overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between gap-1 border-b border-border/60 px-2.5 py-2.5">
          <p className="text-xs font-semibold tracking-tight text-foreground">AI PM</p>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background/80 hover:text-foreground"
            aria-label="Hide history"
          >
            <PanelLeftClose className="size-3.5" />
          </button>
        </div>

        <div className="space-y-1.5 border-b border-border/60 px-2 py-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground hover:opacity-90"
          >
            <MessageSquarePlus className="size-3" />
            New chat
          </button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-7 rounded-md border border-border/50 bg-background pl-7 text-[11px] shadow-none"
            />
          </div>
          <Link
            href={backHref}
            className="flex items-center gap-1 px-0.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-2.5" />
            {ticketId ? "Triage" : "Workspace"}
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {grouped.ticketSessions.length > 0 && (
            <SessionGroup
              label="Triage"
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
            <p className="px-1 py-4 text-center text-[10px] text-muted-foreground">
              {query ? "No matches" : "No chats yet"}
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
      <p className="mb-1.5 px-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/65">
        {label}
      </p>
      <ul className="space-y-1.5">
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
                  "w-full rounded-lg border px-2 py-2 text-left transition-all",
                  active
                    ? "border-primary/35 bg-background shadow-sm ring-1 ring-primary/15"
                    : "border-border/60 bg-background/90 hover:border-border hover:bg-background hover:shadow-sm"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <p
                    className={cn(
                      "min-w-0 flex-1 text-[11px] font-medium leading-snug line-clamp-2",
                      active ? "text-foreground" : "text-foreground/90"
                    )}
                  >
                    {title}
                  </p>
                  <span className="shrink-0 pt-0.5 text-[9px] tabular-nums text-muted-foreground/55">
                    {formatRelativeTime(s.updatedAt)}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1 text-[10px] leading-snug line-clamp-2",
                    isDraft ? "italic text-muted-foreground/45" : "text-muted-foreground/75"
                  )}
                >
                  {isDraft ? "Empty draft" : preview}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
