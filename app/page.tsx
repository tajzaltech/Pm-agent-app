"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";
import { useThemeStore } from "@/lib/store/theme";
import { LandingPage } from "@/components/marketing/LandingPage";

export default function Home() {
  const router = useRouter();
  const authHydrated = useAuthHydrated();
  const onboardingHydrated = useOnboardingHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSetup = useOnboardingStore((state) => state.isSetup);
  const defaultLanding = useThemeStore((state) => state.defaultLanding);

  useEffect(() => {
    if (!authHydrated || !onboardingHydrated || !isAuthenticated) return;

    if (!isSetup) {
      router.replace("/onboarding");
    } else {
      router.replace(defaultLanding);
    }
  }, [authHydrated, onboardingHydrated, isAuthenticated, isSetup, defaultLanding, router]);

  if (!authHydrated || !onboardingHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div aria-label="Loading" className="flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div aria-label="Loading" className="flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  return <LandingPage />;
}
