"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";

/**
 * App routes require a completed workspace.
 * Incomplete setup → sign in (returning users skip onboarding).
 * New users must use /signup first.
 */
export function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isSetup = useOnboardingStore((state) => state.isSetup);
  const hydrated = useOnboardingHydrated();

  useEffect(() => {
    if (hydrated && !isSetup) {
      router.replace("/signin");
    }
  }, [hydrated, isSetup, router]);

  if (!hydrated || !isSetup) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
