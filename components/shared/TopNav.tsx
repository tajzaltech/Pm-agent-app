"use client";

import {
  BellRinging,
  User,
  SignOut,
  GearSix,
  UsersThree,
} from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/sign-out";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function TopNav() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="relative z-30 hidden h-[48px] shrink-0 items-center justify-end gap-2 overflow-visible bg-background px-5 lg:flex">

      {/* Notifications */}
      <div ref={notificationsRef} className="pointer-events-auto relative">
        <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }} className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
          <BellRinging size={18} weight={notificationsOpen ? "fill" : "regular"} />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
        </button>
        {notificationsOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-border/70 bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between px-3 py-2"><p className="text-sm font-semibold">Notifications</p><button type="button" onClick={() => setNotificationsOpen(false)} className="text-[11px] text-primary hover:underline">Mark all read</button></div>
            <div className="space-y-1"><div className="rounded-xl bg-primary/[0.06] px-3 py-2.5"><p className="text-[12px] font-medium">6 tickets are waiting in Pipeline</p><p className="mt-0.5 text-[11px] text-muted-foreground">Review the latest customer reports.</p></div><div className="rounded-xl px-3 py-2.5 hover:bg-muted/50"><p className="text-[12px] font-medium">Dev Agent completed a run</p><p className="mt-0.5 text-[11px] text-muted-foreground">Stripe webhook investigation is ready.</p></div></div>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div ref={profileRef} className="pointer-events-auto relative">
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
              href="/team"
              role="menuitem"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <UsersThree size={14} />
              Team
            </Link>
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
