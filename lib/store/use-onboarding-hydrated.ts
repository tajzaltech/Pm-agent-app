"use client";

import { useSyncExternalStore } from "react";

import { useOnboardingStore } from "@/lib/store/onboarding";

export function useOnboardingHydrated() {
  return useSyncExternalStore(
    (callback) => useOnboardingStore.persist.onFinishHydration(callback),
    () => useOnboardingStore.persist.hasHydrated(),
    () => true
  );
}
