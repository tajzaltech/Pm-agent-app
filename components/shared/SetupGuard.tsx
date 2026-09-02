"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSetup = useOnboardingStore((state) => state.isSetup);
  const authHydrated = useAuthHydrated();
  const onboardingHydrated = useOnboardingHydrated();
  const hydrated = authHydrated && onboardingHydrated;
  const signedIn = isAuthenticated && Boolean(accessToken);

  useEffect(() => {
    if (!hydrated) return;
    if (!signedIn) {
      router.replace("/signin");
      return;
    }
    if (!isSetup) {
      router.replace("/onboarding");
    }
  }, [hydrated, signedIn, isSetup, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
        <Link href="/signin" className="text-sm font-medium text-primary hover:underline">
          Continue to sign in
        </Link>
      </div>
    );
  }

  if (!isSetup) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <p className="text-sm text-muted-foreground">Finish workspace setup to continue.</p>
        <Link href="/onboarding" className="text-sm font-medium text-primary hover:underline">
          Open onboarding
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
