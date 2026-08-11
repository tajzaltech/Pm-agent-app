import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to PM Agent"
      description="Continue reviewing draft tickets, code references, and delivery decisions from your workspace."
      footer={
        <>
          <Link href="/" className="mb-3 inline-flex font-medium text-primary hover:underline">
            ← Back to home
          </Link>
          <br />
          Do not have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
