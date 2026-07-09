"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";
import { useThemeStore } from "@/lib/store/theme";

/** If workspace already set up, skip auth pages. */
export function AuthRedirect({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const hydrated = useOnboardingHydrated();
  const isSetup = useOnboardingStore((s) => s.isSetup);
  const signupInProgress = useOnboardingStore((s) => s.signupInProgress);
  const defaultLanding = useThemeStore((s) => s.defaultLanding);

  useEffect(() => {
    if (!hydrated) return;
    if (isSetup) {
      router.replace(defaultLanding);
      return;
    }
    if (mode === "signin" && signupInProgress) {
      router.replace("/onboarding");
    }
  }, [hydrated, isSetup, signupInProgress, mode, router, defaultLanding]);

  return null;
}
