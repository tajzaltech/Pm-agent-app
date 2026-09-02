"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";
import { useThemeStore } from "@/lib/store/theme";

/** Skip auth pages only when the stored session is still valid. */
export function AuthRedirect({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const authHydrated = useAuthHydrated();
  const onboardingHydrated = useOnboardingHydrated();
  const hydrated = authHydrated && onboardingHydrated;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isSetup = useOnboardingStore((s) => s.isSetup);
  const defaultLanding = useThemeStore((s) => s.defaultLanding);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !accessToken) return;
    let cancelled = false;
    api
      .me()
      .then(() => {
        if (cancelled) return;
        router.replace(isSetup ? defaultLanding : "/onboarding");
      })
      .catch(() => {
        if (cancelled) return;
        useAuthStore.getState().signOut();
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, accessToken, isSetup, mode, router, defaultLanding]);

  return null;
}
