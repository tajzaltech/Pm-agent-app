import Link from "next/link";
import { Mail } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { PostAuthLink } from "@/components/auth/PostAuthLink";
import { GitHubLogo } from "@/components/shared/BrandLogos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to PM Agent"
      description="Continue reviewing draft tickets, code references, and delivery decisions from your workspace."
      footer={
        <>
          Do not have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <PostAuthLink
          href="/queue"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <GitHubLogo className="size-4" />
          Continue with GitHub
        </PostAuthLink>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" className="h-10" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" placeholder="Enter password" className="h-10" />
          </div>
          <PostAuthLink
            href="/queue"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            <Mail className="size-4" />
            Sign in
          </PostAuthLink>
        </form>
      </div>
    </AuthShell>
  );
}
