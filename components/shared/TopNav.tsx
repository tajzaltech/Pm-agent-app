"use client";

import { usePathname } from "next/navigation";
import {
  Bell,
  MagnifyingGlass,
  User,
  SignOut,
  GearSix,
} from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/sign-out";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/chat": "Ask PM",
  "/pipeline": "Pipeline",
  "/connections": "Connections",
  "/automation": "Automation",
  "/settings": "Settings",
};

function getPageTitle(pathname: string) {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  return "PM Agent";
}

export function TopNav() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="relative z-30 hidden h-[48px] shrink-0 items-center gap-4 overflow-visible border-b border-border/40 bg-white/60 px-5 backdrop-blur-xl lg:flex">
      <h1 className="text-[14px] font-bold tracking-tight text-foreground">
        {title}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all",
          searchFocused
            ? "w-64 border-primary/30 shadow-sm bg-card"
            : "w-48 border-transparent bg-muted/40 hover:bg-muted/60"
        )}
      >
        <MagnifyingGlass size={14} className="shrink-0 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search…"
          className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/50"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {!searchFocused && (
          <kbd className="hidden xl:inline-flex items-center rounded border bg-muted/60 px-1 py-0.5 text-[9px] font-mono text-muted-foreground/50 leading-none">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Notifications */}
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
      </button>

      {/* Profile dropdown */}
      <div ref={profileRef} className="relative">
        <button
          type="button"
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          aria-controls="profile-menu"
          aria-label="Open profile menu"
          onClick={() => setProfileOpen((open) => !open)}
          className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-muted/60"
        >
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User size={14} weight="fill" />
          </div>
        </button>

        {profileOpen && (
          <div
            id="profile-menu"
            role="menu"
            aria-label="Profile menu"
            className="absolute right-0 top-[calc(100%+4px)] z-50 w-48 rounded-xl border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="px-3 py-2 border-b mb-1">
              <p className="text-[12px] font-medium">Demo User</p>
              <p className="text-[11px] text-muted-foreground">demo@pmagent.io</p>
            </div>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <GearSix size={14} />
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => { setProfileOpen(false); signOut(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <SignOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
