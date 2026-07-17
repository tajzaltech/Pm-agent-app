"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { GitHubLogo } from "@/components/shared/BrandLogos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useThemeStore } from "@/lib/store/theme";

export function SignInForm() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const isSetup = useOnboardingStore((state) => state.isSetup);
  const markSetupDone = useOnboardingStore((state) => state.markSetupDone);
  const defaultLanding = useThemeStore((state) => state.defaultLanding);

  const completeSignIn = (email = "demo@pmagent.io") => {
    signIn({ email });
    if (!isSetup) markSetupDone();
    router.replace(defaultLanding);
    router.refresh();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    completeSignIn(String(data.get("email") || "demo@pmagent.io"));
  };

  return (
    <>
      <AuthRedirect mode="signin" />
      <div className="space-y-4">
      <button
        type="button"
        onClick={() => completeSignIn()}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium transition-colors hover:bg-muted"
      >
        <GitHubLogo className="size-4" />
        Continue with GitHub
      </button>

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
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <Mail className="size-4" />
          Sign in
        </button>
      </form>
    </div>
    </>
  );
}
