"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditLogEntry, AuditActorType } from "@/lib/types";

interface AuditStore {
  entries: AuditLogEntry[];
  log: (entry: Omit<AuditLogEntry, "id" | "timestamp">) => void;
  search: (query: string) => AuditLogEntry[];
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      entries: [
        {
          id: "audit_seed_1",
          action: "rule_enabled",
          actor: "Sohaib Khan",
          actorType: "user",
          detail: "Enabled auto-accept rule: Question + Small scope",
          timestamp: "2026-06-16T09:00:00Z",
        },
      ],
      log: (entry) =>
        set((state) => ({
          entries: [
            {
              ...entry,
              id: `audit_${Date.now()}`,
              timestamp: new Date().toISOString(),
            },
            ...state.entries,
          ].slice(0, 500),
        })),
      search: (query) => {
        const q = query.toLowerCase().trim();
        if (!q) return get().entries;
        return get().entries.filter(
          (e) =>
            e.action.toLowerCase().includes(q) ||
            e.actor.toLowerCase().includes(q) ||
            e.detail.toLowerCase().includes(q) ||
            e.ticketTitle?.toLowerCase().includes(q)
        );
      },
    }),
    { name: "pm-agent-audit" }
  )
);

export function logAudit(
  action: string,
  detail: string,
  opts?: { ticketId?: string; ticketTitle?: string; actor?: string; actorType?: AuditActorType }
) {
  useAuditStore.getState().log({
    action,
    detail,
    actor: opts?.actor ?? "You",
    actorType: opts?.actorType ?? "user",
    ticketId: opts?.ticketId,
    ticketTitle: opts?.ticketTitle,
  });
}
