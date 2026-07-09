"use client";

import { useOnboardingStore } from "@/lib/store/onboarding";

/** Clear workspace session and hard-navigate to sign-in (full refresh). */
export function signOut() {
  useOnboardingStore.getState().resetOnboarding();
  window.location.assign("/signin");
}
