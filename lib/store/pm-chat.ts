"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PmChatMessage, PmChatSession, Ticket } from "@/lib/types";
import { generatePmReply } from "@/lib/utils/pm-responses";
import { useTicketStore } from "@/lib/store/tickets";

interface PmChatStore {
  activeSessionId: string;
  ticketContextId: string | null;
  sessions: PmChatSession[];
  messagesBySession: Record<string, PmChatMessage[]>;
  openChat: (opts?: { ticketId?: string }) => string;
  ensureGlobalSession: () => string;
  createGlobalSession: () => string;
  selectSession: (sessionId: string) => void;
  getMessages: (sessionId: string) => PmChatMessage[];
  sendUserMessage: (sessionId: string, content: string, ticket?: Ticket | null) => void;
  confirmProposal: (sessionId: string, messageId: string) => string | null;
  rejectProposal: (sessionId: string, messageId: string) => void;
}

function welcome(sessionId: string, ticket?: Ticket | null): PmChatMessage {
  return {
    id: `sys_${sessionId}`,
    sessionId,
    ticketId: ticket?.id,
    role: "pm",
    content: ticket
      ? `I'm reading **#${ticket.originalTicketId}** with **GitHub** (\`acmetech/api-backend\`) and docs loaded.\n\n**Your flow:**\n1. Explain the query\n2. Search code for root cause\n3. Return to Triage → full draft unlocks\n4. Accept, reject, or ignore\n\nTry *Search GitHub for related code* or *Explain this issue simply*.`
      : `I'm your **PM Agent** — **GitHub connected** (read-only).\n\nI search your repo, explain issues, and file confirmed tickets into Triage.\n\nDescribe a customer query or pick a prompt below.`,
    timestamp: new Date().toISOString(),
  };
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
      messagesBySession: { global: [welcome("global")] },

      selectSession: (sessionId) => {
        set({
          activeSessionId: sessionId,
          ticketContextId: ticketIdFromSession(sessionId) ?? null,
        });
      },

      ensureGlobalSession: () => {
        const { activeSessionId, messagesBySession } = get();
        if (activeSessionId.startsWith("ticket_")) {
          const globals = get().sessions.filter((s) => !s.ticketId);
          if (globals.length > 0) {
            set({ activeSessionId: globals[0].id, ticketContextId: null });
            return globals[0].id;
          }
          return get().createGlobalSession();
        }
        if (messagesBySession[activeSessionId]?.length) return activeSessionId;
        return get().createGlobalSession();
      },

      createGlobalSession: () => {
        const sessionId = `global_${Date.now()}`;
        const intro = welcome(sessionId, null);
        const meta = sessionMeta(sessionId, null, intro.content.slice(0, 72));
        set((s) => ({
          activeSessionId: sessionId,
          ticketContextId: null,
          sessions: [meta, ...s.sessions.filter((x) => x.id !== sessionId)],
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: [intro],
          },
        }));
        return sessionId;
      },

      openChat: (opts) => {
        const ticketId = opts?.ticketId;
        const sessionId = ticketId ? `ticket_${ticketId}` : get().activeSessionId;
        const existing = get().messagesBySession[sessionId];
        const ticket = ticketId ? useTicketStore.getState().getById(ticketId) : null;

        if (!existing?.length) {
          const intro = welcome(sessionId, ticket);
          const meta = sessionMeta(sessionId, ticket, intro.content.slice(0, 72));
          set((s) => ({
            activeSessionId: sessionId,
            ticketContextId: ticketId ?? null,
            sessions: [meta, ...s.sessions.filter((x) => x.id !== sessionId)],
            messagesBySession: {
              ...s.messagesBySession,
              [sessionId]: [intro],
            },
          }));
        } else {
          set({ activeSessionId: sessionId, ticketContextId: ticketId ?? null });
          if (ticket) {
            set((s) => ({
              sessions: s.sessions.some((x) => x.id === sessionId)
                ? s.sessions.map((x) =>
                    x.id === sessionId ? { ...x, title: ticket.draftTitle, updatedAt: new Date().toISOString() } : x
                  )
                : [sessionMeta(sessionId, ticket), ...s.sessions],
            }));
          }
        }
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
        const reply = generatePmReply(trimmed, { ticket: ticket ?? undefined });
        const pmMsg: PmChatMessage = {
          id: `pm_${Date.now()}`,
          sessionId,
          ticketId: ticket?.id,
          role: "pm",
          content: reply.text,
          timestamp: new Date().toISOString(),
          proposal: reply.proposal,
        };
        const now = new Date().toISOString();
        set((s) => {
          const existingMeta = s.sessions.find((x) => x.id === sessionId);
          const title =
            existingMeta?.title ??
            (ticket ? ticket.draftTitle : trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed);
          const meta: PmChatSession = {
            id: sessionId,
            ticketId: ticket?.id ?? existingMeta?.ticketId,
            title,
            preview: trimmed,
            updatedAt: now,
            createdAt: existingMeta?.createdAt ?? now,
          };
          return {
            messagesBySession: {
              ...s.messagesBySession,
              [sessionId]: [...(s.messagesBySession[sessionId] ?? []), userMsg, pmMsg],
            },
            sessions: [meta, ...s.sessions.filter((x) => x.id !== sessionId)],
          };
        });
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

      rejectProposal: (sessionId, messageId) => {
        set((s) => ({
          messagesBySession: {
            ...s.messagesBySession,
            [sessionId]: (s.messagesBySession[sessionId] ?? []).map((m) =>
              m.id === messageId ? { ...m, proposal: undefined, content: `${m.content}\n\n(No ticket filed.)` } : m
            ),
          },
        }));
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
        return { ...current, ...p, messagesBySession, sessions };
      },
    }
  )
);
