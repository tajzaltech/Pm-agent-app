"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { messageFromUnknown } from "@/lib/api-client";
import { takeGoogleOAuthIntent } from "@/lib/google-auth";
import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useThemeStore } from "@/lib/store/theme";

export function GoogleCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useAuthHydrated();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const defaultLanding = useThemeStore((state) => state.defaultLanding);
  const started = useRef(false);

  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;

    const error = params.get("error");
    const code = params.get("code");
    const state = params.get("state");
    const fallback = "/signin";

    if (error) {
      toast.error(error === "access_denied" ? "Gmail sign-in was cancelled" : "Gmail sign-in failed");
      router.replace(fallback);
      return;
    }
    if (!code) {
      toast.error("Gmail sign-in did not return an authorization code");
      router.replace(fallback);
      return;
    }

    const intent = takeGoogleOAuthIntent(state);
    if (!intent) {
      toast.error("Gmail sign-in expired. Try again.");
      router.replace(fallback);
      return;
    }

    void loginWithGoogle(code, intent.company)
      .then(() => {
        const destination =
          intent.mode === "signup"
            ? "/onboarding"
            : useOnboardingStore.getState().isSetup
              ? defaultLanding
              : "/onboarding";
        router.replace(destination);
        router.refresh();
      })
      .catch((cause) => {
        toast.error(messageFromUnknown(cause, "Could not continue with Gmail"));
        router.replace(intent.mode === "signup" ? "/signup" : "/signin");
      });
  }, [defaultLanding, hydrated, loginWithGoogle, params, router]);

  return <p className="text-sm text-muted-foreground">Connecting your Gmail account…</p>;
}
