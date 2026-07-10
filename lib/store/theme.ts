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
      defaultLanding: "/chat",
      setDefaultLanding: (defaultLanding) => set({ defaultLanding }),
    }),
    {
      name: "pm-agent-theme",
      merge: (persisted, current) => {
        return { ...current, ...(persisted as Partial<ThemeStore>), defaultLanding: "/chat" };
      },
    }
  )
);
