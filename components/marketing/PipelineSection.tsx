"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  Boxes,
  Check,
  FileCode2,
  GitBranch,
  Inbox,
  ListChecks,
  Loader2,
  Ruler,
  ShieldCheck,
  Tag,
  UserCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { mono } from "@/components/marketing/theme";
import { GhostButton, GlowChip, PanelChrome, SolidButton } from "@/components/marketing/PanelChrome";

const STAGES = [
  { icon: Inbox, title: "Ticket Intake", sub: "Pull the ticket with full account context" },
  { icon: Tag, title: "Classification", sub: "Bug, Feature, Question, or Churn Risk" },
  { icon: Boxes, title: "Signal Grouping", sub: "Cluster similar complaints into one signal" },
  { icon: GitBranch, title: "Codebase Investigation", sub: "Trace the report to the code that owns it" },
  { icon: Ruler, title: "Engineering Scope", sub: "Size the work and score confidence" },
  { icon: FileCode2, title: "Dev-Ready Ticket", sub: "Write the ticket, line by line" },
  { icon: UserCheck, title: "Human Approval", sub: "A PM approves before anything ships" },
];

export function PipelineSection() {
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    return scrollYProgress.on("change", (p) => {
      const i = Math.min(STAGES.length - 1, Math.max(0, Math.floor(p * STAGES.length)));
      setIndex(i);
    });
  }, [scrollYProgress]);

  return (
    <section ref={ref} id="pipeline" className="relative bg-[#09090d]" style={{ height: `${STAGES.length * 66}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]" />
        <div className="pointer-events-none absolute right-0 top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 translate-x-1/3 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.18),transparent)] blur-2xl" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* stage rail */}
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a48bf0] ${mono}`}>
              Intelligence Pipeline
            </p>
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              One ticket, seven decisions — watched end to end.
            </h2>

            <div className="relative mt-8 pl-6">
              <div className="absolute left-[7px] top-1.5 h-[calc(100%-1.5rem)] w-px bg-white/[0.08]" />
              <motion.div
                style={{ height: lineHeight }}
                className="absolute left-[7px] top-1.5 w-px bg-gradient-to-b from-[#5b43d6] to-[#a48bf0]"
              />
              <ul className="space-y-3.5">
                {STAGES.map((s, i) => {
                  const active = i === index;
                  const passed = i < index;
                  return (
                    <li key={s.title} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[22px] top-1 flex size-3.5 items-center justify-center rounded-full border-2 transition-colors duration-300",
                          active
                            ? "border-[#5b43d6] bg-[#5b43d6]"
                            : passed
                              ? "border-[#5b43d6] bg-[#09090d]"
                              : "border-white/15 bg-[#09090d]"
                        )}
                      >
                        {passed && <Check className="size-2 text-[#a48bf0]" strokeWidth={4} />}
                      </span>
                      <button
                        type="button"
                        className={cn(
                          "block text-left transition-colors duration-300",
                          active ? "text-white" : "text-white/35"
                        )}
                      >
                        <span className="flex items-center gap-2 text-[14px] font-semibold">
                          <s.icon className={cn("size-3.5", active ? "text-[#a48bf0]" : "text-white/30")} />
                          {s.title}
                        </span>
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="block overflow-hidden text-[12.5px] text-white/45"
                            >
                              {s.sub}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* transforming ticket */}
          <div className="relative h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <StageVisual index={index} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── one card per stage, all distinct ────────────────────── */

function Frame({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <PanelChrome label={label} icon={icon} tone="brand" glow>
      {children}
    </PanelChrome>
  );
}

function StageVisual({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <Frame label="Ticket Intake" icon={Inbox}>
          <p className="text-[15px] font-medium leading-snug text-white">Payment was charged twice after checkout.</p>
          <div className={`mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[12px] ${mono}`}>
            {[
              ["Source", "Zendesk"],
              ["Customer", "Acme Logistics"],
              ["Priority", "High"],
              ["Plan", "Enterprise"],
              ["Sentiment", "Frustrated"],
              ["Support history", "6 prior tickets"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-white/30">{k}</p>
                <p className="font-medium text-white/75">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2 text-[12px] text-white/50">
            <Inbox className="size-3.5 text-[#a48bf0]" /> Pulled into Ask PM · product area: Payments
          </div>
        </Frame>
      );
    case 1:
      return (
        <Frame label="Classification" icon={Tag}>
          <div className="space-y-3">
            {[
              ["Bug", 86, true],
              ["Churn Risk", 42, false],
              ["Customer Question", 18, false],
              ["Feature Request", 9, false],
            ].map(([label, val, sel]) => (
              <div key={label as string}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className={cn("font-medium", sel ? "text-white" : "text-white/45")}>{label}</span>
                  <span className={cn(mono, sel ? "text-[#a48bf0]" : "text-white/35")}>{val}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn("h-full rounded-full", sel ? "bg-gradient-to-r from-[#5b43d6] to-[#a48bf0]" : "bg-white/15")}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2 rounded-lg border border-[#5b43d6]/30 bg-[#5b43d6]/10 px-3 py-2 text-[12px] font-medium text-[#a48bf0]">
            <Tag className="size-3.5" /> Classified as Bug · high confidence
          </div>
        </Frame>
      );
    case 2:
      return (
        <Frame label="Signal Grouping" icon={Boxes}>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["24", "similar tickets"],
              ["11", "affected customers"],
              ["4", "enterprise accounts"],
              ["$92k", "ARR at risk"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="text-2xl font-semibold text-white">{n}</p>
                <p className="text-[11.5px] text-white/45">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex-1 rounded-xl border border-white/[0.06] bg-black/30 p-3">
            <p className={`mb-2 text-[10.5px] uppercase tracking-wider text-white/30 ${mono}`}>Recurring themes</p>
            {["Duplicate charge on retry", "Delayed refund confirmation", "Webhook double-send"].map((t, i) => (
              <div key={t} className="flex items-center gap-2 py-0.5 text-[12px] text-white/60">
                <span className="size-1.5 rounded-full bg-[#5b43d6]" style={{ opacity: 1 - i * 0.25 }} /> {t}
              </div>
            ))}
          </div>
        </Frame>
      );
    case 3:
      return (
        <Frame label="Codebase Investigation" icon={GitBranch}>
          <p className={`mb-2 text-[11px] text-white/40 ${mono}`}>Tracing: Checkout → Payment service → Stripe webhook → Retry handler → Idempotency validator</p>
          <div className="flex-1 space-y-1.5">
            {[
              ["payments/webhooks/stripe-handler.ts", true],
              ["services/payment-processor.ts", true],
              ["utils/idempotency.ts", true],
              ["checkout/session.ts", false],
              ["lib/stripe/client.ts", false],
            ].map(([f, hot], i) => (
              <motion.div
                key={f as string}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px]",
                  mono,
                  hot ? "border-[#5b43d6]/30 bg-[#5b43d6]/[0.08] text-white/80" : "border-white/[0.06] bg-black/20 text-white/35"
                )}
              >
                <FileCode2 className={cn("size-3.5", hot ? "text-[#a48bf0]" : "text-white/25")} />
                <span className="truncate">{f}</span>
                {hot ? <span className="ml-auto text-[10px] text-[#a48bf0]">suspect</span> : null}
              </motion.div>
            ))}
          </div>
        </Frame>
      );
    case 4:
      return (
        <Frame label="Engineering Scope" icon={Ruler}>
          <div className="flex items-center gap-5">
            <ConfidenceRing value={87} />
            <div className="space-y-2">
              {[
                ["Scope", "Medium"],
                ["Files impacted", "~3"],
                ["Testing", "Moderate"],
                ["Risk", "Contained"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-[12.5px]">
                  <span className="w-24 text-white/40">{k}</span>
                  <span className="font-medium text-white/80">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2">
            {["Small", "Medium", "Large"].map((s) => (
              <div
                key={s}
                className={cn(
                  "rounded-lg border py-2 text-center text-[12px] font-medium",
                  s === "Medium" ? "border-[#5b43d6]/40 bg-[#5b43d6]/12 text-[#a48bf0]" : "border-white/[0.07] text-white/35"
                )}
              >
                {s}
              </div>
            ))}
          </div>
        </Frame>
      );
    case 5:
      return (
        <Frame label="Dev-Ready Ticket" icon={FileCode2}>
          <p className="text-[14px] font-semibold text-white">Prevent duplicate payment processing during webhook retries</p>
          <div className="mt-3 flex-1 space-y-1.5">
            {[
              "Problem: retry events may reprocess a completed charge",
              "Impact: 11 customers · 4 enterprise accounts",
              "Root-cause hypothesis: missing idempotency check",
              "Acceptance: duplicate events return original result",
              "Tests: cover repeated & delayed Stripe webhooks",
            ].map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.14 }}
                className="flex items-start gap-2 text-[12px] text-white/65"
              >
                <ListChecks className="mt-0.5 size-3.5 shrink-0 text-[#a48bf0]" />
                <span>{line}</span>
              </motion.div>
            ))}
          </div>
        </Frame>
      );
    default:
      return (
        <Frame label="Human Approval" icon={UserCheck}>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <p className="text-[13px] font-semibold leading-snug text-white">Prevent duplicate payment processing…</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <GlowChip dot="bg-red-400 text-red-400" className="border-red-500/25 bg-red-500/10 text-red-300">
                Bug
              </GlowChip>
              <GlowChip className="border-white/10 bg-white/5 text-white/60">Scope: M</GlowChip>
              <GlowChip dot="bg-emerald-400 text-emerald-400" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                87% conf
              </GlowChip>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8b6ff5] to-[#5b43d6] text-[10.5px] font-bold text-white shadow-[0_4px_14px_-2px_rgba(91,67,214,0.6)]">
              JR
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-white/85">Jordan Reyes · Product Manager</p>
              <p className="text-[10.5px] text-white/40">Reviewing now</p>
            </div>
            <span className="relative flex size-1.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <SolidButton tone="emerald" className="w-full">
              <Check className="size-3.5" /> Approve
            </SolidButton>
            <GhostButton className="w-full">Edit</GhostButton>
            <GhostButton className="w-full">Send Back</GhostButton>
          </div>

          <div className="mt-auto space-y-1.5 pt-4">
            {["Draft ready for review", "PM notified", "Awaiting decision"].map((step, i) => (
              <div
                key={step}
                className={cn("flex items-center gap-2 text-[11.5px]", i < 2 ? "text-white/40" : "font-medium text-white/75")}
              >
                {i < 2 ? (
                  <Check className="size-3 shrink-0 text-emerald-400" />
                ) : (
                  <Loader2 className="size-3 shrink-0 animate-spin text-[#a48bf0]" />
                )}
                {step}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[12px] text-white/45">
            <ShieldCheck className="size-3.5 shrink-0 text-[#a48bf0]" /> Creates in
            <span className="flex gap-1.5">
              {["Jira", "Linear", "GitHub"].map((t) => (
                <span key={t} className={`rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-white/65 ${mono}`}>
                  {t}
                </span>
              ))}
            </span>
          </div>
        </Frame>
      );
  }
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[86px] shrink-0">
      <svg viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#5b43d6"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-white">{value}%</span>
        <span className="text-[9px] uppercase tracking-wider text-white/40">conf</span>
      </div>
    </div>
  );
}
