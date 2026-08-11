"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChatCircleDots,
  DotsThree,
  NotePencil,
  PencilSimple,
  Ticket as TicketIcon,
  TrashSimple,
} from "@phosphor-icons/react";

import { usePmChatStore } from "@/lib/store/pm-chat";
import { cn, formatRelativeTime } from "@/lib/utils";

/**
 * Conversation rail for the Ask PM workspace: a compact "new chat" action plus
 * the full session history, each row renameable and deletable.
 */
export function ChatHistorySidebar() {
  const router = useRouter();
  const activeSessionId = usePmChatStore((s) => s.activeSessionId);
  const sessions = usePmChatStore((s) => s.sessions);
  const selectSession = usePmChatStore((s) => s.selectSession);
  const createGlobalSession = usePmChatStore((s) => s.createGlobalSession);
  const renameSession = usePmChatStore((s) => s.renameSession);
  const deleteSession = usePmChatStore((s) => s.deleteSession);

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const ordered = useMemo(
    () => [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [sessions]
  );

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) setMenuFor(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const open = (id: string) => {
    selectSession(id);
    router.push("/chat");
  };

  const startNew = () => {
    createGlobalSession();
    router.push("/chat");
  };

  const commitRename = (id: string) => {
    const next = draft.trim();
    if (next) renameSession(id, next);
    setEditingId(null);
  };

  const remove = (id: string, title: string) => {
    setMenuFor(null);
    deleteSession(id);
    toast.success(`Deleted "${title}"`);
    router.push("/chat");
  };

  return (
    <aside className="hidden h-screen w-[236px] shrink-0 flex-col border-r border-black/[0.05] bg-[#fcfcfe] lg:flex">
      {/* 48px matches the nav brand row and TopNav, so all three dividers align. */}
      <div className="flex h-[48px] shrink-0 items-center justify-between border-b border-black/[0.05] pl-4 pr-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
          Ask PM
        </span>
        <button
          type="button"
          onClick={startNew}
          title="New chat"
          aria-label="New chat"
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/[0.07] hover:text-primary"
        >
          <NotePencil size={16} />
        </button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {ordered.length === 0 ? (
          <p className="px-2 py-6 text-center text-[12px] leading-relaxed text-muted-foreground/60">
            No conversations yet.
          </p>
        ) : (
          ordered.map((s) => {
            const isActive = s.id === activeSessionId;
            const isEditing = s.id === editingId;

            return (
              <div key={s.id} className="group relative">
                {isEditing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commitRename(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(s.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded-lg border border-primary/40 bg-white px-2.5 py-2 text-[12.5px] font-medium outline-none ring-2 ring-primary/10"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => open(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg py-2 pl-2.5 pr-8 text-left transition-colors",
                      isActive ? "bg-primary/[0.07]" : "hover:bg-muted/60"
                    )}
                  >
                    {s.ticketId ? (
                      <TicketIcon
                        size={14}
                        className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground/45")}
                      />
                    ) : (
                      <ChatCircleDots
                        size={14}
                        className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground/45")}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[12.5px] leading-tight",
                          isActive ? "font-semibold text-primary" : "font-medium text-foreground/85"
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[10.5px] leading-tight text-muted-foreground/55">
                        {formatRelativeTime(s.updatedAt)}
                      </span>
                    </span>
                  </button>
                )}

                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setMenuFor(menuFor === s.id ? null : s.id)}
                    aria-label={`Options for ${s.title}`}
                    className={cn(
                      "absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/60 transition-all",
                      "opacity-0 hover:bg-black/[0.05] hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100",
                      menuFor === s.id && "opacity-100 bg-black/[0.05] text-foreground"
                    )}
                  >
                    <DotsThree size={16} weight="bold" />
                  </button>
                )}

                {menuFor === s.id && (
                  <div className="absolute right-1 top-[calc(100%-2px)] z-30 w-36 rounded-xl border border-black/[0.06] bg-white p-1 shadow-[0_16px_40px_-16px_rgba(46,26,120,0.35)]">
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(s.title);
                        setEditingId(s.id);
                        setMenuFor(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-foreground/85 transition-colors hover:bg-muted/70"
                    >
                      <PencilSimple size={13} /> Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s.id, s.title)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-red-600 transition-colors hover:bg-red-50"
                    >
                      <TrashSimple size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
