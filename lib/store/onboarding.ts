"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IssueCategory, WorkspaceRole } from "@/lib/types";
import { DEFAULT_SOURCE_CATEGORIES } from "@/lib/constants/onboarding-sources";
import { useConnectionsStore } from "@/lib/store/connections";
import { useThemeStore } from "@/lib/store/theme";
import { syncOnboardingToConnections } from "@/lib/utils/sync-onboarding-connections";

export type OnboardingStep = 1 | 2 | 3 | 4 | "indexing" | "done";
export type ProviderStatus = "idle" | "connecting" | "connected" | "error";

export interface TicketSourceConfig {
  provider: string;
  status: ProviderStatus;
  issueCategories: IssueCategory[];
  accountLabel?: string;
  connectedAt?: string;
}

export interface OnboardingStore {
  step: OnboardingStep;
  isSetup: boolean;
  signupInProgress: boolean;
  workspaceRole: WorkspaceRole | null;

  ticketSources: TicketSourceConfig[];

  repoProvider: string | null;
  repoProviderStatus: ProviderStatus;
  selectedRepos: string[];
  availableRepos: string[];

  outputTool: string | null;
  outputToolStatus: ProviderStatus;
  selectedProject: string | null;

  indexingStatus: "idle" | "running" | "done" | "error";
  indexingStep: string;

  setStep: (step: OnboardingStep) => void;
  setWorkspaceRole: (role: WorkspaceRole) => void;
  connectTicketSource: (provider: string, accountLabel?: string) => Promise<void>;
  disconnectTicketSource: (provider: string) => void;
  toggleSourceIssueCategory: (provider: string, cat: IssueCategory) => void;
  connectRepo: (provider: string) => Promise<void>;
  toggleRepo: (repo: string) => void;
  connectOutputTool: (tool: string) => Promise<void>;
  setSelectedProject: (project: string) => void;
  startIndexing: () => void;
  markSetupDone: () => void;
  beginSignup: () => void;
  resetOnboarding: () => void;
}

const MOCK_REPOS = [
  "acmetech/api-backend",
  "acmetech/web-frontend",
  "acmetech/data-pipeline",
  "acmetech/mobile-legacy",
];

const MOCK_PROJECTS: Record<string, string[]> = {
  linear: ["Backend — Q3", "Frontend — Q3", "Infrastructure"],
  jira: ["BACK", "FRONT", "OPS"],
  monday: ["Development Board", "Sprint Board"],
  clickup: ["Engineering", "Platform"],
  github_issues: ["api-backend", "web-frontend"],
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      step: 1,
      isSetup: false,
      signupInProgress: false,
      workspaceRole: "pm",
      ticketSources: [],

      repoProvider: null,
      repoProviderStatus: "idle",
      selectedRepos: [],
      availableRepos: MOCK_REPOS,

      outputTool: null,
      outputToolStatus: "idle",
      selectedProject: null,

      indexingStatus: "idle",
      indexingStep: "",

      setStep: (step) => set({ step }),

      setWorkspaceRole: (role) => {
        set({ workspaceRole: role });
        const { setDefaultLanding } = useThemeStore.getState();
        setDefaultLanding(role === "cs_agent" ? "/chat" : "/pipeline");
      },

      connectTicketSource: async (provider, accountLabel) => {
        const existing = get().ticketSources.find((s) => s.provider === provider);
        const defaults = DEFAULT_SOURCE_CATEGORIES[provider] ?? ["bug", "how_to"];

        set({
          ticketSources: existing
            ? get().ticketSources.map((s) =>
                s.provider === provider ? { ...s, status: "connecting" as const } : s
              )
            : [
                ...get().ticketSources,
                { provider, status: "connecting" as const, issueCategories: [...defaults] },
              ],
        });

        await new Promise((r) => setTimeout(r, 200));

        set({
          ticketSources: get().ticketSources.map((s) =>
            s.provider === provider
              ? {
                  ...s,
                  status: "connected" as const,
                  accountLabel: accountLabel ?? s.accountLabel,
                  connectedAt: new Date().toISOString(),
                  issueCategories: s.issueCategories.length ? s.issueCategories : defaults,
                }
              : s
          ),
        });

        useConnectionsStore.getState().addSource(provider);
      },

      disconnectTicketSource: (provider) => {
        set({
          ticketSources: get().ticketSources.filter((s) => s.provider !== provider),
        });
        const conn = useConnectionsStore.getState();
        const match = conn.sources.find((s) => s.provider === provider);
        if (match) conn.removeSource(match.id);
      },

      toggleSourceIssueCategory: (provider, cat) => {
        set({
          ticketSources: get().ticketSources.map((s) => {
            if (s.provider !== provider) return s;
            const has = s.issueCategories.includes(cat);
            return {
              ...s,
              issueCategories: has
                ? s.issueCategories.filter((c) => c !== cat)
                : [...s.issueCategories, cat],
            };
          }),
        });
      },

      connectRepo: async (provider) => {
        set({ repoProvider: provider, repoProviderStatus: "connecting" });
        await new Promise((r) => setTimeout(r, 1800));
        const selected = MOCK_REPOS.slice(0, 2);
        set({
          repoProviderStatus: "connected",
          selectedRepos: selected,
        });
        for (const repo of selected) {
          useConnectionsStore.getState().addRepo(repo);
        }
      },

      toggleRepo: (repo) => {
        const { selectedRepos } = get();
        const isSelected = selectedRepos.includes(repo);
        set({
          selectedRepos: isSelected
            ? selectedRepos.filter((r) => r !== repo)
            : [...selectedRepos, repo],
        });
      },

      connectOutputTool: async (tool) => {
        set({ outputTool: tool, outputToolStatus: "connecting" });
        await new Promise((r) => setTimeout(r, 1800));
        const projects = MOCK_PROJECTS[tool] ?? ["Default Project"];
        set({
          outputToolStatus: "connected",
          selectedProject: projects[0],
        });
        useConnectionsStore.getState().addOutput(tool);
      },

      setSelectedProject: (project) => set({ selectedProject: project }),

      startIndexing: async () => {
        syncOnboardingToConnections(get());
        set({ step: "indexing", indexingStatus: "running" });

        const steps = [
          "Reading repository structure...",
          "Parsing functions and routes...",
          "Analyzing models and schemas...",
          "Building semantic map...",
          "Indexing complete.",
        ];

        for (const s of steps) {
          await new Promise((r) => setTimeout(r, 1200));
          set({ indexingStep: s });
        }

        await new Promise((r) => setTimeout(r, 800));
        set({ indexingStatus: "done", step: "done" });
      },

      markSetupDone: () => {
        syncOnboardingToConnections(get());
        set({ isSetup: true, signupInProgress: false });
      },

      beginSignup: () => {
        get().resetOnboarding();
        useThemeStore.getState().setDefaultLanding("/pipeline");
        set({ signupInProgress: true, isSetup: false, workspaceRole: "pm" });
      },

      resetOnboarding: () =>
        set({
          step: 1,
          isSetup: false,
          signupInProgress: false,
          workspaceRole: "pm",
          ticketSources: [],
          repoProvider: null,
          repoProviderStatus: "idle",
          selectedRepos: [],
          outputTool: null,
          outputToolStatus: "idle",
          selectedProject: null,
          indexingStatus: "idle",
          indexingStep: "",
        }),
    }),
    {
      name: "pm-agent-setup",
      merge: (persisted, current) => {
        const p = persisted as Partial<
          OnboardingStore & { ticketSource?: string; issueCategories?: IssueCategory[]; flowVersion?: number }
        >;
        const ticketSources =
          p.ticketSources ??
          (p.ticketSource
            ? [
                {
                  provider: p.ticketSource,
                  status: "connected" as const,
                  issueCategories: p.issueCategories ?? ["bug", "how_to"],
                },
              ]
            : current.ticketSources);

        let step = p.step ?? current.step;
        const flowVersion = p.flowVersion ?? 1;
        if (flowVersion < 2 && typeof step === "number" && step >= 2 && step <= 5) {
          step = Math.min(step - 1, 4) as OnboardingStep;
        }

        return {
          ...current,
          ...p,
          ticketSources,
          step,
          flowVersion: 2,
          workspaceRole: p.workspaceRole ?? current.workspaceRole ?? "pm",
        };
      },
      partialize: (state) => ({
        isSetup: state.isSetup,
        signupInProgress: state.signupInProgress,
        step: state.step,
        flowVersion: 2,
        workspaceRole: state.workspaceRole,
        ticketSources: state.ticketSources,
        repoProvider: state.repoProvider,
        repoProviderStatus: state.repoProviderStatus,
        selectedRepos: state.selectedRepos,
        outputTool: state.outputTool,
        outputToolStatus: state.outputToolStatus,
        selectedProject: state.selectedProject,
      }),
    }
  )
);
