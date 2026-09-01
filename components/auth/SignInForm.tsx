"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFromUnknown } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useThemeStore } from "@/lib/store/theme";

export function SignInForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const defaultLanding = useThemeStore((state) => state.defaultLanding);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    setPending(true);
    try {
      await login(email, password);
      router.replace(useOnboardingStore.getState().isSetup ? defaultLanding : "/onboarding");
      router.refresh();
    } catch (error) {
      toast.error(messageFromUnknown(error, "Could not sign in"));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <AuthRedirect mode="signin" />
      <div className="space-y-4">
      <GoogleAuthButton mode="signin" className="bg-white" />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-4" autoComplete="on" data-lpignore="false" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
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
            required
            autoComplete="current-password"
            placeholder="Enter password"
            className="h-10"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-60"
        >
          <Mail className="size-4" />
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
    </>
  );
}
