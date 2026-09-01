"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "@/lib/api-client";
import { clearSession, setSession } from "@/lib/api-client/session";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { usePmChatStore } from "@/lib/store/pm-chat";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  workspaceId: string | null;
  signIn: (user?: Partial<AuthUser>) => void;
  applySession: (input: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    workspaceId?: string | null;
  }) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; company: string }) => Promise<void>;
  loginWithGoogle: (code: string, company?: string) => Promise<void>;
  signOut: () => void;
}

function syncSession(state: {
  accessToken: string | null;
  refreshToken: string | null;
  workspaceId: string | null;
}) {
  setSession({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    workspaceId: state.workspaceId,
  });
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      workspaceId: null,

      applySession: ({ accessToken, refreshToken, user, workspaceId }) => {
        syncSession({ accessToken, refreshToken, workspaceId: workspaceId ?? null });
        set({
          isAuthenticated: true,
          user,
          accessToken,
          refreshToken,
          workspaceId: workspaceId ?? null,
        });
      },

      signIn: (user) => {
        set({
          isAuthenticated: true,
          user: { name: "Demo User", email: "demo@pmagent.io", ...user },
        });
        usePmChatStore.getState().startFreshSession();
      },

      login: async (email, password) => {
        const session = await api.signin({ email, password });
        get().applySession({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: { id: session.user.id, name: session.user.name, email: session.user.email },
          workspaceId: session.user.defaultWorkspaceId,
        });
        try {
          const onboarding = await api.getOnboarding();
          useOnboardingStore.setState({
            isSetup: onboarding.isSetup,
            workspaceRole: onboarding.workspaceRole,
            ticketSources: onboarding.ticketSources,
            repoProvider: onboarding.repoProvider,
            repoProviderStatus: onboarding.repoProviderStatus,
            selectedRepos: onboarding.selectedRepos,
            outputTool: onboarding.outputTool,
            outputToolStatus: onboarding.outputToolStatus,
            selectedProject: onboarding.selectedProject,
          });
        } catch {
          /* onboarding fetch is best-effort after login */
        }
        usePmChatStore.getState().startFreshSession();
      },

      register: async (input) => {
        const session = await api.signup(input);
        get().applySession({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: { id: session.user.id, name: session.user.name, email: session.user.email },
          workspaceId: session.user.defaultWorkspaceId,
        });
        useOnboardingStore.getState().beginSignup();
      },

      loginWithGoogle: async (code, company) => {
        const session = await api.googleAuth({ code, company: company || undefined });
        get().applySession({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: { id: session.user.id, name: session.user.name, email: session.user.email },
          workspaceId: session.user.defaultWorkspaceId,
        });
        try {
          const onboarding = await api.getOnboarding();
          if (onboarding.isSetup) {
            useOnboardingStore.setState({
              isSetup: onboarding.isSetup,
              workspaceRole: onboarding.workspaceRole,
              ticketSources: onboarding.ticketSources,
              repoProvider: onboarding.repoProvider,
              repoProviderStatus: onboarding.repoProviderStatus,
              selectedRepos: onboarding.selectedRepos,
              outputTool: onboarding.outputTool,
              outputToolStatus: onboarding.outputToolStatus,
              selectedProject: onboarding.selectedProject,
            });
          } else {
            useOnboardingStore.getState().beginSignup();
          }
        } catch {
          useOnboardingStore.getState().beginSignup();
        }
        usePmChatStore.getState().startFreshSession();
      },

      signOut: () => {
        void api.signout();
        clearSession();
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          workspaceId: null,
        });
      },
    }),
    {
      name: "pm-agent-auth",
      version: 2,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        workspaceId: state.workspaceId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        syncSession({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          workspaceId: state.workspaceId,
        });
      },
    }
  )
);
