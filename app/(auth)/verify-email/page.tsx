import Link from "next/link";
import { MailCheck, RefreshCcw } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      eyebrow="Verify email"
      title="Check your inbox"
      description="We sent a verification link to your email. Open it to activate your workspace and continue setup."
      footer={
        <>
          Wrong email?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create account again
          </Link>
        </>
      }
      sideTitle="One quick verification before setup."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border bg-primary/[0.03] p-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="size-7" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">Verification link sent</p>
          <p className="mt-1 text-xs text-muted-foreground">It may take a minute to arrive.</p>
        </div>
        <Button className="h-10 w-full gap-2">
          <RefreshCcw className="size-4" />
          Resend email
        </Button>
        <Link
          href="/onboarding"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-white px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Continue after verification
        </Link>
      </div>
    </AuthShell>
  );
}
