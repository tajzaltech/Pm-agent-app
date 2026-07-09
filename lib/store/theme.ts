"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeStore {
  defaultLanding: "/triage" | "/chat";
  setDefaultLanding: (path: "/triage" | "/chat") => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      defaultLanding: "/triage",
      setDefaultLanding: (defaultLanding) => set({ defaultLanding }),
    }),
    {
      name: "pm-agent-theme",
      merge: (persisted, current) => {
        const p = persisted as Partial<ThemeStore>;
        const landingRaw = p.defaultLanding as string | undefined;
        const landing =
          landingRaw === "/dashboard" || !landingRaw
            ? "/triage"
            : (landingRaw as ThemeStore["defaultLanding"]);
        return { ...current, ...p, defaultLanding: landing };
      },
    }
  )
);
