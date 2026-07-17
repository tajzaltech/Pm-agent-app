"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { GitHubLogo } from "@/components/shared/BrandLogos";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth";
import { useOnboardingStore } from "@/lib/store/onboarding";

export function SignUpForm() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const beginSignup = useOnboardingStore((state) => state.beginSignup);

  const startOnboarding = (user?: { name?: string; email?: string }) => {
    beginSignup();
    signIn(user);
    router.push("/onboarding");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startOnboarding({
      name: String(data.get("name") || "Demo User"),
      email: String(data.get("email") || "demo@pmagent.io"),
    });
  };

  return (
    <AuthShell
      eyebrow="Create workspace"
      title="Start your PM Agent account"
      description="Set up a review workspace for support tickets, repository context, and delivery output."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AuthRedirect mode="signup" />
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => startOnboarding()}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <GitHubLogo className="size-4" />
          Sign up with GitHub
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Alex Morgan" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" required placeholder="Acme Inc" className="h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" required type="email" placeholder="you@company.com" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" required minLength={8} type="password" placeholder="Create a strong password" className="h-10" />
          </div>
          <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Checkbox required className="mt-0.5 size-4" />
            <span>I agree to receive product emails and accept the workspace terms.</span>
          </label>
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <UserPlus className="size-4" />
            Create account
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
