"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Bot, Check, Code2, Sparkles, X, Zap } from "lucide-react";

import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { usePmChatStore } from "@/lib/store/pm-chat";
import { useTicketStore } from "@/lib/store/tickets";
import type { PmChatMessage } from "@/lib/types";
import { PM_QUICK_PROMPTS } from "@/lib/utils/pm-responses";
import { cn } from "@/lib/utils";
import { TriageFlowStrip } from "@/components/triage/TriageFlowStrip";

const EMPTY_MESSAGES: PmChatMessage[] = [];

interface PmChatViewProps {
  sessionId: string;
  ticketId?: string;
  sidebarOpen?: boolean;
}

export function PmChatView({ sessionId, ticketId, sidebarOpen = true }: PmChatViewProps) {
  const ticket = useTicketStore((s) => (ticketId ? s.getById(ticketId) : undefined));
  const messages = usePmChatStore((s) => s.messagesBySession[sessionId] ?? EMPTY_MESSAGES);
  const sendUserMessage = usePmChatStore((s) => s.sendUserMessage);
  const confirmProposal = usePmChatStore((s) => s.confirmProposal);
  const rejectProposal = usePmChatStore((s) => s.rejectProposal);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    sendUserMessage(sessionId, content, ticket ?? null);
  };

  const ticketPrompts = ticket
    ? [
        "Explain this issue simply",
        "Search GitHub for related code",
        "What's the root cause?",
        "Should I accept or reject?",
      ]
    : [];

  const prompts = ticketPrompts.length ? ticketPrompts : PM_QUICK_PROMPTS.slice(0, 4);

  const title = ticket ? ticket.draftTitle : "How can I help?";
  const subtitle = ticket
    ? `#${ticket.originalTicketId} · GitHub + docs context loaded`
    : "GitHub connected · search code, explain issues, file tickets";

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Messages — full height scroll */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          className={cn(
            "mx-auto w-full max-w-3xl px-4 sm:px-6 pt-8 pb-36",
            !sidebarOpen && "pt-16"
          )}
        >
          {/* Inline title — no separate header bar */}
          <div className="mb-6">
            <TriageFlowStrip activeStep={2} className="mb-6" />
            <div className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Zap className="size-5" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            {ticket && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  <Code2 className="size-3" /> GitHub connected
                </span>
                <ClassificationBadge classification={ticket.classification} size="sm" />
                <ScopeBadge scope={ticket.scope} className="size-5 text-[10px]" />
                <span className="text-xs text-muted-foreground">{ticket.customer.name}</span>
                <Link
                  href={`/triage?ticket=${ticket.id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open in Triage →
                </Link>
              </div>
            )}
            </div>
          </div>

          <div className="space-y-6">
            {messages.map((msg, i) => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                isFirst={i === 0}
                onConfirm={() => confirmProposal(sessionId, msg.id)}
                onReject={() => rejectProposal(sessionId, msg.id)}
              />
            ))}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Floating composer — no top border */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent pb-5 pt-10">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl px-4 sm:px-6">
          <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-none">
            {prompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSend(p)}
                className="shrink-0 rounded-full bg-muted/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2 rounded-2xl bg-background/90 p-2 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-md dark:shadow-black/20 dark:ring-white/10">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ticket ? "Ask about this ticket…" : "Message PM Agent…"}
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed outline-none text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              disabled={!input.trim()}
              onClick={() => handleSend()}
              className={cn(
                "mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition-all",
                input.trim()
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:opacity-90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
            Read-only · serious issues become confirmed tickets in Triage
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  msg,
  isFirst,
  onConfirm,
  onReject,
}: {
  msg: PmChatMessage;
  isFirst?: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-[15px] leading-relaxed text-primary-foreground shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Bot className="size-4" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {!isFirst && (
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">PM Agent</p>
        )}
        <div className="whitespace-pre-line text-[15px] leading-[1.7] text-foreground/90">
          {formatAgentText(msg.content)}
        </div>
        {msg.proposal && (
          <div className="mt-4 space-y-3 rounded-2xl bg-amber-500/10 p-4">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Confirm ticket filing</p>
            <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
              {msg.proposal.title} · {msg.proposal.classification.replace("_", " ")} · Scope {msg.proposal.scope}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Check className="size-3.5" /> File ticket
              </button>
              <button
                type="button"
                onClick={onReject}
                className="inline-flex items-center gap-1.5 rounded-xl bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" /> Not now
              </button>
            </div>
          </div>
        )}
        {msg.createdTicketId && (
          <Link
            href={`/triage?ticket=${msg.createdTicketId}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open in Triage →
          </Link>
        )}
      </div>
    </div>
  );
}

/** Simple **bold** rendering without markdown lib */
function formatAgentText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
