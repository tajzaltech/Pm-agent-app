"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { useTicketStore } from "@/lib/store/tickets";

import {
  Inbox,
  BarChart2,
  Network,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Users,
  MessageSquare,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/SignOutButton";

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

  { href: "/triage", label: "Triage", Icon: Inbox },

  { href: "/chat", label: "AI PM", Icon: MessageSquare },

  { href: "/insights", label: "Insights", Icon: BarChart2 },

  { href: "/connections", label: "Connections", Icon: Network },

  { href: "/team", label: "Team", Icon: Users },

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

          const isActive =
            pathname === href ||
            pathname.startsWith(href + "/") ||
            (href === "/chat" && pathname.startsWith("/chat"));

          const showPendingBadge = href === "/triage" && pendingCount > 0;



          const item = (

            <li key={href}>

              <Link

                href={href}

                onClick={onNavClick}

                className={cn(

                  "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-normal transition-all",

                  isActive

                    ? "bg-sidebar-accent text-sidebar-primary font-medium"

                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",

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

                        <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-[11px] font-bold text-primary-foreground">

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



const SIDEBAR_COLLAPSED_KEY = "pm-agent-sidebar-collapsed";



function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="border-t border-sidebar-border p-2 shrink-0 space-y-0.5">
      <Link
        href="/settings"

        className={cn(

          "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors",

          collapsed && "justify-center px-2"

        )}

        title="Settings"

      >

        <Settings className="size-3.5 shrink-0" />

        {!collapsed && <span>Settings</span>}

      </Link>

      <SignOutButton
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors",
          collapsed && "justify-center px-2"
        )}
        collapsed={collapsed}
      />

    </div>

  );

}



function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);



  useEffect(() => {

    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);

    if (stored === "true") setCollapsed(true);

    setMounted(true);

  }, []);



  const toggleCollapsed = () => {

    setCollapsed((prev) => {

      const next = !prev;

      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));

      return next;

    });

  };



  return (

    <motion.aside

      initial={false}

      animate={{ width: mounted ? (collapsed ? 56 : 240) : 240 }}

      transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}

      className={cn(

        "group/sidebar hidden lg:flex h-screen flex-col shrink-0 relative z-20 bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden",

        collapsed && "hover:bg-sidebar-accent/20 transition-colors duration-200"

      )}

    >

      <div

        className={cn(

          "relative flex items-center h-14 shrink-0 border-b border-sidebar-border",

          collapsed ? "justify-center px-2" : "px-3 gap-2"

        )}

      >

        <div
          className={cn(
            "flex items-center justify-center size-8 rounded-xl bg-primary shrink-0",
            collapsed && "group-hover/sidebar:opacity-25 transition-opacity duration-200"
          )}
        >
          <Zap className="size-4 text-primary-foreground" />
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="brand"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.13, ease: "easeOut" }}
              className="font-bold text-sm tracking-tight text-sidebar-foreground whitespace-nowrap flex-1 min-w-0"
            >
              PM Agent
            </motion.span>
          )}
        </AnimatePresence>



        {!collapsed && (

          <button

            type="button"

            onClick={toggleCollapsed}

            aria-label="Collapse sidebar"

            aria-expanded

            className="ml-auto flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors shrink-0"

          >

            <ChevronLeft className="size-4" />

          </button>

        )}



        {collapsed && (

          <button

            type="button"

            onClick={toggleCollapsed}

            aria-label="Expand sidebar"

            aria-expanded={false}

            className={cn(

              "absolute inset-0 flex items-center justify-center",

              "opacity-0 pointer-events-none",

              "group-hover/sidebar:opacity-100 group-hover/sidebar:pointer-events-auto",

              "transition-opacity duration-200 ease-out"

            )}

          >

            <span className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">

              <ChevronRight className="size-4" />

            </span>

          </button>

        )}

      </div>



      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

        <NavContent collapsed={collapsed} />

        <SidebarFooter collapsed={collapsed} />
      </div>
    </motion.aside>

  );

}



function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();



  useEffect(() => {

    setOpen(false);

  }, [pathname]);



  return (

    <>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-card/90 backdrop-blur-sm border-b flex items-center px-4 gap-3 shadow-sm">

        <button

          onClick={() => setOpen(true)}

          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"

        >

          <Menu className="size-5" />

        </button>

        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm tracking-tight">PM Agent</span>
        </div>

      </div>



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



      <AnimatePresence>

        {open && (

          <motion.aside

            initial={{ x: -280 }}

            animate={{ x: 0 }}

            exit={{ x: -280 }}

            transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}

            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-sidebar text-sidebar-foreground shadow-2xl flex flex-col border-r border-sidebar-border"

          >

            <div className="flex items-center h-14 px-4 border-b border-sidebar-border gap-3">

              <div className="flex size-8 items-center justify-center rounded-xl bg-primary">
                <Zap className="size-4 text-primary-foreground" />
              </div>

              <span className="font-bold text-sm tracking-tight flex-1">PM Agent</span>

              <button

                onClick={() => setOpen(false)}

                className="flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"

              >

                <X className="size-4" />

              </button>

            </div>



            <NavContent collapsed={false} onNavClick={() => setOpen(false)} />

            <SidebarFooter collapsed={false} />
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


