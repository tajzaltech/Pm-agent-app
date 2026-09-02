"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFromUnknown } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth";

export function SignUpForm() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [pending, setPending] = useState(false);
  const [company, setCompany] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const actionUrl = await register({
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        password: String(data.get("password") || ""),
        company: String(data.get("company") || "").trim(),
      });
      router.push(actionUrl || "/onboarding");
    } catch (error) {
      toast.error(messageFromUnknown(error, "Could not create account"));
    } finally {
      setPending(false);
    }
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
        <GoogleAuthButton mode="signup" company={company} />

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
              <Input
                id="company"
                name="company"
                required
                placeholder="Acme Inc"
                className="h-10"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
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
            disabled={pending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <UserPlus className="size-4" />
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
