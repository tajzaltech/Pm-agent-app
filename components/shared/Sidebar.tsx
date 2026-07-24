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
      <Image
        src="/ask-pm-logo-v3.png"
        alt="Ask PM"
        width={512}
        height={512}
        className="size-6 rounded-md object-contain shadow-[0_2px_8px_-2px_rgba(91,67,214,0.4)]"
      />
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
          "group flex w-full items-center gap-2.5 rounded-xl transition-colors duration-200 hover:bg-muted/70",
          compact ? "px-2 py-1.5" : "px-2.5 py-2"
        )}
      >
        <WorkspaceLogo
          workspace={active}
          size={30}
          className="shrink-0 rounded-lg shadow-[0_1px_2px_rgba(20,10,50,0.08)] ring-1 ring-black/[0.05]"
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-[13px] font-bold leading-tight text-foreground">{active.name}</p>
          {!compact && (
            <p className="truncate text-[10.5px] leading-tight text-muted-foreground/70">{active.description}</p>
          )}
        </div>
        <CaretUpDown
          size={13}
          className={cn(
            "shrink-0 text-muted-foreground/40 transition-transform duration-200",
            open && "rotate-180 text-primary/70"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-2 right-2 top-[calc(100%+6px)] z-50 rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(46,26,120,0.35)]"
          >
            <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
              Workspaces
            </p>
            {workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleSwitch(w.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-150",
                  w.id === activeId ? "bg-primary/[0.07]" : "hover:bg-muted/60"
                )}
              >
                <WorkspaceLogo workspace={w} size={26} className="shrink-0 rounded-lg ring-1 ring-black/[0.05]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{w.name}</p>
                  <p className="truncate text-[10.5px] text-muted-foreground/70">{w.description}</p>
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

/* ─────────────────── Nav item (shared) ─────────────────── */

function NavItem({
  href,
  label,
  Icon,
  isActive,
  badge,
  onClick,
  compact,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill"; className?: string }>;
  isActive: boolean;
  badge: number;
  onClick?: (e: React.MouseEvent) => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl transition-all duration-200",
        compact ? "px-2.5 py-2 text-[13px]" : "px-2.5 py-2.5 text-[13.5px]",
        isActive
          ? "font-semibold text-primary"
          : "font-medium text-muted-foreground/85 hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {isActive && (
        <motion.span
          layoutId={compact ? "mobile-nav-active" : "nav-active"}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/[0.1] to-primary/[0.02] shadow-[inset_0_0_0_1px_rgba(91,67,214,0.14)]"
        />
      )}
      {isActive && (
        <span className="absolute left-0 top-1/2 z-10 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary to-[#8E6CF3]" />
      )}
      <span
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
          compact ? "size-6" : "size-7",
          isActive ? "bg-primary/15 text-primary" : "text-muted-foreground/50 group-hover:text-foreground/70"
        )}
      >
        <Icon size={compact ? 16 : 17} weight={isActive ? "fill" : "regular"} />
      </span>
      <span className="relative z-10 flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#8E6CF3] text-[10px] font-bold leading-none text-white shadow-[0_2px_6px_-1px_rgba(91,67,214,0.6)]">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─────────────────── Task list (shared) ─────────────────── */

function TaskList({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
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
    router.push("/chat");
  };

  const isOnChat = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/45">
          Tasks
        </span>
        <button
          type="button"
          onClick={handleNew}
          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground/50 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_0_3px_rgba(91,67,214,0.08)]"
          title="New task"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>

      <div className={cn("min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2", compact && "pb-2")}>
        {tasks.length === 0 && (
          <p className="px-3 py-4 text-center text-[12px] text-muted-foreground/40">
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
                "group relative flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary/[0.08] to-primary/[0.02] text-foreground shadow-[inset_0_0_0_1px_rgba(91,67,214,0.1)]"
                  : "text-muted-foreground hover:bg-muted/45 hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary to-[#8E6CF3]" />
              )}
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive ? "bg-primary/12 text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                )}
              >
                {isTicketTask ? <Ticket size={13} weight="duotone" /> : <ChatText size={13} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium leading-snug">
                  {task.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] leading-tight opacity-45">
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
    <aside className="hidden h-screen w-[264px] shrink-0 flex-col border-r border-black/[0.06] bg-gradient-to-b from-[#fbfaff] to-white shadow-[8px_0_28px_-24px_rgba(46,26,120,0.35)] lg:flex">
      <div className="flex h-[52px] shrink-0 items-center border-b border-black/[0.05] px-3">
        <WorkspaceSwitcher />
      </div>

      <nav className="shrink-0 space-y-1 px-3 pt-4">
        {NAV.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const badge = href === "/pipeline" && pendingCount > 0 ? pendingCount : 0;

          return (
            <NavItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              isActive={isActive}
              badge={badge}
              onClick={
                href === "/chat"
                  ? (e) => {
                      e.preventDefault();
                      ensureGlobalSession();
                      router.push("/chat");
                    }
                  : undefined
              }
            />
          );
        })}
      </nav>

      <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-black/[0.05] pt-2">
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
            initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[264px] bg-white shadow-2xl flex flex-col border-r border-black/[0.06]"
          >
            <div className="flex items-center h-12 px-5 gap-3 border-b border-black/[0.05]">
              <BrandMark />
              <button onClick={() => setOpen(false)} className="ml-auto flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <X size={15} />
              </button>
            </div>

            <nav className="px-2.5 pt-2.5 space-y-1 shrink-0">
              {NAV.map(({ href, label, Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                const badge = href === "/pipeline" && pendingCount > 0 ? pendingCount : 0;
                return (
                  <NavItem
                    key={href}
                    href={href}
                    label={label}
                    Icon={Icon}
                    isActive={isActive}
                    badge={badge}
                    compact
                    onClick={(e) => {
                      if (href === "/chat") {
                        e.preventDefault();
                        ensureGlobalSession();
                        router.push("/chat");
                      }
                      setOpen(false);
                    }}
                  />
                );
              })}
            </nav>

            <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-black/[0.05] pt-2">
              <TaskList onNavigate={() => setOpen(false)} compact />
            </div>

            <div className="border-t border-black/[0.05] px-2.5 py-2 space-y-0.5 shrink-0">
              <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] text-muted-foreground transition-colors hover:bg-muted/60">
                <GearSix size={15} /> Settings
              </Link>
              <button type="button" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] text-muted-foreground transition-colors hover:bg-muted/60">
                <SignOut size={15} /> Sign out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
