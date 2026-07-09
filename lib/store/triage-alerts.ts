"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TriageAlertsStore {
  seenTicketIds: string[];
  pmConsultedIds: string[];
  markSeen: (id: string) => void;
  markManySeen: (ids: string[]) => void;
  isNew: (id: string) => boolean;
  markPmConsulted: (id: string) => void;
  hasPmConsulted: (id: string) => boolean;
}

export const useTriageAlertsStore = create<TriageAlertsStore>()(
  persist(
    (set, get) => ({
      seenTicketIds: [],
      pmConsultedIds: [],

      markSeen: (id) => {
        const { seenTicketIds } = get();
        if (seenTicketIds.includes(id)) return;
        set({ seenTicketIds: [...seenTicketIds, id] });
      },

      markManySeen: (ids) => {
        const { seenTicketIds } = get();
        const next = [...seenTicketIds];
        for (const id of ids) {
          if (!next.includes(id)) next.push(id);
        }
        set({ seenTicketIds: next });
      },

      isNew: (id) => !get().seenTicketIds.includes(id),

      markPmConsulted: (id) => {
        const { pmConsultedIds } = get();
        if (pmConsultedIds.includes(id)) return;
        set({ pmConsultedIds: [...pmConsultedIds, id] });
      },

      hasPmConsulted: (id) => get().pmConsultedIds.includes(id),
    }),
    { name: "pm-agent-triage-seen" }
  )
);
