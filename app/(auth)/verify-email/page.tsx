"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MailCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { api, messageFromUnknown } from "@/lib/api-client";

function VerifyEmailStatus() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">(token ? "pending" : "idle");
  const [message, setMessage] = useState("Open the link from your email to activate this account.");

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    api
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) {
          setStatus("ok");
          setMessage("Email verified. You can continue to your workspace.");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus("error");
          setMessage(messageFromUnknown(error, "This verification link is invalid or expired."));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="rounded-2xl border bg-primary/[0.03] p-5 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck className="size-7" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">
        {status === "pending" ? "Verifying…" : status === "ok" ? "Email verified" : "Check your inbox"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      eyebrow="Verify email"
      title="Confirm your email"
      description="Open the verification link we sent, or continue once your inbox confirms this address."
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
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <VerifyEmailStatus />
        </Suspense>
        <Link
          href="/onboarding"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-white px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Continue
        </Link>
      </div>
    </AuthShell>
  );
}
