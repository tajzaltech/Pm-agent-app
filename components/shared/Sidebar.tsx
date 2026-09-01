"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
  ChartBar,
} from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/sign-out";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { CaretDoubleLeft, CaretDoubleRight, CaretUpDown, Check } from "@phosphor-icons/react";
import { AskPmBrand } from "@/components/shared/BrandLogos";
import { WorkspaceLogo } from "@/components/shared/WorkspaceLogo";

const NAV = [
  { href: "/chat", label: "Ask PM", Icon: ChatCircleDots },
  { href: "/pipeline", label: "Pipeline", Icon: Queue },
  { href: "/insights", label: "Insights", Icon: ChartBar },
  { href: "/connections", label: "Connections", Icon: Plugs },
  { href: "/automation", label: "Automation", Icon: Lightning },
];

function BrandMark() {
  return <AskPmBrand />;
}

function WorkspaceSwitcher() {
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
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "group flex w-full items-center gap-2 rounded-lg border px-2 py-[7px] text-left transition-colors duration-200",
          open
            ? "border-primary/25 bg-primary/[0.04]"
            : "border-black/[0.07] bg-white hover:border-black/[0.12] hover:bg-muted/40"
        )}
      >
        <WorkspaceLogo workspace={active} size={22} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium leading-none text-foreground">
          {active.name}
        </span>
        <CaretUpDown
          size={12}
          className={cn(
            "shrink-0 transition-colors duration-200",
            open ? "text-primary" : "text-muted-foreground/45 group-hover:text-muted-foreground/75"
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
            className="absolute inset-x-0 top-[calc(100%+6px)] z-50 rounded-xl border border-black/[0.06] bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(46,26,120,0.35)]"
          >
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
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
  collapsed,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill"; className?: string }>;
  isActive: boolean;
  badge: number;
  onClick?: (e: React.MouseEvent) => void;
  compact?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl transition-all duration-200",
        collapsed ? "justify-center px-0 py-2.5" : compact ? "px-2.5 py-2 text-[13px]" : "px-2.5 py-2.5 text-[13.5px]",
        isActive
          ? "font-semibold text-primary"
          : "font-medium text-muted-foreground/85 hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {isActive && (
        <motion.span
          layoutId={compact ? "mobile-nav-active" : "nav-active"}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="absolute inset-0 rounded-lg bg-primary/[0.06]"
        />
      )}
      <span
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
          compact ? "size-6" : "size-7",
          isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-foreground/70"
        )}
      >
        <Icon size={compact ? 16 : 17} weight={isActive ? "fill" : "regular"} />
        {/* In the rail there is no room for a count, so it becomes a marker. */}
        {collapsed && badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-[#fbfaff]" />
        )}
      </span>
      {!collapsed && <span className="relative z-10 flex-1 truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="relative z-10 flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10.5px] font-semibold leading-none text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─────────────────── Desktop ─────────────────── */

function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const pendingCount = useTicketStore((s) => s.getPending().length);
  const ensureGlobalSession = usePmChatStore((s) => s.ensureGlobalSession);

  // Ask PM gets the width for its own conversation rail, so the app nav collapses
  // to icons there. The override is keyed by route, so it resets on navigation
  // without needing an effect.
  const [override, setOverride] = useState<{ path: string; expanded: boolean } | null>(null);
  const autoCollapsed = pathname === "/chat" || pathname.startsWith("/chat/");
  const collapsed = override?.path === pathname ? !override.expanded : autoCollapsed;
  const toggle = () => setOverride({ path: pathname, expanded: collapsed });

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-black/[0.06] bg-gradient-to-b from-[#fbfaff] to-white shadow-[8px_0_28px_-24px_rgba(46,26,120,0.35)] lg:flex",
        "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[58px]" : "w-[240px]"
      )}
    >
      <div
        className={cn(
          "flex h-[48px] shrink-0 items-center border-b border-black/[0.05]",
          collapsed ? "justify-center px-0" : "px-4"
        )}
      >
        {collapsed ? (
          // Hovering the mark swaps it for the expand control.
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand navigation"
            title="Expand navigation"
            className="group relative flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-primary/[0.07]"
          >
            <Image
              src="/ask-pm-logo-v2.png"
              alt="Ask PM"
              width={24}
              height={24}
              className="size-6 object-contain transition-opacity duration-150 group-hover:opacity-0"
            />
            <CaretDoubleRight
              size={16}
              weight="bold"
              className="absolute text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            />
          </button>
        ) : (
          <>
            <BrandMark />
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse navigation"
              title="Collapse navigation"
              className="ml-auto flex size-7 items-center justify-center rounded-lg text-muted-foreground/45 transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <CaretDoubleLeft size={14} weight="bold" />
            </button>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="shrink-0 px-3 pt-3">
          <WorkspaceSwitcher />
        </div>
      )}

      <nav className={cn("shrink-0 space-y-1 pt-3", collapsed ? "px-2" : "px-3")}>
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
              collapsed={collapsed}
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
