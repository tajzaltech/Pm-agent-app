"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AutoAcceptRule, AutomationPreset, Classification, Scope, Ticket } from "@/lib/types";

interface AutomationStore {
  preset: AutomationPreset;
  autoClassify: boolean;
  scopeEstimation: boolean;
  autoDispatch: boolean;
  autoAcceptRules: AutoAcceptRule[];
  setPreset: (preset: AutomationPreset) => void;
  setAutoClassify: (v: boolean) => void;
  setScopeEstimation: (v: boolean) => void;
  setAutoDispatch: (v: boolean) => void;
  setRules: (rules: AutoAcceptRule[]) => void;
  addRule: (rule: AutoAcceptRule) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  previewRule: (rule: AutoAcceptRule, tickets: Ticket[]) => Ticket[];
}

const PRESET_CONFIG: Record<
  AutomationPreset,
  { autoClassify: boolean; scopeEstimation: boolean; autoDispatch: boolean; rules: AutoAcceptRule[] }
> = {
  conservative: {
    autoClassify: true,
    scopeEstimation: true,
    autoDispatch: false,
    rules: [],
  },
  balanced: {
    autoClassify: true,
    scopeEstimation: true,
    autoDispatch: false,
    rules: [{ id: "preset_qs", classification: "question", scope: "S", enabled: true }],
  },
  aggressive: {
    autoClassify: true,
    scopeEstimation: true,
    autoDispatch: true,
    rules: [
      { id: "preset_qs", classification: "question", scope: "S", enabled: true },
      { id: "preset_bug_s", classification: "bug", scope: "S", enabled: true },
    ],
  },
};

function ruleMatches(rule: AutoAcceptRule, ticket: Ticket) {
  if (!rule.enabled) return false;
  const classOk = rule.classification === "any" || rule.classification === ticket.classification;
  const scopeOk = rule.scope === "any" || rule.scope === ticket.scope;
  return classOk && scopeOk && ticket.status === "pending";
}

export const useAutomationStore = create<AutomationStore>()(
  persist(
    (set, get) => ({
      preset: "balanced",
      autoClassify: true,
      scopeEstimation: true,
      autoDispatch: false,
      autoAcceptRules: PRESET_CONFIG.balanced.rules,
      setPreset: (preset) => {
        const cfg = PRESET_CONFIG[preset];
        set({
          preset,
          autoClassify: cfg.autoClassify,
          scopeEstimation: cfg.scopeEstimation,
          autoDispatch: cfg.autoDispatch,
          autoAcceptRules: cfg.rules.map((r) => ({ ...r, id: `${preset}_${r.id}` })),
        });
        void import("@/lib/api-client").then(({ api }) => api.applyAutomationPreset(preset).catch(() => undefined));
      },
      setAutoClassify: (autoClassify) => set({ autoClassify }),
      setScopeEstimation: (scopeEstimation) => set({ scopeEstimation }),
      setAutoDispatch: (autoDispatch) => set({ autoDispatch }),
      setRules: (autoAcceptRules) => set({ autoAcceptRules }),
      addRule: (rule) => {
        set((s) => ({ autoAcceptRules: [...s.autoAcceptRules, rule] }));
        void import("@/lib/api-client").then(({ api }) =>
          api
            .addAutomationRule({
              classification: String(rule.classification),
              scope: String(rule.scope),
              enabled: rule.enabled,
            })
            .catch(() => undefined),
        );
      },
      removeRule: (id) => {
        set((s) => ({ autoAcceptRules: s.autoAcceptRules.filter((r) => r.id !== id) }));
        void import("@/lib/api-client").then(({ api }) => api.deleteAutomationRule(id).catch(() => undefined));
      },
      toggleRule: (id) => {
        set((s) => ({
          autoAcceptRules: s.autoAcceptRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        }));
        void import("@/lib/api-client").then(({ api }) => api.toggleAutomationRule(id).catch(() => undefined));
      },
      previewRule: (rule, tickets) =>
        tickets.filter((t) => ruleMatches(rule, t)).slice(0, 20),
    }),
    { name: "pm-agent-automation" }
  )
);

export const PRESET_LABELS: Record<AutomationPreset, { label: string; description: string }> = {
  conservative: {
    label: "Conservative",
    description: "Manual review for everything. Safest starting point.",
  },
  balanced: {
    label: "Balanced",
    description: "Auto-accept small questions only. Recommended default.",
  },
  aggressive: {
    label: "Aggressive",
    description: "Auto-accept low-risk bugs and questions. Auto-dispatch enabled.",
  },
};
