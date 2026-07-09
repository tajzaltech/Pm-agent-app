"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeMode } from "@/lib/types";

interface ThemeStore {
  mode: ThemeMode;
  density: "comfortable" | "compact";
  defaultLanding: "/triage" | "/chat";
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setDensity: (d: "comfortable" | "compact") => void;
  setDefaultLanding: (path: "/triage" | "/chat") => void;
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: "light",
      density: "comfortable",
      defaultLanding: "/triage",
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode });
      },
      toggleMode: () => {
        const next = get().mode === "light" ? "dark" : "light";
        applyTheme(next);
        set({ mode: next });
      },
      setDensity: (density) => set({ density }),
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
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode);
      },
    }
  )
);
