import Link from "next/link";
import { KeyRound } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="New password"
      title="Choose a new password"
      description="Use a strong password so your review workspace and integrations stay protected."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
      sideTitle="Secure your PM Agent workspace."
    >
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" placeholder="Enter new password" className="h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input id="confirm-password" type="password" placeholder="Confirm new password" className="h-10" />
        </div>
        <Link
          href="/signin"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <KeyRound className="size-4" />
          Update password
        </Link>
      </form>
    </AuthShell>
  );
}
