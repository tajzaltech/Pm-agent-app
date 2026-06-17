"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTicketStore } from "@/lib/store/tickets";
import {
  Inbox,
  LayoutDashboard,
  Layers,
  BarChart2,
  Plug,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/queue", label: "Queue", Icon: Inbox },
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/clusters", label: "Clusters", Icon: Layers },
  { href: "/analytics", label: "Analytics", Icon: BarChart2 },
  { href: "/connections", label: "Connections", Icon: Plug },
  { href: "/settings", label: "Settings", Icon: Settings },
];

function NavContent({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const pendingCount = useTicketStore((s) => s.getPending().length);

  return (
    <nav className="flex-1 py-3 overflow-y-auto">
      <ul className="space-y-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const showPendingBadge = href === "/queue" && pendingCount > 0;

          const item = (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavClick}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.13, ease: "easeOut" }}
                      className="flex flex-1 items-center gap-2 min-w-0 overflow-hidden"
                    >
                      <span className="flex-1 truncate">{label}</span>
                      {showPendingBadge && (
                        <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-[11px] font-bold text-white">
                          {pendingCount}
                        </span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
                {collapsed && showPendingBadge && (
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );

          if (collapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger>
                  <div className="relative">{item}</div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return item;
        })}
      </ul>
    </nav>
  );
}

// Desktop sidebar (collapsible rail)
function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
      className="hidden lg:flex h-screen flex-col shrink-0 relative z-10 bg-white shadow-[2px_0_24px_0_rgba(0,0,0,0.07)] overflow-hidden"
    >
      {/* Logo row */}
      <div className="flex items-center h-14 shrink-0 border-b px-3 gap-2">
        {/* Logo icon — always visible */}
        <div className="flex items-center justify-center size-8 rounded-xl bg-primary shrink-0">
          <Zap className="size-4 text-white" />
        </div>

        {/* Brand name — fades when collapsed */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="brand"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.13, ease: "easeOut" }}
              className="font-bold text-sm tracking-tight text-foreground whitespace-nowrap flex-1"
            >
              PM Agent
            </motion.span>
          )}
        </AnimatePresence>

        {/* Toggle button — always right-aligned */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>

      <NavContent collapsed={collapsed} />

      {/* Footer */}
      <div className="border-t p-2">
        <Link
          href="/signin"
          className={cn(
            "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "justify-center px-2"
          )}
          title="Logout"
        >
          <LogOut className="size-3.5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Link>
      </div>
    </motion.aside>
  );
}

// Mobile top bar + drawer
function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white/90 backdrop-blur-sm border-b flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">PM Agent</span>
        </div>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-white shadow-2xl flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center h-14 px-4 border-b gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary">
                <Zap className="size-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight flex-1">PM Agent</span>
              <button
                onClick={() => setOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <NavContent collapsed={false} onNavClick={() => setOpen(false)} />

            <div className="border-t p-2">
              <Link
                href="/signin"
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="size-3.5 shrink-0" />
                <span>Logout</span>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export function Sidebar() {
  const hydrateFromApi = useTicketStore((s) => s.hydrateFromApi);

  useEffect(() => {
    void hydrateFromApi();
  }, [hydrateFromApi]);

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}
