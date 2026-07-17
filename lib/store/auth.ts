"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (user?: Partial<AuthUser>) => void;
  signOut: () => void;
}

const DEMO_USER: AuthUser = {
  name: "Demo User",
  email: "demo@pmagent.io",
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      signIn: (user) =>
        set({
          isAuthenticated: true,
          user: { ...DEMO_USER, ...user },
        }),
      signOut: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: "pm-agent-auth",
      version: 1,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
