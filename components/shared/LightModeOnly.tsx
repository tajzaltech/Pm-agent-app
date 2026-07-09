"use client";

import { useEffect } from "react";

/** Keeps the app in light mode only (dark mode removed). */
export function LightModeOnly({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return <>{children}</>;
}
