"use client";

import { useState } from "react";
import { toast } from "sonner";

import { GmailLogo } from "@/components/shared/BrandLogos";
import { getConfig } from "@/lib/config";
import { startGoogleOAuth } from "@/lib/google-auth";
import { cn } from "@/lib/utils";

interface GoogleAuthButtonProps {
  mode: "signin" | "signup";
  company?: string;
  className?: string;
}

export function GoogleAuthButton({ mode, company, className }: GoogleAuthButtonProps) {
  const [pending, setPending] = useState(false);

  const handleClick = () => {
    const clientId = getConfig().googleClientId.trim();
    if (!clientId) {
      toast.error("Gmail sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID and restart the app.");
      return;
    }
    setPending(true);
    startGoogleOAuth({ clientId, mode, company });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60",
        className
      )}
    >
      <GmailLogo className="size-4" />
      {pending
        ? "Redirecting to Gmail…"
        : mode === "signup"
          ? "Sign up with Gmail"
          : "Sign in with Gmail"}
    </button>
  );
}
