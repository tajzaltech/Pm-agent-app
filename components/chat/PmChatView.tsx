"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  PaperPlaneTilt,
  EnvelopeSimple,
  X as XIcon,
  Check,
  Robot,
  MagnifyingGlass,
  Code,
  ShieldCheck,
  ChatCircleDots,
  Bug,
  Question,
  Lightbulb,
  ArrowsClockwise,
  Paperclip,
  Microphone,
  Stop,
} from "@phosphor-icons/react";

import { usePmChatStore } from "@/lib/store/pm-chat";
import { useTicketStore } from "@/lib/store/tickets";
import type { PmChatMessage, Ticket } from "@/lib/types";
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
  const confirmProposal = usePmChatStore((s) => s.confirmProposal);
  const sendProposalToDev = usePmChatStore((s) => s.sendProposalToDev);
  const rejectProposal = usePmChatStore((s) => s.rejectProposal);
  const sendCustomerReply = usePmChatStore((s) => s.sendCustomerReply);
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
      if (last) setStreamId(last.id);
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
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl space-y-8">
          {/* Hero heading */}
          <div className="text-center space-y-2">
            {ticket ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[12px] font-semibold text-primary mb-2">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  {ticket.source} · #{ticket.originalTicketId}
                </div>
                <h1 className="text-[32px] font-extrabold tracking-tight leading-tight">
                  {ticket.customer.name}&apos;s issue
                </h1>
              </>
            ) : (
              <h1 className="text-[36px] font-extrabold tracking-tight leading-tight bg-gradient-to-r from-primary via-[oklch(0.55_0.22_300)] to-[oklch(0.50_0.20_320)] bg-clip-text text-transparent font-[family-name:var(--font-display)]">
                Ask PM
              </h1>
            )}
          </div>

          {/* Composer */}
          <Composer
            input={input}
            setInput={setInput}
            textareaRef={textareaRef}
            disabled={isTyping || !!streamId}
            onSend={send}
            large
            placeholder={ticket ? `Ask about #${ticket.originalTicketId}…` : "Describe an issue, paste a customer message, or ask anything…"}
          />

          {/* Prompt suggestions */}
          <div className="grid grid-cols-2 gap-2.5">
            {prompts.map(({ icon: PromptIcon, text, sub }) => (
              <button
                key={text}
                onClick={() => send(text)}
                className="group flex items-start gap-3 rounded-2xl border border-border/40 bg-white px-4 py-3.5 text-left transition-all hover:border-primary/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary mt-0.5 transition-colors group-hover:from-primary/15 group-hover:to-primary/10">
                  <PromptIcon size={16} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground/80 group-hover:text-foreground leading-snug">
                    {text}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {sub}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
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
                const id = confirmProposal(sessionId, msg.id);
                if (id) toast.success("Ticket created");
              }}
              onSendToDev={() => {
                const id = sendProposalToDev(sessionId, msg.id);
                if (id) toast.success("Sent to dev team");
              }}
              onReject={() => rejectProposal(sessionId, msg.id)}
              onCustomerReply={() => {
                if (sendCustomerReply(sessionId, msg.id)) toast.success("Reply sent");
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
  const [recording, setRecording] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
      toast.success(`Attached: ${file.name}`);
    }
    e.target.value = "";
  };

  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
      toast.success("Voice input captured");
      setInput(input + (input ? " " : "") + "Customer reported the issue occurs intermittently during peak hours…");
    } else {
      setRecording(true);
      toast("Listening…", { duration: 2000 });
    }
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
        "flex items-end gap-1 rounded-2xl border border-border/60 bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all focus-within:shadow-[0_2px_20px_rgba(0,0,0,0.08)] focus-within:border-primary/30",
        large && "p-2",
        recording && "border-red-300 ring-1 ring-red-200"
      )}>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.xlsx" onChange={handleFileChange} />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
          title="Attach document"
        >
          <Paperclip size={16} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = large ? "48px" : "40px";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          placeholder={placeholder ?? (large ? "Describe the issue…" : "Ask a follow-up…")}
          rows={1}
          style={{ height: large ? 48 : 40 }}
          disabled={disabled}
          autoFocus={large}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
        />

        <button
          type="button"
          onClick={toggleRecording}
          disabled={disabled}
          className={cn(
            "mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50",
            recording
              ? "bg-red-500 text-white animate-pulse"
              : "text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground"
          )}
          title={recording ? "Stop recording" : "Voice input"}
        >
          {recording ? <Stop size={14} weight="fill" /> : <Microphone size={16} />}
        </button>

        <button
          type="button"
          disabled={!canSend}
          onClick={() => { onSend(); setAttachedFile(null); }}
          className={cn(
            "mb-0.5 flex shrink-0 items-center justify-center rounded-xl transition-all",
            large ? "size-9" : "size-8",
            canSend
              ? "bg-gradient-to-br from-primary to-[oklch(0.50_0.20_310)] text-white shadow-md hover:shadow-lg hover:scale-105"
              : "bg-muted/60 text-muted-foreground/40"
          )}
        >
          <ArrowUp size={16} weight="bold" />
        </button>
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
    setStep(0);
    const intervals: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < steps.length; i++) {
      intervals.push(setTimeout(() => setStep(i), i * (ticket ? 900 : 600)));
    }
    return () => intervals.forEach(clearTimeout);
  }, [steps.length, ticket]);

  const current = steps[Math.min(step, steps.length - 1)];
  const Icon = current.icon;

  return (
    <div className="flex gap-3">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
        <Robot size={14} weight="duotone" />
      </div>
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
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-[oklch(0.50_0.20_310)] px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-in fade-in duration-200">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary mt-0.5">
        <Robot size={14} weight="duotone" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="text-sm leading-[1.7] text-foreground/90">
          <StreamText text={msg.content} stream={!!stream} onTick={onStreamTick} onDone={onStreamDone} />
        </div>

        {!stream && msg.customerReply && (
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <EnvelopeSimple size={14} weight="duotone" className="text-primary" />
              <p className="text-[12px] font-semibold">Draft reply to {msg.customerReply.customerName}</p>
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

        {!stream && msg.createdTicketId && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200/60 px-3 py-2">
            <Check size={14} weight="bold" className="text-emerald-600" />
            <p className="text-[13px] font-medium text-emerald-700">Ticket created successfully</p>
          </div>
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
        <ActionBtn icon={EnvelopeSimple} label="Draft customer reply" onClick={onDraftReply} variant="primary" />
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
    if (!stream) { setVis(text); setActive(false); return; }
    setVis(""); setActive(true);

    const lines = text.split("\n");
    let li = 0, ci = 0, cancelled = false;
    let t: ReturnType<typeof setTimeout>;

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
    return () => { cancelled = true; clearTimeout(t); };
  }, [text, stream]);

  return (
    <div>
      {active ? <span className="whitespace-pre-line">{vis}</span> : <Markdown>{vis}</Markdown>}
      {active && <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-px animate-pulse bg-foreground/40 align-middle" />}
    </div>
  );
}
