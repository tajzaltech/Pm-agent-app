"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEV_AGENT_ID, OUTPUT_CATALOG, SOURCE_CATALOG } from "@/lib/constants/connections-catalog";
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
  addRepo: (fullName: string, accessToken?: string) => void;
  removeRepo: (id: string) => void;
  addOutput: (provider: string, opts?: { apiKey?: string; teamId?: string; project?: string }) => void;
  removeOutput: (id: string) => void;
  setDevAgentEnabled: (on: boolean) => void;
}

export const useConnectionsStore = create<ConnectionsStore>()(
  persist(
    (set, get) => ({
      editMode: false,
      sources: [],
      outputs: [],
      repos: [],
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
          ticketCount: 0,
          connectedAt: new Date().toISOString(),
        };
        set((s) => ({ sources: [...s.sources, integration] }));
        void import("@/lib/api-client").then(({ api }) => api.addSource(provider).catch(() => undefined));
      },

      removeSource: (id) => {
        set((s) => ({ sources: s.sources.filter((x) => x.id !== id) }));
        void import("@/lib/api-client").then(({ api }) => api.removeSource(id).catch(() => undefined));
      },

      addRepo: (fullName, accessToken) => {
        const name = fullName.split("/")[1] ?? fullName;
        if (get().repos.some((r) => r.fullName === fullName)) return;
        const repo: Repo = {
          id: `repo_${Date.now()}`,
          platform: "github",
          name,
          fullName,
          status: "indexing",
          lastIndexed: new Date().toISOString(),
          selected: true,
        };
        set((s) => ({ repos: [...s.repos, repo] }));
        void import("@/lib/api-client").then(({ api }) =>
          api.addRepo(fullName, "github", accessToken).then((created) => {
            set((s) => ({
              repos: s.repos.map((r) => (r.fullName === fullName ? created : r)),
            }));
          }).catch(() => undefined),
        );
      },

      removeRepo: (id) => {
        set((s) => ({ repos: s.repos.filter((x) => x.id !== id) }));
        void import("@/lib/api-client").then(({ api }) => api.removeRepo(id).catch(() => undefined));
      },

      addOutput: (provider, opts) => {
        const catalog = OUTPUT_CATALOG.find((o) => o.id === provider);
        if (!catalog) return;
        if (get().outputs.some((o) => o.provider === provider)) return;
        const integration: Integration = {
          id: `out_${provider}_${Date.now()}`,
          type: "output",
          provider,
          name: catalog.name,
          status: "connected",
          ticketCount: 0,
          targetProject: opts?.project ?? catalog.defaultProject,
          connectedAt: new Date().toISOString(),
        };
        set((s) => ({ outputs: [...s.outputs, integration] }));
        void import("@/lib/api-client").then(({ api }) =>
          api.addOutput(provider, { apiKey: opts?.apiKey, teamId: opts?.teamId, project: opts?.project }).catch(() => undefined),
        );
      },

      removeOutput: (id) => {
        set((s) => ({ outputs: s.outputs.filter((x) => x.id !== id) }));
        void import("@/lib/api-client").then(({ api }) => api.removeOutput(id).catch(() => undefined));
      },

      setDevAgentEnabled: (devAgentEnabled) => {
        set({ devAgentEnabled });
        void import("@/lib/api-client").then(({ api }) => api.setDevAgent(devAgentEnabled).catch(() => undefined));
      },
    }),
    { name: "pm-agent-connections-v2" }
  )
);

export { DEV_AGENT_ID };
