"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PmChatMessage, PmChatSession, Ticket } from "@/lib/types";
import { generatePmReply } from "@/lib/utils/pm-responses";
import { buildCustomerReply } from "@/lib/utils/customer-reply";
import { buildTicketContextMessages } from "@/lib/utils/ticket-chat-context";
import { useTicketStore } from "@/lib/store/tickets";
import { useTriageAlertsStore } from "@/lib/store/triage-alerts";

interface PmChatStore {
  activeSessionId: string;
  ticketContextId: string | null;
  sessions: PmChatSession[];
  messagesBySession: Record<string, PmChatMessage[]>;
  typingBySession: Record<string, boolean>;
  openChat: (opts?: { ticketId?: string }) => string;
  ensureGlobalSession: () => string;
  createGlobalSession: () => string;
  selectSession: (sessionId: string) => void;
  getMessages: (sessionId: string) => PmChatMessage[];
  sendUserMessage: (sessionId: string, content: string, ticket?: Ticket | null) => void;
  confirmProposal: (sessionId: string, messageId: string) => string | null;
  sendProposalToDev: (sessionId: string, messageId: string) => string | null;
  rejectProposal: (sessionId: string, messageId: string) => void;
  startNonTechnicalReply: (ticketId: string) => void;
  sendCustomerReply: (sessionId: string, messageId: string) => boolean;
}

function welcome(sessionId: string, ticket?: Ticket | null): PmChatMessage {
  return {
    id: `sys_${sessionId}`,
    sessionId,
    ticketId: ticket?.id,
    role: "pm",
    content: ticket
      ? `Loaded **#${ticket.originalTicketId}** · ${ticket.customer.name}. Ask anything about this ticket.`
      : `Tell me about the issue — I'll ask follow-ups before we file anything.`,
    timestamp: new Date().toISOString(),
  };
}

/** Legacy welcome messages are hidden in UI — new sessions start empty. */
function emptySessionMessages(): PmChatMessage[] {
  return [];
}

function sessionMeta(
  sessionId: string,
  ticket?: Ticket | null,
  preview?: string
): PmChatSession {
  const now = new Date().toISOString();
  return {
    id: sessionId,
    ticketId: ticket?.id,
    title: ticket ? ticket.draftTitle : "New conversation",
    preview: preview ?? (ticket ? `#${ticket.originalTicketId} · ticket context` : "Ask anything about code or docs"),
    updatedAt: now,
    createdAt: now,
  };
}

function ticketIdFromSession(sessionId: string) {
  return sessionId.startsWith("ticket_") ? sessionId.slice("ticket_".length) : undefined;
}

export const usePmChatStore = create<PmChatStore>()(
  persist(
    (set, get) => ({
      activeSessionId: "global",
      ticketContextId: null,
      sessions: [],
      messagesBySession: { global: emptySessionMessages() },
      typingBySession: {},

      selectSession: (sessionId) => {
        set({
          activeSessionId: sessionId,
          ticketContextId: ticketIdFromSession(sessionId) ?? null,
        });
      },

      ensureGlobalSession: () => {
        const { activeSessionId, messagesBySession, sessions } = get();

        const hasUserMessages = (id: string) =>
          (messagesBySession[id] ?? []).some((m) => m.role === "user");

        if (activeSessionId.startsWith("ticket_")) {
          const globals = sessions.filter((s) => !s.ticketId);
          const reusable = globals.find((s) => !hasUserMessages(s.id));
          if (reusable) {
            set({ activeSessionId: reusable.id, ticketContextId: null });
            return reusable.id;
          }
          if (globals.length > 0) {
            set({ activeSessionId: globals[0].id, ticketContextId: null });
            return globals[0].id;
          }
          return get().createGlobalSession();
        }

        if (hasUserMessages(activeSessionId)) return activeSessionId;

        const reusable = sessions.find((s) => !s.ticketId && !hasUserMessages(s.id));
        if (reusable) {
          set({ activeSessionId: reusable.id, ticketContextId: null });
          return reusable.id;
        }

        if (!activeSessionId.startsWith("ticket_")) return activeSessionId;

        return get().createGlobalSession();
      },

      createGlobalSession: () => {
        const sessionId = `global_${Date.now()}`;
        const meta = sessionMeta(sessionId, null, "No messages yet");
        set((s) => ({
          activeSessionId: sessionId,
          ticketContextId: null,
          sessions: [meta, ...s.sessions.filter((x) => x.id !== sessionId)],
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: emptySessionMessages(),
          },
        }));
        return sessionId;
      },

      openChat: (opts) => {
        const ticketId = opts?.ticketId;
        const sessionId = ticketId ? `ticket_${ticketId}` : get().activeSessionId;
        const existing = get().messagesBySession[sessionId] ?? [];
        const hasUserMessages = existing.some((m) => m.role === "user");
        const ticket = ticketId ? useTicketStore.getState().getById(ticketId) : null;

        const messages =
          ticket && ticketId && !hasUserMessages
            ? buildTicketContextMessages(sessionId, ticket)
            : existing;

        const preview =
          ticket != null
            ? `#${ticket.originalTicketId}`
            : messages.find((m) => m.role === "user")?.content.slice(0, 48) ?? "New conversation";
        const meta = sessionMeta(sessionId, ticket, preview);

        set((s) => ({
          activeSessionId: sessionId,
          ticketContextId: ticketId ?? null,
          sessions: [meta, ...s.sessions.filter((x) => x.id !== sessionId)],
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: messages,
          },
        }));
        return sessionId;
      },

      getMessages: (sessionId) => get().messagesBySession[sessionId] ?? [],

      sendUserMessage: (sessionId, content, ticket) => {
        const trimmed = content.trim();
        if (!trimmed) return;
        const userMsg: PmChatMessage = {
          id: `u_${Date.now()}`,
          sessionId,
          ticketId: ticket?.id,
          role: "user",
          content: trimmed,
          timestamp: new Date().toISOString(),
        };
        const history = get().messagesBySession[sessionId] ?? [];
        const reply = generatePmReply(trimmed, { ticket: ticket ?? undefined, history });
        const pmMsg: PmChatMessage = {
          id: `pm_${Date.now() + 1}`,
          sessionId,
          ticketId: ticket?.id,
          role: "pm",
          content: reply.text,
          timestamp: new Date().toISOString(),
          proposal: reply.proposal,
        };
        const now = new Date().toISOString();
        const existingMeta = get().sessions.find((x) => x.id === sessionId);
        const fallbackTitle = ticket
          ? ticket.draftTitle
          : trimmed.length > 48
            ? `${trimmed.slice(0, 48)}…`
            : trimmed;
        const title =
          existingMeta?.title && existingMeta.title !== "New conversation"
            ? existingMeta.title
            : fallbackTitle;
        const meta: PmChatSession = {
          id: sessionId,
          ticketId: ticket?.id ?? existingMeta?.ticketId,
          title,
          preview: trimmed,
          updatedAt: now,
          createdAt: existingMeta?.createdAt ?? now,
        };

        set((s) => ({
          typingBySession: { ...s.typingBySession, [sessionId]: true },
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: [...(s.messagesBySession[sessionId] ?? []), userMsg],
          },
          sessions: [meta, ...s.sessions.filter((x) => x.id !== sessionId)],
        }));

        const delay = 700 + Math.min(trimmed.length * 10, 1200);
        window.setTimeout(() => {
          set((s) => ({
            typingBySession: { ...s.typingBySession, [sessionId]: false },
            messagesBySession: {
              ...s.messagesBySession,
              [sessionId]: [...(s.messagesBySession[sessionId] ?? []), pmMsg],
            },
          }));
        }, delay);
      },

      confirmProposal: (sessionId, messageId) => {
        const msgs = get().messagesBySession[sessionId] ?? [];
        const msg = msgs.find((m) => m.id === messageId);
        if (!msg?.proposal) return null;
        const id = useTicketStore.getState().createFromChat({
          title: msg.proposal.title,
          classification: msg.proposal.classification,
          scope: msg.proposal.scope,
          description: msg.proposal.summary,
          chatSessionId: sessionId,
        });
        set((s) => ({
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: (s.messagesBySession[sessionId] ?? []).map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    createdTicketId: id,
                    content: `${m.content}\n\n✓ **Ticket ${id}** created — now in Triage (via PM Agent Chat).`,
                    proposal: undefined,
                  }
                : m
            ),
          },
        }));
        return id;
      },

      sendProposalToDev: (sessionId, messageId) => {
        const msgs = get().messagesBySession[sessionId] ?? [];
        const msg = msgs.find((m) => m.id === messageId);
        if (!msg?.proposal) return null;
        const id = useTicketStore.getState().createFromChat({
          title: msg.proposal.title,
          classification: msg.proposal.classification,
          scope: msg.proposal.scope,
          description: msg.proposal.summary,
          chatSessionId: sessionId,
        });
        useTicketStore.getState().acceptSendToDev(id);
        set((s) => ({
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: (s.messagesBySession[sessionId] ?? []).map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    createdTicketId: id,
                    content: `${m.content}\n\n✓ **Ticket ${id}** sent to the development team.`,
                    proposal: undefined,
                  }
                : m
            ),
          },
        }));
        return id;
      },

      rejectProposal: (sessionId, messageId) => {
        set((s) => ({
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: (s.messagesBySession[sessionId] ?? []).map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    proposal: undefined,
                    customerReply: undefined,
                    content: `${m.content}\n\n(Dismissed.)`,
                  }
                : m
            ),
          },
        }));
      },

      startNonTechnicalReply: (ticketId) => {
        const ticket = useTicketStore.getState().getById(ticketId);
        if (!ticket) return;

        const sessionId = `ticket_${ticketId}`;
        const draft = buildCustomerReply(ticket);
        const now = new Date().toISOString();
        const userMsg: PmChatMessage = {
          id: `u_nt_${Date.now()}`,
          sessionId,
          ticketId,
          role: "user",
          content: `Help me reply to ${ticket.customer.name} — this doesn't need dev work.`,
          timestamp: now,
        };
        const pmMsg: PmChatMessage = {
          id: `pm_nt_${Date.now() + 1}`,
          sessionId,
          ticketId,
          role: "pm",
          content: `I've drafted a customer-facing reply for **#${ticket.originalTicketId}**. Review it below — when you're happy, send it back through **${draft.channel}**.`,
          timestamp: now,
          customerReply: draft,
        };
        const meta = sessionMeta(sessionId, ticket, "Customer reply draft");

        useTriageAlertsStore.getState().markPmConsulted(ticketId);

        set((s) => ({
          activeSessionId: sessionId,
          ticketContextId: ticketId,
          sessions: [meta, ...s.sessions.filter((x) => x.id !== sessionId)],
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: [userMsg, pmMsg],
          },
          typingBySession: { ...s.typingBySession, [sessionId]: false },
        }));
      },

      sendCustomerReply: (sessionId, messageId) => {
        const msgs = get().messagesBySession[sessionId] ?? [];
        const msg = msgs.find((m) => m.id === messageId);
        if (!msg?.customerReply || !msg.ticketId) return false;

        const ticket = useTicketStore.getState().getById(msg.ticketId);
        if (!ticket) return false;

        useTicketStore.getState().acceptNonTechnical(msg.ticketId);

        set((s) => ({
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: (s.messagesBySession[sessionId] ?? []).map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    customerReply: undefined,
                    content: `${m.content}\n\n✓ **Sent via ${msg.customerReply!.channel}** — reply delivered to ${msg.customerReply!.customerName}.`,
                  }
                : m
            ),
          },
        }));
        return true;
      },
    }),
    {
      name: "pm-agent-chat-v2",
      merge: (persisted, current) => {
        const p = persisted as Partial<PmChatStore>;
        const messagesBySession = p.messagesBySession ?? current.messagesBySession;
        const sessions =
          p.sessions && p.sessions.length > 0
            ? p.sessions
            : Object.keys(messagesBySession).map((id) => {
                const ticketId = ticketIdFromSession(id);
                const ticket = ticketId ? useTicketStore.getState().getById(ticketId) : undefined;
                const msgs = messagesBySession[id] ?? [];
                const lastUser = [...msgs].reverse().find((m) => m.role === "user");
                return sessionMeta(id, ticket ?? null, lastUser?.content ?? "Conversation");
              });
        return { ...current, ...p, messagesBySession, sessions, typingBySession: p.typingBySession ?? {} };
      },
    }
  )
);
