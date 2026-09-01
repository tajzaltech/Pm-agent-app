import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleCallback } from "@/components/auth/GoogleCallback";

export default function GoogleCallbackPage() {
  return (
    <AuthShell
      eyebrow="Gmail"
      title="Signing you in"
      description="Finishing Google sign-in and returning you to Ask PM."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Connecting your Gmail account…</p>}>
        <GoogleCallback />
      </Suspense>
    </AuthShell>
  );
}
