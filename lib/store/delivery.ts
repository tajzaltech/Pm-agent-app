"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryConfig, DeliveryRecord, DeliveryStatus, DeliveryTool } from "@/lib/types";

export const TOOL_LABELS: Record<DeliveryTool, string> = {
  jira: "Jira",
  linear: "Linear",
  github: "GitHub Issues",
  clickup: "ClickUp",
  asana: "Asana",
  trello: "Trello",
};

export const TOOL_COLORS: Record<DeliveryTool, string> = {
  jira: "text-blue-600",
  linear: "text-indigo-600",
  github: "text-gray-700",
  clickup: "text-violet-600",
  asana: "text-rose-600",
  trello: "text-sky-600",
};

interface DeliveryStore {
  config: DeliveryConfig;
  records: DeliveryRecord[];
  setConfig: (patch: Partial<DeliveryConfig>) => void;
  getRecord: (ticketId: string) => DeliveryRecord | undefined;
  deliver: (ticketId: string, ticketTitle: string, assigneeId: string, assigneeName: string, assigneeInitials: string, tool: DeliveryTool) => Promise<void>;
  clearRecord: (ticketId: string) => void;
}

export const useDeliveryStore = create<DeliveryStore>()(
  persist(
    (set, get) => ({
      config: {
        enabled: false,
        defaultTool: "jira",
        autoDeliver: false,
        defaultAssigneeId: "",
        toolWebhookUrl: "",
      },
      records: [],

      setConfig: (patch) =>
        set((s) => ({ config: { ...s.config, ...patch } })),

      getRecord: (ticketId) =>
        get().records.find((r) => r.ticketId === ticketId),

      deliver: async (ticketId, ticketTitle, assigneeId, assigneeName, assigneeInitials, tool) => {
        const pending: DeliveryRecord = {
          ticketId,
          ticketTitle,
          assigneeId,
          assigneeName,
          assigneeInitials,
          tool,
          status: "delivering",
          deliveredAt: new Date().toISOString(),
        };
        set((s) => ({
          records: [
            pending,
            ...s.records.filter((r) => r.ticketId !== ticketId),
          ],
        }));

        try {
          const res = await (await import("@/lib/api-client")).api.deliver({
            ticketId,
            assigneeId,
            assigneeName,
            assigneeInitials,
            tool,
          });
          set((s) => ({
            records: s.records.map((r) => (r.ticketId === ticketId ? res : r)),
          }));
        } catch {
          set((s) => ({
            records: s.records.map((r) =>
              r.ticketId === ticketId ? { ...r, status: "failed", error: "Delivery failed" } : r
            ),
          }));
        }
      },

      clearRecord: (ticketId) =>
        set((s) => ({ records: s.records.filter((r) => r.ticketId !== ticketId) })),
    }),
    { name: "pm-agent-delivery" }
  )
);
