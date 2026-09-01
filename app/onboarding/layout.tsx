"use client";

import { OnboardingGuard } from "@/components/onboarding/OnboardingGuard";
import { ApiHydrator } from "@/components/shared/ApiHydrator";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGuard>
      <ApiHydrator />
      {children}
    </OnboardingGuard>
  );
}
