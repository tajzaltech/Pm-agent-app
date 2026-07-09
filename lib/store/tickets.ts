"use client";

import { create } from "zustand";
import type { Ticket, TicketStatus, ActivityEntry, ActivityAction, Classification, Scope } from "@/lib/types";
import { MOCK_TICKETS } from "@/lib/mock/tickets";
import { MOCK_ACTIVITY } from "@/lib/mock/activity";
import { logAudit } from "@/lib/store/audit";
import { usePipelineStore } from "@/lib/store/pipeline";

interface UndoRecord {
  ticketId: string;
  previousStatus: TicketStatus;
  timerId: ReturnType<typeof setTimeout>;
}

interface TicketStore {
  tickets: Ticket[];
  activity: ActivityEntry[];
  undoRecord: UndoRecord | null;
  serverHydrated: boolean;

  // Actions
  hydrateFromApi: () => Promise<void>;
  accept: (id: string) => void;
  acceptSendToDev: (id: string) => void;
  acceptNonTechnical: (id: string) => void;
  reject: (id: string) => void;
  ignore: (id: string) => void;
  editDraft: (id: string, updates: Partial<Ticket>) => void;
  editAndAccept: (id: string, updates: Partial<Ticket>) => void;
  createFromChat: (payload: {
    title: string;
    classification: Classification;
    scope: Scope;
    description: string;
    chatSessionId: string;
  }) => string;
  undo: () => void;
  clearUndo: () => void;
  getById: (id: string) => Ticket | undefined;

  // Computed helpers (called as methods for simplicity)
  getPending: () => Ticket[];
  getAccepted: () => Ticket[];
  getRejected: () => Ticket[];
}

function addActivity(activity: ActivityEntry[], entry: Omit<ActivityEntry, "id" | "timestamp">): ActivityEntry[] {
  const newEntry: ActivityEntry = {
    ...entry,
    id: `act_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  return [newEntry, ...activity];
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: MOCK_TICKETS,
  activity: MOCK_ACTIVITY,
  undoRecord: null,
  serverHydrated: false,

  hydrateFromApi: async () => {
    try {
      const response = await fetch("/api/draft-tickets", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        tickets?: Ticket[];
        activity?: ActivityEntry[];
      };

      set({
        tickets: data.tickets?.length ? data.tickets : get().tickets,
        activity: data.activity?.length ? data.activity : get().activity,
        serverHydrated: true,
      });
    } catch {
      set({ serverHydrated: true });
    }
  },

  accept: (id) => {
    get().acceptSendToDev(id);
  },

  acceptSendToDev: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || ticket.status === "accepted") return;
    const previousStatus = ticket.status;
    const existing = get().undoRecord;
    if (existing) clearTimeout(existing.timerId);
    const timerId = setTimeout(() => set({ undoRecord: null }), 5000);

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, status: "accepted" as TicketStatus, resolution: "dev" as const } : t
      ),
      activity: addActivity(state.activity, {
        action: "accepted" as ActivityAction,
        ticketTitle: ticket.draftTitle,
        ticketId: id,
      }),
      undoRecord: { ticketId: id, previousStatus, timerId },
    }));

    usePipelineStore.getState().addFromAcceptance(ticket);
    logAudit("accepted", `Accept & send to Dev`, { ticketId: id, ticketTitle: ticket.draftTitle });
  },

  acceptNonTechnical: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || ticket.status !== "pending") return;
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, status: "accepted" as TicketStatus, resolution: "non_technical" as const } : t
      ),
      activity: addActivity(state.activity, {
        action: "accepted_non_technical" as ActivityAction,
        ticketTitle: ticket.draftTitle,
        ticketId: id,
      }),
    }));
    logAudit("accepted_non_technical", `Accepted (non-technical) — no dev work`, {
      ticketId: id,
      ticketTitle: ticket.draftTitle,
    });
  },

  ignore: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket) return;
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? { ...t, status: "ignored" as TicketStatus } : t)),
      activity: addActivity(state.activity, {
        action: "ignored" as ActivityAction,
        ticketTitle: ticket.draftTitle,
        ticketId: id,
      }),
    }));
    logAudit("ignored", `Ignored duplicate/noise`, { ticketId: id, ticketTitle: ticket.draftTitle });
  },

  createFromChat: (payload) => {
    const id = `chat_${Date.now()}`;
    const ticket: Ticket = {
      id,
      status: "pending",
      classification: payload.classification,
      scope: payload.scope,
      draftTitle: payload.title,
      draftDescription: payload.description,
      suggestedApproach: "Investigate using connected repo context and confirm repro steps with customer.",
      acceptanceCriteria: ["Issue reproduced or ruled out", "Customer updated with resolution path"],
      scopeRationale: "Created from PM Agent Chat escalation",
      codeRefs: [],
      customer: {
        id: "chat",
        name: "Chat escalation",
        email: "support@company.com",
        plan: "growth",
        avatarInitials: "PC",
      },
      source: "pm_chat",
      viaPmChat: true,
      linkedChatId: payload.chatSessionId,
      originalTicketId: id.toUpperCase(),
      originalSubject: payload.title,
      originalBody: payload.description,
      conversation: [],
      internalNotes: "Originated via PM Agent Chat — conversation linked.",
      attachments: [],
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      tickets: [ticket, ...state.tickets],
      activity: addActivity(state.activity, {
        action: "new_draft" as ActivityAction,
        ticketTitle: ticket.draftTitle,
        ticketId: id,
      }),
    }));
    return id;
  },

  reject: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || ticket.status === "rejected") return;
    const previousStatus = ticket.status;

    const existing = get().undoRecord;
    if (existing) {
      clearTimeout(existing.timerId);
    }

    const timerId = setTimeout(() => {
      set({ undoRecord: null });
    }, 5000);

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, status: "rejected" } : t
      ),
      activity: addActivity(state.activity, {
        action: "rejected" as ActivityAction,
        ticketTitle: ticket.draftTitle,
        ticketId: id,
      }),
      undoRecord: { ticketId: id, previousStatus, timerId },
    }));

    logAudit("rejected", `Rejected draft`, { ticketId: id, ticketTitle: ticket.draftTitle });

    void fetch(`/api/draft-tickets/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
  },

  editDraft: (id, updates) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || ticket.status !== "pending") return;

    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      activity: addActivity(state.activity, {
        action: "edited" as ActivityAction,
        ticketTitle: updates.draftTitle ?? ticket.draftTitle,
        ticketId: id,
      }),
    }));

    logAudit("edited", `Saved draft edits without accepting`, {
      ticketId: id,
      ticketTitle: updates.draftTitle ?? ticket.draftTitle,
    });
  },

  editAndAccept: (id, updates) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket) return;

    const existing = get().undoRecord;
    if (existing) {
      clearTimeout(existing.timerId);
    }

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, ...updates, status: "accepted" } : t
      ),
      activity: addActivity(state.activity, {
        action: "edited_accepted" as ActivityAction,
        ticketTitle: updates.draftTitle ?? ticket.draftTitle,
        ticketId: id,
      }),
      undoRecord: null,
    }));

    usePipelineStore.getState().addFromAcceptance({ ...ticket, ...updates });
    logAudit("edited_accepted", `Edited and accepted draft`, {
      ticketId: id,
      ticketTitle: updates.draftTitle ?? ticket.draftTitle,
    });

    void fetch(`/api/draft-tickets/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", updates }),
    });

    import("@/lib/store/dispatch").then(({ useDispatchStore }) => {
      const dispatchStore = useDispatchStore.getState();
      if (dispatchStore.config.enabled && dispatchStore.config.webhookUrl) {
        void dispatchStore.dispatch(id, updates.draftTitle ?? ticket.draftTitle);
      }
    });
  },

  undo: () => {
    const record = get().undoRecord;
    if (!record) return;

    clearTimeout(record.timerId);

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === record.ticketId ? { ...t, status: record.previousStatus } : t
      ),
      // Remove the last activity entry we added
      activity: state.activity.slice(1),
      undoRecord: null,
    }));
  },

  clearUndo: () => {
    const record = get().undoRecord;
    if (record) clearTimeout(record.timerId);
    set({ undoRecord: null });
  },

  getById: (id) => get().tickets.find((t) => t.id === id),
  getPending: () => get().tickets.filter((t) => t.status === "pending"),
  getAccepted: () => get().tickets.filter((t) => t.status === "accepted"),
  getRejected: () => get().tickets.filter((t) => t.status === "rejected"),
}));
