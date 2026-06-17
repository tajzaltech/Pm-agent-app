import Link from "next/link";
import { UserPlus } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { GitHubLogo } from "@/components/shared/BrandLogos";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
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
      <div className="space-y-4">
        <Link
          href="/onboarding"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <GitHubLogo className="size-4" />
          Sign up with GitHub
        </Link>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Alex Morgan" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Inc" className="h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Create a strong password" className="h-10" />
          </div>
          <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Checkbox className="mt-0.5 size-4" />
            <span>I agree to receive product emails and accept the workspace terms.</span>
          </label>
          <Link
            href="/onboarding"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            <UserPlus className="size-4" />
            Create account
          </Link>
        </form>
      </div>
    </AuthShell>
  );
}
