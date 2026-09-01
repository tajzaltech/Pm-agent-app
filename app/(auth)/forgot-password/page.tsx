"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, messageFromUnknown } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    setPending(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
      toast.success("If that account exists, a reset email was sent");
    } catch (error) {
      toast.error(messageFromUnknown(error, "Could not send reset email"));
    } finally {
      setPending(false);
    }
  };

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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@company.com" className="h-10" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-60"
        >
          <Send className="size-4" />
          {sent ? "Email sent" : pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
