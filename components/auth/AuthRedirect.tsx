"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";
import { useThemeStore } from "@/lib/store/theme";

/** If workspace already set up, skip auth pages. */
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
    if (isSetup) {
      router.replace(defaultLanding);
      return;
    }
    router.replace("/onboarding");
  }, [hydrated, isAuthenticated, accessToken, isSetup, mode, router, defaultLanding]);

  return null;
}
