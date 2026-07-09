"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  MessageSquarePlus,
  PanelLeft,
  PanelLeftClose,
  Sparkles,
  Ticket,
  Zap,
} from "lucide-react";

import { PmChatView } from "@/components/chat/PmChatView";
import { usePmChatStore } from "@/lib/store/pm-chat";
import { cn, formatRelativeTime } from "@/lib/utils";

interface PmChatShellProps {
  sessionId: string;
  ticketId?: string;
}

export function PmChatShell({ sessionId, ticketId }: PmChatShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const rawSessions = usePmChatStore((s) => s.sessions);
  const createGlobalSession = usePmChatStore((s) => s.createGlobalSession);
  const selectSession = usePmChatStore((s) => s.selectSession);

  const sessions = useMemo(
    () =>
      [...rawSessions].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [rawSessions]
  );

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
    const ticketSessions = sessions.filter((s) => s.ticketId);
    const globalSessions = sessions.filter((s) => !s.ticketId);
    return { ticketSessions, globalSessions };
  }, [sessions]);

  return (
    <div className="relative flex h-screen min-h-0 bg-background">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/3 size-[420px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 size-[320px] rounded-full bg-violet-400/10 blur-[90px]" />
      </div>

      <aside
        className={cn(
          "relative z-10 flex shrink-0 flex-col bg-muted/25 backdrop-blur-xl transition-[width,opacity] duration-300 ease-out dark:bg-muted/15",
          sidebarOpen ? "w-[268px] opacity-100" : "w-0 overflow-hidden opacity-0"
        )}
      >
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-3">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-primary shadow-md shadow-primary/20">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">PM Agent</p>
            <p className="truncate text-[11px] text-muted-foreground">Your saved conversations</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
            aria-label="Hide history"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <div className="space-y-1.5 px-3 pb-4">
          <Link
            href={backHref}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 shrink-0" />
            {ticketId ? "Back to Triage" : "Back to workspace"}
          </Link>
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-opacity hover:opacity-90"
          >
            <MessageSquarePlus className="size-3.5" />
            New conversation
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 space-y-5">
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
              label="Recent"
              sessions={grouped.globalSessions}
              activeSessionId={sessionId}
              onSelect={handleSelectSession}
            />
          )}
          {sessions.length === 0 && (
            <div className="px-3 py-8 text-center">
              <Sparkles className="mx-auto mb-2 size-5 text-primary/50" />
              <p className="text-xs text-muted-foreground">No chats yet — start one above</p>
            </div>
          )}
        </div>
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 z-20 flex size-9 items-center justify-center rounded-xl bg-background/80 text-muted-foreground shadow-md backdrop-blur-sm transition-colors hover:text-foreground"
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
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </p>
      <ul className="space-y-0.5">
        {sessions.map((s) => {
          const active = s.id === activeSessionId;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id, s.ticketId)}
                className={cn(
                  "group relative w-full rounded-xl px-3 py-2.5 text-left transition-all",
                  active
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/60"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
                )}
                <div className="flex items-start gap-2.5 pl-1">
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                      s.ticketId ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.ticketId ? <Ticket className="size-3.5" /> : <Sparkles className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{s.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{s.preview}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {formatRelativeTime(s.updatedAt)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
