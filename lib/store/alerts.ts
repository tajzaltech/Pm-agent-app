"use client";

import { create } from "zustand";
import type { AnomalyAlert } from "@/lib/types";
import { MOCK_ANOMALY_ALERTS } from "@/lib/mock/alerts";

interface AlertStore {
  alerts: AnomalyAlert[];
  dismiss: (id: string) => void;
  snooze: (id: string) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: MOCK_ANOMALY_ALERTS,

  dismiss: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      ),
    })),

  snooze: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      ),
    })),
}));
