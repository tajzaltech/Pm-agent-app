"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IssueCategory, WorkspaceRole } from "@/lib/types";
import { useThemeStore } from "@/lib/store/theme";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | "indexing" | "done";
export type ProviderStatus = "idle" | "connecting" | "connected" | "error";

interface OnboardingStore {
  step: OnboardingStep;
  isSetup: boolean;
  signupInProgress: boolean;
  workspaceRole: WorkspaceRole | null;
  issueCategories: IssueCategory[];

  // Step 2: ticket source
  ticketSource: string | null;
  ticketSourceStatus: ProviderStatus;

  // Step 3: code repo
  repoProvider: string | null;
  repoProviderStatus: ProviderStatus;
  selectedRepos: string[];
  availableRepos: string[];

  // Step 4: output tool
  outputTool: string | null;
  outputToolStatus: ProviderStatus;
  selectedProject: string | null;

  // Indexing
  indexingStatus: "idle" | "running" | "done" | "error";
  indexingStep: string;

  // Actions
  setStep: (step: OnboardingStep) => void;
  setWorkspaceRole: (role: WorkspaceRole) => void;
  toggleIssueCategory: (cat: IssueCategory) => void;
  connectTicketSource: (provider: string) => Promise<void>;
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
      workspaceRole: null,
      issueCategories: ["bug", "how_to"],

      ticketSource: null,
      ticketSourceStatus: "idle",

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
        setDefaultLanding(role === "cs_agent" ? "/chat" : "/triage");
      },

      toggleIssueCategory: (cat) => {
        const { issueCategories } = get();
        set({
          issueCategories: issueCategories.includes(cat)
            ? issueCategories.filter((c) => c !== cat)
            : [...issueCategories, cat],
        });
      },

      connectTicketSource: async (provider) => {
        set({ ticketSource: provider, ticketSourceStatus: "connecting" });
        await new Promise((r) => setTimeout(r, 1800));
        set({ ticketSourceStatus: "connected" });
      },

      connectRepo: async (provider) => {
        set({ repoProvider: provider, repoProviderStatus: "connecting" });
        await new Promise((r) => setTimeout(r, 1800));
        set({ repoProviderStatus: "connected", selectedRepos: MOCK_REPOS.slice(0, 2) });
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
      },

      setSelectedProject: (project) => set({ selectedProject: project }),

      startIndexing: async () => {
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

      markSetupDone: () => set({ isSetup: true, signupInProgress: false }),

      beginSignup: () => {
        get().resetOnboarding();
        set({ signupInProgress: true, isSetup: false });
      },

      resetOnboarding: () =>
        set({
          step: 1,
          isSetup: false,
          signupInProgress: false,
          workspaceRole: null,
          issueCategories: ["bug", "how_to"],
          ticketSource: null,
          ticketSourceStatus: "idle",
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
      partialize: (state) => ({
        isSetup: state.isSetup,
        signupInProgress: state.signupInProgress,
        step: state.step,
        workspaceRole: state.workspaceRole,
      }),
    }
  )
);
