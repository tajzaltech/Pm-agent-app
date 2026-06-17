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

export function Sidebar() {
  const pathname = usePathname();
  const pendingCount = useTicketStore((s) => s.getPending().length);
  const hydrateFromApi = useTicketStore((s) => s.hydrateFromApi);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    void hydrateFromApi();
  }, [hydrateFromApi]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
      className="h-screen flex flex-col shrink-0 relative z-10 bg-white shadow-[2px_0_24px_0_rgba(0,0,0,0.07)] overflow-hidden"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 px-4 h-14 shrink-0 border-b",
        collapsed && "justify-center px-0"
      )}>
        <div className="flex items-center justify-center size-8 rounded-xl bg-primary shrink-0">
          <Zap className="size-4 text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="brand"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="font-bold text-sm tracking-tight text-foreground whitespace-nowrap"
            >
              PM Agent
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "ml-auto flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            collapsed && "ml-0"
          )}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const showPendingBadge = href === "/queue" && pendingCount > 0;

            const item = (
              <li key={href}>
                <Link
                  href={href}
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
                        transition={{ duration: 0.15, ease: "easeOut" }}
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

      {/* Footer */}
      <div className="border-t p-2 space-y-1">
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
