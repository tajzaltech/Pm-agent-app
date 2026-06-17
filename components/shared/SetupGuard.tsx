"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isSetup = useOnboardingStore((state) => state.isSetup);
  const hydrated = useOnboardingHydrated();

  useEffect(() => {
    if (hydrated && !isSetup) {
      router.replace("/onboarding");
    }
  }, [hydrated, isSetup, router]);

  if (!hydrated || !isSetup) {
    return null;
  }

  return <>{children}</>;
}
