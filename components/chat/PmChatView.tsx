"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowUp,
  PaperPlaneTilt,
  EnvelopeSimple,
  X as XIcon,
  Check,
  MagnifyingGlass,
  Code,
  ShieldCheck,
  Bug,
  Question,
  Lightbulb,
  ArrowsClockwise,
  Paperclip,
  Plus,
} from "@phosphor-icons/react";

import { usePmChatStore } from "@/lib/store/pm-chat";
import { useTicketStore } from "@/lib/store/tickets";
import type { PmChatMessage, Ticket } from "@/lib/types";
import { PMAgentLogo } from "@/components/shared/BrandLogos";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const COL = "max-w-[720px]";
const EMPTY: PmChatMessage[] = [];

function isVisible(msg: PmChatMessage) {
  return !msg.id.startsWith("sys_");
}

interface Props {
  sessionId: string;
  ticketId?: string;
}

export function PmChatView({ sessionId, ticketId }: Props) {
  const ticket = useTicketStore((s) => (ticketId ? s.getById(ticketId) : undefined));
  const messages = usePmChatStore((s) => s.messagesBySession[sessionId] ?? EMPTY);
  const isTyping = usePmChatStore((s) => s.typingBySession[sessionId] ?? false);
  const sendUserMessage = usePmChatStore((s) => s.sendUserMessage);
  const draftProposalReply = usePmChatStore((s) => s.draftProposalReply);
  const sendProposalToDev = usePmChatStore((s) => s.sendProposalToDev);
  const rejectProposal = usePmChatStore((s) => s.rejectProposal);
  const sendCustomerReply = usePmChatStore((s) => s.sendCustomerReply);
  const router = useRouter();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const wasTypingRef = useRef(false);
  const prevCountRef = useRef(0);

  const visible = useMemo(() => messages.filter(isVisible), [messages]);
  const hasMessages = visible.some((m) => m.role === "user");

  const scrollBottom = useCallback((smooth: boolean) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (wasTypingRef.current && !isTyping) {
      const last = [...visible].reverse().find((m) => m.role === "pm");
      if (last) {
        const raf = requestAnimationFrame(() => setStreamId(last.id));
        wasTypingRef.current = isTyping;
        return () => cancelAnimationFrame(raf);
      }
    }
    wasTypingRef.current = isTyping;
  }, [isTyping, visible]);

  useEffect(() => {
    const n = visible.length + (isTyping ? 1 : 0) + (streamId ? 1 : 0);
    const grew = n > prevCountRef.current;
    prevCountRef.current = n;
    if (hasMessages) scrollBottom(grew);
  }, [visible.length, isTyping, streamId, scrollBottom, hasMessages]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isTyping || streamId) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    sendUserMessage(sessionId, content, ticket ?? null);
  };

  /* ─── Empty state ─── */
  if (!hasMessages) {
    const prompts = ticket
      ? [
          { icon: MagnifyingGlass, text: "Investigate this ticket", sub: "Deep-dive into root cause" },
          { icon: Bug, text: "Is this a bug or config issue?", sub: "Classify and assess severity" },
          { icon: Code, text: "Who should own the fix?", sub: "Route to the right team" },
          { icon: EnvelopeSimple, text: "Review and draft customer reply", sub: "Prepare a response" },
        ]
      : [
          { icon: MagnifyingGlass, text: "Customer says checkout is failing", sub: "Triage a support ticket" },
          { icon: Bug, text: "500 errors after yesterday's deploy", sub: "Investigate a production issue" },
          { icon: PaperPlaneTilt, text: "Draft a Jira ticket for a bug", sub: "Create a dev-ready ticket" },
          { icon: EnvelopeSimple, text: "Help me write a customer response", sub: "Draft a professional reply" },
        ];

    return (
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
        {/* ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[28%] h-[28rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.09),transparent)] blur-2xl" />
          <div
            className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_55%_45%_at_50%_32%,black,transparent)]"
            style={{
              backgroundImage: "radial-gradient(rgba(91,67,214,0.14) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[820px] -translate-y-4 space-y-8 sm:space-y-9"
        >
          {/* Hero heading */}
          <div className="flex flex-col items-center space-y-3 text-center">
            {ticket ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[12px] font-semibold text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  {ticket.source} · #{ticket.originalTicketId}
                </div>
                <h1 className="text-[32px] font-extrabold tracking-tight leading-tight">
                  {ticket.customer.name}&apos;s issue
                </h1>
              </>
            ) : (
              <>
                <Image
                  src="/ask-pm-logo-v3.png"
                  alt="Ask PM"
                  width={512}
                  height={512}
                  className="size-14 object-contain"
                />
                <h1 className="text-[38px] font-extrabold tracking-[-0.045em] leading-none bg-gradient-to-r from-primary via-[#6D52DE] to-[#8E6CF3] bg-clip-text text-transparent sm:text-[42px]">
                  Ask PM
                </h1>
              </>
            )}
          </div>

          {/* Composer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Composer
              input={input}
              setInput={setInput}
              textareaRef={textareaRef}
              disabled={isTyping || !!streamId}
              onSend={send}
              large
              placeholder={ticket ? `Ask about #${ticket.originalTicketId}…` : "Ask anything…"}
            />
          </motion.div>

          {/* Prompt suggestions */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {prompts.map(({ icon: PromptIcon, text, sub }, i) => (
              <motion.button
                key={text}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => send(text)}
                className="group flex min-h-[68px] items-center gap-3.5 rounded-2xl border border-border/55 bg-card px-6 py-3 text-left shadow-[0_1px_2px_rgba(35,24,67,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_28px_-10px_rgba(91,67,214,0.18)] active:translate-y-0"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl text-primary transition-all duration-200 group-hover:text-primary/70">
                  <PromptIcon size={17} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-foreground/85 group-hover:text-foreground leading-snug">
                    {text}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground/70">
                    {sub}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Conversation ─── */
  return (
    <div className="relative flex flex-1 min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className={`mx-auto w-full ${COL} px-4 py-6 pb-[140px] space-y-5`}>
          {visible.map((msg) => (
            <Bubble
              key={msg.id}
              msg={msg}
              stream={msg.id === streamId}
              onStreamTick={() => scrollBottom(true)}
              onStreamDone={() => setStreamId(null)}
              onConfirm={() => {
                draftProposalReply(sessionId, msg.id);
              }}
              onSendToDev={() => {
                const id = sendProposalToDev(sessionId, msg.id);
                if (id) router.push("/pipeline");
              }}
              onReject={() => rejectProposal(sessionId, msg.id)}
              onCustomerReply={() => {
                if (sendCustomerReply(sessionId, msg.id)) toast.success("Message sent");
              }}
            />
          ))}
          {isTyping && <InvestigatingIndicator ticket={ticket} />}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white from-60% to-transparent pt-6 pb-3">
        <div className={`mx-auto w-full ${COL} px-4`}>
          <Composer
            input={input}
            setInput={setInput}
            textareaRef={textareaRef}
            disabled={isTyping || !!streamId}
            onSend={send}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Composer ─────────────────────── */

function Composer({
  input, setInput, textareaRef, disabled, onSend, large = false, placeholder,
}: {
  input: string;
  setInput: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
  onSend: (text?: string) => void;
  large?: boolean;
  placeholder?: string;
}) {
  const canSend = input.trim().length > 0 && !disabled;
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
      toast.success(`Attached: ${file.name}`);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-0">
      {attachedFile && (
        <div className="flex items-center gap-2 px-3 pb-1">
          <div className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Paperclip size={11} />
            {attachedFile}
            <button type="button" onClick={() => setAttachedFile(null)} className="ml-1 hover:text-foreground">
              <XIcon size={10} />
            </button>
          </div>
        </div>
      )}
      <div className={cn(
        "flex items-center gap-2 rounded-[26px] border border-border/70 bg-card p-2.5 shadow-[0_3px_16px_rgba(38,24,78,0.06)] transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-[0_10px_32px_-6px_rgba(98,65,196,0.22)]",
        large && "rounded-[28px] border-black/[0.07] p-3 shadow-[0_10px_32px_-10px_rgba(46,26,120,0.16)] focus-within:border-primary/35",
      )}>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.xlsx" onChange={handleFileChange} />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = large ? "28px" : "24px";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          placeholder={placeholder ?? (large ? "Describe the issue…" : "Ask a follow-up…")}
          rows={1}
          style={{ height: large ? 28 : 24 }}
          disabled={disabled}
          autoFocus={large}
          className={cn(
            "h-8 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/55 disabled:opacity-50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            large && "text-[15px] font-medium placeholder:text-primary/45"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
        />

        <div className="contents">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className={cn(
              "order-first flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
              large ? "size-9" : "size-8"
            )}
            title="Add attachment"
          >
            <Plus size={large ? 19 : 17} weight="regular" />
          </button>

          <button
            type="button"
            disabled={!canSend}
            onClick={() => {
              onSend();
              setAttachedFile(null);
            }}
            className={cn(
              "order-last flex shrink-0 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45",
              large ? "size-9" : "size-8",
              canSend
                ? "bg-gradient-to-br from-primary to-[#8E6CF3] hover:shadow-lg"
                : "bg-muted text-muted-foreground"
            )}
          >
            <ArrowUp size={17} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Investigation indicator ─────────────────────── */

const TICKET_STEPS = [
  { icon: MagnifyingGlass, label: "Reading ticket details…" },
  { icon: Code, label: "Searching the system…" },
  { icon: ShieldCheck, label: "Analyzing impact…" },
];

const GENERIC_STEPS = [
  { icon: MagnifyingGlass, label: "Understanding the issue…" },
  { icon: ArrowsClockwise, label: "Thinking…" },
];

function InvestigatingIndicator({ ticket }: { ticket?: Ticket }) {
  const [step, setStep] = useState(0);
  const steps = ticket ? TICKET_STEPS : GENERIC_STEPS;

  useEffect(() => {
    const intervals: ReturnType<typeof setTimeout>[] = [];
    const raf = requestAnimationFrame(() => {
      setStep(0);
      for (let i = 1; i < steps.length; i++) {
        intervals.push(setTimeout(() => setStep(i), i * (ticket ? 900 : 600)));
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      intervals.forEach(clearTimeout);
    };
  }, [steps.length, ticket]);

  return (
    <div className="flex gap-3">
      <PMAgentLogo className="size-5 shrink-0 object-contain" />
      <div className="space-y-2 pt-0.5">
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 text-[12px] transition-all duration-300",
                isActive && "text-primary font-medium",
                isDone && "text-muted-foreground/50",
                i > step && "text-muted-foreground/30"
              )}
            >
              <StepIcon
                size={13}
                weight={isActive ? "fill" : "regular"}
                className={cn(isActive && "animate-pulse")}
              />
              {s.label}
              {isDone && <Check size={10} weight="bold" className="text-emerald-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────── Bubble ─────────────────────── */

function Bubble({
  msg, stream, onStreamTick, onStreamDone, onConfirm, onSendToDev, onReject, onCustomerReply,
}: {
  msg: PmChatMessage;
  stream?: boolean;
  onStreamTick?: () => void;
  onStreamDone?: () => void;
  onConfirm: () => void;
  onSendToDev: () => void;
  onReject: () => void;
  onCustomerReply: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-[#8E6CF3] px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-in fade-in duration-200">
      <PMAgentLogo className="mt-0.5 size-5 shrink-0 object-contain" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="text-sm leading-[1.7] text-foreground/90">
          <StreamText text={msg.content} stream={!!stream} onTick={onStreamTick} onDone={onStreamDone} />
        </div>

        {!stream && msg.customerReply && (
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <EnvelopeSimple size={14} weight="duotone" className="text-primary" />
              <p className="text-[12px] font-semibold">Draft message for {msg.customerReply.customerName}</p>
            </div>
            <div className="rounded-lg border bg-card px-3.5 py-3 space-y-1.5">
              <p className="text-[11px] font-mono text-muted-foreground">Subject: {msg.customerReply.subject}</p>
              <div className="border-t pt-2 text-[13px] leading-relaxed whitespace-pre-line">
                {msg.customerReply.body}
              </div>
            </div>
            <div className="flex gap-2">
              <ActionBtn icon={EnvelopeSimple} label={`Send via ${msg.customerReply.channel}`} onClick={onCustomerReply} variant="primary" />
              <ActionBtn icon={XIcon} label="Dismiss" onClick={onReject} />
            </div>
          </div>
        )}

        {!stream && msg.proposal && (
          <ProposalCard
            proposal={msg.proposal}
            onSendToDev={onSendToDev}
            onDraftReply={onConfirm}
            onDismiss={onReject}
          />
        )}

      </div>
    </div>
  );
}

/* ─────────────────────── Proposal card ─────────────────────── */

const CLASS_META: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  bug: { icon: Bug, label: "Bug", color: "text-red-600 bg-red-50 border-red-100" },
  feature_request: { icon: Lightbulb, label: "Feature", color: "text-blue-600 bg-blue-50 border-blue-100" },
  question: { icon: Question, label: "Question", color: "text-amber-600 bg-amber-50 border-amber-100" },
  churn_signal: { icon: ShieldCheck, label: "Churn risk", color: "text-orange-600 bg-orange-50 border-orange-100" },
};

function ProposalCard({ proposal, onSendToDev, onDraftReply, onDismiss }: {
  proposal: { title: string; classification: string; scope: string; summary: string };
  onSendToDev: () => void;
  onDraftReply: () => void;
  onDismiss: () => void;
}) {
  const meta = CLASS_META[proposal.classification] ?? CLASS_META.bug;
  const ClassIcon = meta.icon;
  const scopeLabel = proposal.scope === "S" ? "Small" : proposal.scope === "M" ? "Medium" : "Large";

  return (
    <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-b from-emerald-50/40 to-transparent p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Ready to take action</p>
          <p className="text-[14px] font-medium leading-snug text-foreground">{proposal.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium", meta.color)}>
          <ClassIcon size={10} weight="fill" />
          {meta.label}
        </span>
        <span className="inline-flex items-center rounded-md border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Scope: {scopeLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <ActionBtn icon={PaperPlaneTilt} label="Create ticket for dev" onClick={onSendToDev} variant="emerald" />
        <ActionBtn icon={EnvelopeSimple} label="Draft Slack message" onClick={onDraftReply} variant="primary" />
        <ActionBtn icon={XIcon} label="Not now" onClick={onDismiss} />
      </div>
    </div>
  );
}

/* ─────────────────────── Action button ─────────────────────── */

function ActionBtn({ icon: Icon, label, onClick, variant = "default" }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "emerald";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
        variant === "emerald" && "bg-emerald-600 text-white hover:bg-emerald-700",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "default" && "border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

/* ─────────────────────── Markdown renderer ─────────────────────── */

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-[1.7]">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[15px] font-bold mt-3 mb-1.5 text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="text-[14px] font-semibold mt-3 mb-1 text-foreground">{children}</h3>,
        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 marker:text-muted-foreground/50">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 marker:text-muted-foreground/50">{children}</ol>,
        li: ({ children }) => <li className="leading-[1.6] text-[13.5px]">{children}</li>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className={cn("block rounded-lg bg-muted/60 border px-4 py-3 text-[12px] font-mono leading-relaxed overflow-x-auto my-2", className)} {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className="rounded-md bg-muted/60 border px-1.5 py-0.5 text-[12px] font-mono text-foreground" {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="my-2">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-primary/30 pl-3 text-muted-foreground italic">{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">{children}</a>
        ),
        hr: () => <hr className="my-3 border-border/50" />,
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto rounded-lg border">
            <table className="w-full text-[12px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/40 border-b">{children}</thead>,
        th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold text-foreground">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5 border-t border-border/40">{children}</td>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

/* ─────────────────────── Streaming text ─────────────────────── */

function StreamText({ text, stream, onTick, onDone }: {
  text: string; stream: boolean; onTick?: () => void; onDone?: () => void;
}) {
  const [vis, setVis] = useState(stream ? "" : text);
  const [active, setActive] = useState(stream);
  const tickRef = useRef(onTick);
  const doneRef = useRef(onDone);
  useEffect(() => { tickRef.current = onTick; doneRef.current = onDone; });

  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;

    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      if (!stream) { setVis(text); setActive(false); return; }
      setVis(""); setActive(true);

      const lines = text.split("\n");
      let li = 0, ci = 0;

      const finish = () => { if (!cancelled) { setVis(text); setActive(false); doneRef.current?.(); } };
      const step = () => {
        if (cancelled) return;
        if (li >= lines.length) { finish(); return; }
        const line = lines[li] ?? "";
        if (ci < line.length) {
          ci++;
          const pre = lines.slice(0, li).join("\n");
          setVis(li === 0 ? line.slice(0, ci) : `${pre}\n${line.slice(0, ci)}`);
          tickRef.current?.();
          t = setTimeout(step, 8 + Math.random() * 6);
          return;
        }
        li++; ci = 0;
        if (li >= lines.length) { finish(); return; }
        setVis(lines.slice(0, li).join("\n"));
        tickRef.current?.();
        t = setTimeout(step, 150);
      };
      t = setTimeout(step, 80);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [text, stream]);

  return (
    <div>
      {active ? <span className="whitespace-pre-line">{vis}</span> : <Markdown>{vis}</Markdown>}
      {active && <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-px animate-pulse bg-foreground/40 align-middle" />}
    </div>
  );
}
