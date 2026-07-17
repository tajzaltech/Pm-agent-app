"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";
import { useThemeStore } from "@/lib/store/theme";

/**
 * Onboarding is signup-only.
 * - /signup → beginSignup() → allowed here
 * - /signin → skips onboarding entirely
 * - Direct /onboarding URL without signup → /signup
 * - Completed workspace → app home
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authHydrated = useAuthHydrated();
  const onboardingHydrated = useOnboardingHydrated();
  const hydrated = authHydrated && onboardingHydrated;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSetup = useOnboardingStore((s) => s.isSetup);
  const step = useOnboardingStore((s) => s.step);
  const defaultLanding = useThemeStore((s) => s.defaultLanding);

  const finishing = step === "indexing" || step === "done";
  const redirectToApp = hydrated && isAuthenticated && isSetup && !finishing;
  const redirectToSignup = hydrated && !isAuthenticated;

  useEffect(() => {
    if (redirectToApp) {
      router.replace(defaultLanding);
    } else if (redirectToSignup) {
      router.replace("/signup");
    }
  }, [redirectToApp, redirectToSignup, router, defaultLanding]);

  if (!hydrated || redirectToApp || redirectToSignup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
