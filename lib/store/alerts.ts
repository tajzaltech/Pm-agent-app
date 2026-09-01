"use client";

import { create } from "zustand";
import type { AnomalyAlert } from "@/lib/types";

interface AlertStore {
  alerts: AnomalyAlert[];
  dismiss: (id: string) => void;
  snooze: (id: string) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],

  dismiss: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      ),
    }));
    void import("@/lib/api-client").then(({ api }) => api.dismissAlert(id).catch(() => undefined));
  },

  snooze: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      ),
    })),
}));
