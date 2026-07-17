"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";

/**
 * App routes require a completed workspace.
 * Incomplete setup → sign in (returning users skip onboarding).
 * New users must use /signup first.
 */
export function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSetup = useOnboardingStore((state) => state.isSetup);
  const authHydrated = useAuthHydrated();
  const onboardingHydrated = useOnboardingHydrated();
  const hydrated = authHydrated && onboardingHydrated;

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace("/signin");
    } else if (!isSetup) {
      router.replace("/onboarding");
    }
  }, [hydrated, isAuthenticated, isSetup, router]);

  if (!hydrated || !isAuthenticated || !isSetup) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
