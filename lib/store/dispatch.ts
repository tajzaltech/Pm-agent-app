"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentDispatchConfig, DispatchRecord, AgentType } from "@/lib/types";

interface DispatchStore {
  config: AgentDispatchConfig;
  records: DispatchRecord[];

  updateConfig: (updates: Partial<AgentDispatchConfig>) => void;
  dispatch: (ticketId: string, ticketTitle: string) => Promise<void>;
  getRecord: (ticketId: string) => DispatchRecord | undefined;
  clearRecord: (ticketId: string) => void;
}

const DEFAULT_CONFIG: AgentDispatchConfig = {
  enabled: false,
  agentType: "claude-code",
  webhookUrl: "",
  branchPattern: "fix/{id}",
  customBranchPattern: "",
  includeCodeRefs: true,
  includeApproach: true,
};

function buildBranchName(pattern: AgentDispatchConfig["branchPattern"], customPattern: string, ticketId: string) {
  if (pattern === "custom") return customPattern.replace("{id}", ticketId);
  return pattern.replace("{id}", ticketId);
}

export const useDispatchStore = create<DispatchStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      records: [],

      updateConfig: (updates) => {
        set((state) => ({ config: { ...state.config, ...updates } }));
      },

      dispatch: async (ticketId, ticketTitle) => {
        const { config } = get();
        if (!config.enabled || !config.webhookUrl) return;

        const branchName = buildBranchName(config.branchPattern, config.customBranchPattern, ticketId);

        const record: DispatchRecord = {
          ticketId,
          ticketTitle,
          status: "dispatching",
          dispatchedAt: new Date().toISOString(),
          branchName,
          agentType: config.agentType,
        };

        set((state) => ({
          records: [record, ...state.records.filter((r) => r.ticketId !== ticketId)],
        }));

        try {
          const res = await fetch("/api/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId, branchName, agentType: config.agentType, webhookUrl: config.webhookUrl }),
          });

          set((state) => ({
            records: state.records.map((r) =>
              r.ticketId === ticketId
                ? { ...r, status: res.ok ? "dispatched" : "failed", error: res.ok ? undefined : `HTTP ${res.status}` }
                : r
            ),
          }));
        } catch (err) {
          set((state) => ({
            records: state.records.map((r) =>
              r.ticketId === ticketId
                ? { ...r, status: "failed", error: String(err) }
                : r
            ),
          }));
        }
      },

      getRecord: (ticketId) => get().records.find((r) => r.ticketId === ticketId),
      clearRecord: (ticketId) => set((state) => ({ records: state.records.filter((r) => r.ticketId !== ticketId) })),
    }),
    { name: "pm-agent-dispatch" }
  )
);

export const AGENT_LABELS: Record<AgentType, string> = {
  "claude-code": "Claude Code",
  cursor: "Cursor",
  custom: "Custom Agent",
};
