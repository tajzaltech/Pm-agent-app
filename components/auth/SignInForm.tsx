"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { SignInButton } from "@/components/auth/SignInButton";
import { GitHubLogo } from "@/components/shared/BrandLogos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-10 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-4 bg-muted/30 rounded animate-pulse w-1/3 mx-auto" />
        <div className="space-y-4">
          <div className="h-[68px] rounded-lg bg-muted/30 animate-pulse" />
          <div className="h-[68px] rounded-lg bg-muted/30 animate-pulse" />
          <div className="h-10 rounded-lg bg-muted/40 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthRedirect mode="signin" />
      <div className="space-y-4">
      <SignInButton className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium transition-colors hover:bg-muted">
        <GitHubLogo className="size-4" />
        Continue with GitHub
      </SignInButton>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-4" autoComplete="on" data-lpignore="false">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter password"
            className="h-10"
          />
        </div>
        <SignInButton className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">
          <Mail className="size-4" />
          Sign in
        </SignInButton>
      </form>
    </div>
    </>
  );
}
