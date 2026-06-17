import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your workspace email and we will send a secure password reset link."
      footer={
        <Link href="/signin" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      }
      sideTitle="Recover access without losing review context."
    >
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" className="h-10" />
        </div>
        <Link
          href="/reset-password"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <Send className="size-4" />
          Send reset link
        </Link>
      </form>
    </AuthShell>
  );
}
