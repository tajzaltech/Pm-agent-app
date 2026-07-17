"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useTicketStore } from "@/lib/store/tickets";
import { usePmChatStore } from "@/lib/store/pm-chat";
import {
  ChatCircleDots,
  Plugs,
  Queue,
  Lightning,
  List,
  X,
  GearSix,
  SignOut,
  Plus,
  Ticket,
  ChatText,
  ChartBar,
} from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/sign-out";
import { useEffect, useState, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { CaretUpDown, Check } from "@phosphor-icons/react";
import { WorkspaceLogo } from "@/components/shared/WorkspaceLogo";

const NAV = [
  { href: "/chat", label: "Ask PM", Icon: ChatCircleDots },
  { href: "/pipeline", label: "Pipeline", Icon: Queue },
  { href: "/insights", label: "Insights", Icon: ChartBar },
  { href: "/connections", label: "Connections", Icon: Plugs },
  { href: "/automation", label: "Automation", Icon: Lightning },
];

function BrandMark() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-foreground">
      <Image src="/ask-pm-logo-v2.png" alt="Ask PM" width={24} height={24} className="size-6 object-contain" />
      Ask <span className="gradient-text">PM</span>
    </span>
  );
}

function WorkspaceSwitcher({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActive = useWorkspaceStore((s) => s.setActiveWorkspace);
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSwitch = (id: string) => {
    setActive(id);
    setOpen(false);
    setTimeout(() => {
      useTicketStore.getState().switchWorkspace();
      usePmChatStore.getState().switchWorkspace(id);
    }, 0);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg transition-colors hover:bg-muted/60",
          compact ? "px-2 py-1.5" : "px-3 py-2"
        )}
      >
        <WorkspaceLogo workspace={active} size={28} className="shrink-0" />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-[13px] font-semibold leading-tight">{active.name}</p>
          {!compact && <p className="truncate text-[10px] text-muted-foreground leading-tight">{active.description}</p>}
        </div>
        <CaretUpDown size={14} className="shrink-0 text-muted-foreground/50" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-2 right-2 top-[calc(100%+4px)] z-50 rounded-xl border bg-card p-1 shadow-lg"
          >
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Workspaces
            </p>
            {workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleSwitch(w.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  w.id === activeId ? "bg-primary/8" : "hover:bg-muted/60"
                )}
              >
                <WorkspaceLogo workspace={w} size={24} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium">{w.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{w.description}</p>
                </div>
                {w.id === activeId && <Check size={14} weight="bold" className="shrink-0 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const hydrateFromApi = useTicketStore((s) => s.hydrateFromApi);
  useEffect(() => { void hydrateFromApi(); }, [hydrateFromApi]);
  return (
    <>
      <DesktopSidebar />
      <MobileBar />
    </>
  );
}

/* ─────────────────── Task list (shared) ─────────────────── */

function TaskList({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const sessions = usePmChatStore((s) => s.sessions);
  const activeSessionId = usePmChatStore((s) => s.activeSessionId);
  const messagesBySession = usePmChatStore((s) => s.messagesBySession);
  const selectSession = usePmChatStore((s) => s.selectSession);
  const createGlobalSession = usePmChatStore((s) => s.createGlobalSession);
  const pathname = usePathname();

  const tasks = useMemo(() => {
    return sessions
      .filter((s) => {
        const msgs = messagesBySession[s.id] ?? [];
        return msgs.some((m) => m.role === "user");
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20);
  }, [sessions, messagesBySession]);

  const handleNew = () => {
    createGlobalSession();
    onNavigate?.();
    router.push("/chat");
  };

  const handleSelect = (sessionId: string) => {
    selectSession(sessionId);
    onNavigate?.();
    router.push("/chat");
  };

  const isOnChat = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/50">
          Tasks
        </span>
        <button
          type="button"
          onClick={handleNew}
          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground/50 transition-all hover:bg-primary/10 hover:text-primary"
          title="New task"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 space-y-0.5">
        {tasks.length === 0 && (
          <p className="px-3 py-4 text-[12px] text-muted-foreground/40 text-center">
            No tasks yet
          </p>
        )}
        {tasks.map((task) => {
          const isActive = isOnChat && task.id === activeSessionId;
          const isTicketTask = !!task.ticketId;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => handleSelect(task.id)}
              className={cn(
                "group flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-all",
                isActive
                  ? "bg-primary/10 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              {isTicketTask ? (
                <Ticket size={15} weight="duotone" className="mt-0.5 shrink-0 text-primary/60" />
              ) : (
                <ChatText size={15} className="mt-0.5 shrink-0 opacity-40" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] leading-snug font-medium">
                  {task.title}
                </p>
                <p className="truncate text-[11px] leading-tight mt-0.5 opacity-40">
                  {formatRelativeTime(task.updatedAt)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────── Desktop ─────────────────── */

function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const pendingCount = useTicketStore((s) => s.getPending().length);
  const ensureGlobalSession = usePmChatStore((s) => s.ensureGlobalSession);

  return (
    <aside className="hidden lg:flex h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-gradient-to-b from-sidebar to-sidebar/80">
      <div className="flex h-[48px] shrink-0 items-center border-b border-sidebar-border px-3">
        <WorkspaceSwitcher />
      </div>

      <nav className="px-3 pt-4 space-y-1 shrink-0">
        {NAV.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const badge = href === "/pipeline" && pendingCount > 0 ? pendingCount : 0;

          return (
            <Link
              key={href}
              href={href}
              onClick={href === "/chat" ? (e) => { e.preventDefault(); ensureGlobalSession(); router.push("/chat"); } : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all",
                isActive
                  ? "bg-primary/10 font-semibold text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} className="shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.50_0.20_310)] text-[10px] font-bold text-white leading-none shadow-sm">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-sidebar-border/60 pt-2 flex-1 min-h-0 flex flex-col">
        <TaskList />
      </div>
    </aside>
  );
}

/* ─────────────────── Mobile ─────────────────── */

function MobileBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pendingCount = useTicketStore((s) => s.getPending().length);
  const ensureGlobalSession = usePmChatStore((s) => s.ensureGlobalSession);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-11 bg-background/95 backdrop-blur-md border-b flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
          <List size={18} />
        </button>
        <BrandMark />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-sidebar shadow-xl flex flex-col border-r border-sidebar-border"
          >
            <div className="flex items-center h-11 px-5 gap-3">
              <BrandMark />
              <button onClick={() => setOpen(false)} className="ml-auto flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                <X size={14} />
              </button>
            </div>

            <nav className="px-2.5 pt-1 space-y-px shrink-0">
              {NAV.map(({ href, label, Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                const badge = href === "/pipeline" && pendingCount > 0 ? pendingCount : 0;
                return (
                  <Link key={href} href={href} onClick={(e) => { if (href === "/chat") { e.preventDefault(); ensureGlobalSession(); router.push("/chat"); } setOpen(false); }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors",
                      isActive ? "bg-primary/8 font-medium text-primary" : "text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon size={18} weight={isActive ? "fill" : "regular"} className="shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-sidebar-border/60 pt-2 flex-1 min-h-0 flex flex-col">
              <TaskList onNavigate={() => setOpen(false)} />
            </div>

            <div className="border-t border-sidebar-border px-2.5 py-2 space-y-px shrink-0">
              <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-[6px] text-[12px] text-muted-foreground hover:bg-muted/60 transition-colors">
                <GearSix size={15} /> Settings
              </Link>
              <button type="button" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[6px] text-[12px] text-muted-foreground hover:bg-muted/60 transition-colors">
                <SignOut size={15} /> Sign out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
