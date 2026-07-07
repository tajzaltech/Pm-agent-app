"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PipelineCard, PipelineStage, Ticket } from "@/lib/types";
import { MOCK_PIPELINE } from "@/lib/mock/pipeline";

const STAGE_ORDER: PipelineStage[] = [
  "accepted",
  "assigned",
  "dev_working",
  "pr_open",
  "merged",
  "shipped",
];

interface PipelineStore {
  cards: PipelineCard[];
  addFromAcceptance: (ticket: Ticket, opts?: { assigneeName?: string; assigneeInitials?: string; tool?: string }) => void;
  moveCard: (id: string, stage: PipelineStage) => void;
  advanceCard: (id: string) => void;
  getByStage: (stage: PipelineStage) => PipelineCard[];
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  accepted: "Accepted",
  assigned: "Assigned",
  dev_working: "Dev Agent Working",
  pr_open: "PR Open",
  merged: "Merged",
  shipped: "Shipped",
};

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set, get) => ({
      cards: MOCK_PIPELINE,
      addFromAcceptance: (ticket, opts) => {
        const codeArea = ticket.codeRefs[0]?.filePath.split("/").slice(0, 2).join("/") ?? "—";
        const card: PipelineCard = {
          id: `pipe_${ticket.id}`,
          ticketId: ticket.id,
          title: ticket.draftTitle,
          stage: opts?.assigneeName ? "assigned" : "accepted",
          assigneeName: opts?.assigneeName,
          assigneeInitials: opts?.assigneeInitials,
          destinationTool: opts?.tool ?? "Linear",
          codeArea,
          stageEnteredAt: new Date().toISOString(),
        };
        set((s) => ({
          cards: [card, ...s.cards.filter((c) => c.ticketId !== ticket.id)],
        }));
      },
      moveCard: (id, stage) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === id ? { ...c, stage, stageEnteredAt: new Date().toISOString() } : c
          ),
        })),
      advanceCard: (id) => {
        const card = get().cards.find((c) => c.id === id);
        if (!card) return;
        const idx = STAGE_ORDER.indexOf(card.stage);
        if (idx < STAGE_ORDER.length - 1) {
          get().moveCard(id, STAGE_ORDER[idx + 1]);
        }
      },
      getByStage: (stage) => get().cards.filter((c) => c.stage === stage),
    }),
    { name: "pm-agent-pipeline" }
  )
);
