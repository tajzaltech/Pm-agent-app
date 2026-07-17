"use client";

import { useAuthStore } from "@/lib/store/auth";

/** End the browser session while preserving the user's workspace setup. */
export function signOut() {
  useAuthStore.getState().signOut();
  window.location.replace("/signin");
}
