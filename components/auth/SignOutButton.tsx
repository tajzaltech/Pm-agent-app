"use client";

import { LogOut } from "lucide-react";

import { signOut } from "@/lib/auth/sign-out";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  collapsed?: boolean;
  showLabel?: boolean;
  title?: string;
}

export function SignOutButton({
  className,
  collapsed = false,
  showLabel = true,
  title = "Log out",
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className={cn(className)}
      title={title}
    >
      <LogOut className="size-3.5 shrink-0" />
      {showLabel && !collapsed && <span>Log out</span>}
    </button>
  );
}
