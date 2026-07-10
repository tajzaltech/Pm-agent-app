import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WORKSPACES, WORKSPACE_DATA, type Workspace, type WorkspaceData } from "@/lib/mock/workspaces";

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setActiveWorkspace: (id: string) => void;
  getActiveWorkspace: () => Workspace;
  getActiveData: () => WorkspaceData;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: WORKSPACES,
      activeWorkspaceId: WORKSPACES[0].id,

      setActiveWorkspace: (id) => {
        if (WORKSPACE_DATA[id]) {
          set({ activeWorkspaceId: id });
        }
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
      },

      getActiveData: () => {
        return WORKSPACE_DATA[get().activeWorkspaceId] ?? WORKSPACE_DATA[WORKSPACES[0].id];
      },
    }),
    { name: "pm-agent-workspace-v1", partialize: (s) => ({ activeWorkspaceId: s.activeWorkspaceId }) }
  )
);
