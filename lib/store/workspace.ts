"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setSession } from "@/lib/api-client/session";
import type { Workspace } from "@/lib/mock/workspaces";
import type { WorkspaceData } from "@/lib/mock/workspaces";

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setActiveWorkspace: (id: string) => void;
  getActiveWorkspace: () => Workspace;
  getActiveData: () => WorkspaceData;
}

const EMPTY_WORKSPACE: Workspace = {
  id: "",
  name: "Workspace",
  initials: "WS",
  description: "",
  color: "bg-violet-500",
  gradient: ["#7C3AED", "#6366F1"],
};

const EMPTY_DATA: WorkspaceData = { tickets: [], activity: [], connections: [] };

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: "",

      setActiveWorkspace: (id) => {
        const exists = get().workspaces.some((w) => w.id === id);
        if (!exists) return;
        set({ activeWorkspaceId: id });
        setSession({ workspaceId: id });
        void import("@/lib/api-client/hydrate").then(({ hydrateWorkspace }) => hydrateWorkspace());
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? EMPTY_WORKSPACE;
      },

      getActiveData: () => EMPTY_DATA,
    }),
    { name: "pm-agent-workspace-v2", partialize: (s) => ({ activeWorkspaceId: s.activeWorkspaceId }) }
  )
);
