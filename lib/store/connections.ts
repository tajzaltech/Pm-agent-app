"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEV_AGENT_ID,
  OUTPUT_CATALOG,
  REPO_CATALOG,
  SOURCE_CATALOG,
} from "@/lib/constants/connections-catalog";
import { MOCK_INTEGRATIONS, MOCK_REPOS } from "@/lib/mock/integrations";
import type { Integration, Repo } from "@/lib/types";

interface ConnectionsStore {
  editMode: boolean;
  sources: Integration[];
  outputs: Integration[];
  repos: Repo[];
  devAgentEnabled: boolean;
  setEditMode: (on: boolean) => void;
  addSource: (provider: string) => void;
  removeSource: (id: string) => void;
  addRepo: (fullName: string) => void;
  removeRepo: (id: string) => void;
  addOutput: (provider: string) => void;
  removeOutput: (id: string) => void;
  setDevAgentEnabled: (on: boolean) => void;
}

function defaultSources(): Integration[] {
  return MOCK_INTEGRATIONS.filter((i) => i.type === "source");
}

function defaultOutputs(): Integration[] {
  return MOCK_INTEGRATIONS.filter((i) => i.type === "output");
}

function defaultRepos(): Repo[] {
  return MOCK_REPOS.filter((r) => r.selected);
}

export const useConnectionsStore = create<ConnectionsStore>()(
  persist(
    (set, get) => ({
      editMode: false,
      sources: defaultSources(),
      outputs: defaultOutputs(),
      repos: defaultRepos(),
      devAgentEnabled: true,

      setEditMode: (editMode) => set({ editMode }),

      addSource: (provider) => {
        const catalog = SOURCE_CATALOG.find((s) => s.id === provider);
        if (!catalog) return;
        if (get().sources.some((s) => s.provider === provider)) return;
        const integration: Integration = {
          id: `src_${provider}_${Date.now()}`,
          type: "source",
          provider,
          name: catalog.name,
          status: "connected",
          ticketCount: Math.floor(200 + Math.random() * 600),
          connectedAt: new Date().toISOString(),
        };
        set((s) => ({ sources: [...s.sources, integration] }));
      },

      removeSource: (id) => {
        set((s) => ({ sources: s.sources.filter((x) => x.id !== id) }));
      },

      addRepo: (fullName) => {
        const catalog = REPO_CATALOG.find((r) => r.fullName === fullName);
        if (!catalog) return;
        if (get().repos.some((r) => r.fullName === fullName)) return;
        const repo: Repo = {
          id: `repo_${Date.now()}`,
          platform: "github",
          name: catalog.name,
          fullName: catalog.fullName,
          status: "indexed",
          lastIndexed: new Date().toISOString(),
          selected: true,
        };
        set((s) => ({ repos: [...s.repos, repo] }));
      },

      removeRepo: (id) => {
        set((s) => ({ repos: s.repos.filter((x) => x.id !== id) }));
      },

      addOutput: (provider) => {
        const catalog = OUTPUT_CATALOG.find((o) => o.id === provider);
        if (!catalog) return;
        if (get().outputs.some((o) => o.provider === provider)) return;
        const integration: Integration = {
          id: `out_${provider}_${Date.now()}`,
          type: "output",
          provider,
          name: catalog.name,
          status: "connected",
          ticketCount: Math.floor(20 + Math.random() * 80),
          targetProject: catalog.defaultProject,
          connectedAt: new Date().toISOString(),
        };
        set((s) => ({ outputs: [...s.outputs, integration] }));
      },

      removeOutput: (id) => {
        set((s) => ({ outputs: s.outputs.filter((x) => x.id !== id) }));
      },

      setDevAgentEnabled: (devAgentEnabled) => set({ devAgentEnabled }),
    }),
    {
      name: "pm-agent-connections",
      merge: (persisted, current) => {
        const p = persisted as Partial<ConnectionsStore>;
        return {
          ...current,
          ...p,
          sources: p.sources?.length ? p.sources : current.sources,
          outputs: p.outputs?.length ? p.outputs : current.outputs,
          repos: p.repos?.length ? p.repos : current.repos,
          devAgentEnabled: p.devAgentEnabled ?? current.devAgentEnabled,
        };
      },
    }
  )
);

export { DEV_AGENT_ID };
