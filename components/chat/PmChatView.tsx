"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUp,
  Bug,
  Check,
  GitBranch,
  Mail,
  MessageSquare,
  Rocket,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { usePmChatStore } from "@/lib/store/pm-chat";
import { useTicketStore } from "@/lib/store/tickets";
import type { PmChatMessage, Ticket } from "@/lib/types";
import {
  PM_CHAT_STARTERS,
  TICKET_QUICK_PROMPTS,
  type PmChatStarter,
} from "@/lib/utils/pm-responses";
import { cn } from "@/lib/utils";

const CHAT_COLUMN = "max-w-[44.1rem]";
const COMPOSER_COLUMN = "max-w-[46.75rem]";
const EMPTY_MESSAGES: PmChatMessage[] = [];
const COMPOSER_H = 148;

const STARTER_ICONS = [Bug, Search, Rocket, GitBranch, AlertTriangle, MessageSquare] as const;

function isVisibleMessage(msg: PmChatMessage) {
  return !msg.id.startsWith("sys_");
}

export function PmChatView({ sessionId, ticketId, sidebarOpen = true }: PmChatViewProps) {
  const router = useRouter();
  const ticket = useTicketStore((s) => (ticketId ? s.getById(ticketId) : undefined));
  const messages = usePmChatStore((s) => s.messagesBySession[sessionId] ?? EMPTY_MESSAGES);
  const isTyping = usePmChatStore((s) => s.typingBySession[sessionId] ?? false);
  const sendUserMessage = usePmChatStore((s) => s.sendUserMessage);
  const confirmProposal = usePmChatStore((s) => s.confirmProposal);
  const sendProposalToDev = usePmChatStore((s) => s.sendProposalToDev);
  const rejectProposal = usePmChatStore((s) => s.rejectProposal);
  const sendCustomerReply = usePmChatStore((s) => s.sendCustomerReply);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const wasTypingRef = useRef(false);
  const prevCountRef = useRef(0);

  const starters = useMemo<PmChatStarter[]>(() => {
    if (ticket) {
      return TICKET_QUICK_PROMPTS.map((prompt, i) => ({
        label: ["Context", "Code search", "Impact"][i] ?? "Ask",
        prompt,
        hint: "Ticket loaded",
      }));
    }
    return PM_CHAT_STARTERS;
  }, [ticket]);

  const visibleMessages = useMemo(() => messages.filter(isVisibleMessage), [messages]);
  const hasConversation = visibleMessages.some((m) => m.role === "user");

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (wasTypingRef.current && !isTyping) {
      const lastPm = [...visibleMessages].reverse().find((m) => m.role === "pm");
      if (lastPm) setStreamingMsgId(lastPm.id);
    }
    wasTypingRef.current = isTyping;
  }, [isTyping, visibleMessages]);

  useEffect(() => {
    const count = visibleMessages.length + (isTyping ? 1 : 0) + (streamingMsgId ? 1 : 0);
    const grew = count > prevCountRef.current;
    prevCountRef.current = count;
    if (hasConversation) scrollToBottom(grew);
  }, [visibleMessages.length, isTyping, streamingMsgId, scrollToBottom, hasConversation]);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isTyping || streamingMsgId) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    sendUserMessage(sessionId, content, ticket ?? null);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-500",
          hasConversation ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,color-mix(in_oklab,var(--primary)_6%,transparent),transparent_50%)]" />
      </div>

      {ticket && (
        <div className={cn("relative shrink-0 border-b border-border/50 bg-background/80 px-4 py-2.5 backdrop-blur-sm", !sidebarOpen && "pl-14")}>
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-mono text-muted-foreground">#{ticket.originalTicketId}</span>
            <span className="text-muted-foreground">{ticket.customer.name}</span>
            <span className="hidden text-muted-foreground/70 sm:inline">·</span>
            <span className="hidden min-w-0 truncate text-muted-foreground sm:inline">{ticket.originalSubject}</span>
            <Link href={`/triage?ticket=${ticket.id}`} className="ml-auto font-medium text-primary hover:underline">
              Triage
            </Link>
          </div>
        </div>
      )}

      {!hasConversation ? (
        <div className={cn("relative flex min-h-0 flex-1 flex-col", !sidebarOpen && !ticket && "pt-10")}>
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-8 sm:px-6">
            <div className="mb-6 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Sparkles className="size-5" />
            </div>
            <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
              {ticket ? "Dig into this ticket" : "Ask your PM Agent"}
            </h1>
            <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
              {ticket
                ? "I'll search code, ask follow-ups, and only suggest filing when we have enough context."
                : "Describe what's happening — I'll gather context before any ticket is filed."}
            </p>

            <div className="mt-8 w-full max-w-2xl">
              <ChatComposer
                input={input}
                setInput={setInput}
                textareaRef={textareaRef}
                isTyping={isTyping || !!streamingMsgId}
                onSend={handleSend}
                large
              />
              <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
                GitHub connected · read-only · Enter to send
              </p>
            </div>

            <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
              {starters.map((starter, i) => {
                const Icon = STARTER_ICONS[i % STARTER_ICONS.length];
                return (
                  <button
                    key={starter.prompt}
                    type="button"
                    onClick={() => handleSend(starter.prompt)}
                    className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/80 px-3.5 py-3 text-left shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card hover:shadow-md"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{starter.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground line-clamp-2">
                        {starter.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div
              className={cn(
                `mx-auto w-full ${CHAT_COLUMN} space-y-4 px-4 py-5 pb-[180px] sm:px-6`,
                !sidebarOpen && !ticket && "pt-12"
              )}
            >
              {visibleMessages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  stream={msg.id === streamingMsgId}
                  onStreamTick={() => scrollToBottom(true)}
                  onStreamDone={() => setStreamingMsgId(null)}
                  onConfirm={() => {
                    const id = confirmProposal(sessionId, msg.id);
                    if (id) {
                      toast.success("Ticket added to Triage", {
                        description: msg.proposal?.title.slice(0, 72),
                        action: {
                          label: "Open in Triage",
                          onClick: () => router.push(`/triage?ticket=${id}`),
                        },
                      });
                    }
                  }}
                  onSendToDev={() => sendProposalToDev(sessionId, msg.id)}
                  onReject={() => rejectProposal(sessionId, msg.id)}
                  onSendCustomerReply={() => {
                    if (sendCustomerReply(sessionId, msg.id)) {
                      toast.success("Reply sent to customer");
                    }
                  }}
                />
              ))}
              {isTyping && <TypingBubble />}
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background from-55% via-background/90 to-transparent pb-2 pt-8"
            style={{ minHeight: COMPOSER_H }}
          >
            <div className={`pointer-events-auto mx-auto w-full ${COMPOSER_COLUMN} px-3 py-2 sm:px-5`}>
              <div className="mb-2.5 flex h-7 gap-2 overflow-x-auto scrollbar-none">
                {starters.slice(0, 3).map((s) => (
                  <button
                    key={s.prompt}
                    type="button"
                    disabled={isTyping || !!streamingMsgId}
                    onClick={() => handleSend(s.prompt)}
                    className="shrink-0 rounded-full bg-muted/50 px-3 py-1 text-[10px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/30 transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <ChatComposer
                input={input}
                setInput={setInput}
                textareaRef={textareaRef}
                isTyping={isTyping || !!streamingMsgId}
                onSend={handleSend}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface PmChatViewProps {
  sessionId: string;
  ticketId?: string;
  sidebarOpen?: boolean;
}

function ChatComposer({
  input,
  setInput,
  textareaRef,
  isTyping,
  onSend,
  large = false,
}: {
  input: string;
  setInput: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isTyping: boolean;
  onSend: (text?: string) => void;
  large?: boolean;
}) {
  const canSend = input.trim().length > 0 && !isTyping;

  return (
    <div className="relative">
      <div
        aria-hidden
        className={cn(
          "absolute -inset-x-1 -bottom-1 top-1/2 rounded-[1.75rem] bg-primary/8 blur-2xl transition-opacity duration-300",
          canSend || large ? "opacity-100" : "opacity-40"
        )}
      />
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-[1.35rem] bg-background/90 p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] ring-1 ring-border/50 backdrop-blur-xl",
          large && "p-2"
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            const el = e.target;
            el.style.height = large ? "52px" : "44px";
            el.style.height = `${Math.min(el.scrollHeight, large ? 140 : 120)}px`;
          }}
          placeholder={large ? "Describe the issue…" : "Message AI PM…"}
          rows={1}
          style={{ height: large ? 52 : 44 }}
          disabled={isTyping}
          autoFocus={large}
          className={cn(
            "flex-1 resize-none overflow-y-auto bg-transparent px-3.5 py-2.5 leading-relaxed outline-none placeholder:text-muted-foreground/55 disabled:opacity-60",
            large ? "text-base" : "text-[15px]"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button
          type="button"
          disabled={!canSend}
          onClick={() => onSend()}
          className={cn(
            "mb-0.5 flex shrink-0 items-center justify-center rounded-full transition-all duration-200",
            large ? "size-10" : "size-9",
            canSend
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:scale-[1.03] hover:opacity-95"
              : "bg-muted/80 text-muted-foreground"
          )}
        >
          <ArrowUp className={large ? "size-5" : "size-4"} />
        </button>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%]">
        <p className="mb-1 pl-1 text-[11px] font-medium text-muted-foreground">AI PM</p>
        <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-md border border-border/60 bg-card px-4 py-3 shadow-sm">
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  msg,
  stream = false,
  onStreamTick,
  onStreamDone,
  onConfirm,
  onSendToDev,
  onReject,
  onSendCustomerReply,
}: {
  msg: PmChatMessage;
  stream?: boolean;
  onStreamTick?: () => void;
  onStreamDone?: () => void;
  onConfirm: () => void;
  onSendToDev: () => void;
  onReject: () => void;
  onSendCustomerReply: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex w-full justify-end animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="max-w-[85%]">
        <p className="mb-1 pl-1 text-[11px] font-medium text-muted-foreground">AI PM</p>
        <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 text-[15px] leading-[1.65] text-foreground/90 shadow-sm">
          <StreamingAgentText
            text={msg.content}
            stream={stream}
            onTick={onStreamTick}
            onDone={onStreamDone}
          />
          {!stream && msg.customerReply && (
            <div className="mt-4 space-y-3 rounded-xl border border-violet-200/60 bg-violet-50/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-violet-900">Draft customer reply</p>
                <span className="text-[10px] text-muted-foreground">via {msg.customerReply.channel}</span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">{msg.customerReply.subject}</p>
              <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                {msg.customerReply.body}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSendCustomerReply}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <Mail className="size-3.5" /> Send to customer
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" /> Not now
                </button>
              </div>
            </div>
          )}
          {!stream && msg.proposal && (
            <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="text-xs font-medium">Ready to act</p>
              <p className="text-sm text-muted-foreground">
                {msg.proposal.title} · {msg.proposal.classification.replace("_", " ")} · Scope {msg.proposal.scope}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onConfirm}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  <Check className="size-3.5" /> Generate ticket
                </button>
                <button
                  type="button"
                  onClick={onSendToDev}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <Send className="size-3.5" /> Send to dev
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" /> Not now
                </button>
              </div>
            </div>
          )}
          {!stream && msg.createdTicketId && (
            <Link
              href={`/triage?ticket=${msg.createdTicketId}`}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Open in Triage
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamingAgentText({
  text,
  stream,
  onTick,
  onDone,
}: {
  text: string;
  stream: boolean;
  onTick?: () => void;
  onDone?: () => void;
}) {
  const [visible, setVisible] = useState(stream ? "" : text);
  const [streaming, setStreaming] = useState(stream);
  const onTickRef = useRef(onTick);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onTickRef.current = onTick;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (!stream) {
      setVisible(text);
      setStreaming(false);
      return;
    }

    setVisible("");
    setStreaming(true);

    const lines = text.split("\n");
    let lineIdx = 0;
    let charIdx = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const finish = () => {
      if (cancelled) return;
      setVisible(text);
      setStreaming(false);
      onDoneRef.current?.();
    };

    const step = () => {
      if (cancelled) return;

      if (lineIdx >= lines.length) {
        finish();
        return;
      }

      const line = lines[lineIdx] ?? "";
      if (charIdx < line.length) {
        charIdx += 1;
        const prefix = lines.slice(0, lineIdx).join("\n");
        const next =
          lineIdx === 0 ? line.slice(0, charIdx) : `${prefix}\n${line.slice(0, charIdx)}`;
        setVisible(next);
        onTickRef.current?.();
        timer = setTimeout(step, 14 + Math.random() * 10);
        return;
      }

      lineIdx += 1;
      charIdx = 0;
      if (lineIdx >= lines.length) {
        finish();
        return;
      }

      const completed = lines.slice(0, lineIdx).join("\n");
      setVisible(completed);
      onTickRef.current?.();
      timer = setTimeout(step, 320);
    };

    timer = setTimeout(step, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, stream]);

  return (
    <div className="whitespace-pre-line">
      {streaming ? visible : formatAgentText(visible)}
      {streaming && (
        <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-px animate-pulse bg-foreground/50 align-middle" />
      )}
    </div>
  );
}

function formatAgentText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
