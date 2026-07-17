"use client";

import Link from "next/link";

import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";

type PostAuthLinkProps = React.ComponentProps<typeof Link>;

export function PostAuthLink({ href, ...props }: PostAuthLinkProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSetup = useOnboardingStore((state) => state.isSetup);
  const authHydrated = useAuthHydrated();
  const onboardingHydrated = useOnboardingHydrated();
  const hydrated = authHydrated && onboardingHydrated;

  const destination = !hydrated || !isAuthenticated ? "/signin" : !isSetup ? "/onboarding" : href;

  return <Link href={destination} {...props} />;
}
