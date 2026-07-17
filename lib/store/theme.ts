"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeStore {
  defaultLanding: string;
  setDefaultLanding: (path: string) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      defaultLanding: "/pipeline",
      setDefaultLanding: (defaultLanding) => set({ defaultLanding }),
    }),
    {
      name: "pm-agent-theme",
      merge: (persisted, current) => {
        const saved = (persisted as Partial<ThemeStore>)?.defaultLanding;
        const defaultLanding = saved === "/chat" || saved === "/pipeline" ? saved : "/pipeline";
        return { ...current, ...(persisted as Partial<ThemeStore>), defaultLanding };
      },
    }
  )
);
