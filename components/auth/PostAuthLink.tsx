"use client";

import Link from "next/link";

import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingHydrated } from "@/lib/store/use-onboarding-hydrated";

type PostAuthLinkProps = React.ComponentProps<typeof Link>;

export function PostAuthLink({ href, ...props }: PostAuthLinkProps) {
  const isSetup = useOnboardingStore((state) => state.isSetup);
  const hydrated = useOnboardingHydrated();

  const destination = hydrated && !isSetup ? "/onboarding" : href;

  return <Link href={destination} {...props} />;
}
