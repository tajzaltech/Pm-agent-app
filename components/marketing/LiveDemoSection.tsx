"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Check,
  FileCode2,
  Mail,
  PenLine,
  Rocket,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { mono } from "@/components/marketing/theme";

const TIMELINE = [
  "Ticket received",
  "Bug classification confirmed",
  "Similar complaints found",
  "Enterprise accounts affected",
  "Repository connected",
  "Relevant files identified",
  "Payment webhook traced",
  "Idempotency logic inspected",
  "Root-cause hypothesis generated",
  "Engineering scope estimated",
  "Acceptance criteria written",
  "PM approval requested",
];

const ANALYSIS = [
  { at: 2, text: "Duplicate payment reports increased after webhook retry changes." },
  { at: 3, text: "The same transaction identifier appears in multiple failed requests." },
  { at: 6, text: "The retry handler may process previously completed events." },
  { at: 7, text: "The current flow does not appear to validate idempotency before charging." },
];

const FILES = [
  "payments/webhooks/stripe-handler.ts",
  "services/payment-processor.ts",
  "utils/idempotency.ts",
  "checkout/session.ts",
];

const ACCEPTANCE = [
  "Repeated webhook events do not create duplicate charges",
  "Completed transactions return the existing payment result",
  "Retry events are logged with a transaction identifier",
  "Existing successful payment flows remain unaffected",
  "Regression tests cover duplicate and delayed webhook events",
];

const CONTROLS = [
  { label: "Replay Analysis", icon: RotateCcw, primary: false, replay: true },
  { label: "Explore Code", icon: FileCode2, primary: false },
  { label: "Edit Criteria", icon: PenLine, primary: false },
  { label: "Approve Ticket", icon: Check, primary: true },
  { label: "Create in Jira", icon: Rocket, primary: true },
];

export function LiveDemoSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [step, setStep] = useState(0);
  const [runToken, setRunToken] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let iv: ReturnType<typeof setInterval>;
    const raf = requestAnimationFrame(() => {
      setStep(0);
      let s = 0;
      iv = setInterval(() => {
        s += 1;
        setStep(s);
        if (s >= TIMELINE.length) clearInterval(iv);
      }, 780);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (iv) clearInterval(iv);
    };
  }, [inView, runToken]);

  const confidence = Math.min(87, Math.round((step / 9) * 87));
  const done = step >= TIMELINE.length;

  return (
    <section ref={ref} id="demo" className="relative overflow-hidden bg-[#050507] py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-24 h-[30rem] w-[48rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.14),transparent)] blur-2xl" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a48bf0] ${mono}`}>Live Investigation</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Watch Ask PM investigate a real complaint
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/50">
            A customer says they were charged twice. Follow the investigation from the raw ticket to a
            development-ready fix — with a possible root cause and a drafted reply.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[0.85fr_1.3fr_1fr]">
          {/* LEFT — customer ticket */}
          <DemoPanel title="Customer Ticket" tone="left">
            <p className="text-[13.5px] font-medium leading-snug text-white">Payment is being charged twice.</p>
            <p className="mt-2 text-[12px] leading-relaxed text-white/50">
              &ldquo;We were billed twice for order #48213 after retrying checkout. Please refund and fix this.&rdquo;
            </p>
            <div className={`mt-4 space-y-2 text-[11.5px] ${mono}`}>
              {[
                ["Source", "Zendesk"],
                ["Customer", "Acme Logistics"],
                ["Plan", "Enterprise · $148k/yr"],
                ["Priority", "High"],
                ["Sentiment", "Frustrated"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-white/30">{k}</span>
                  <span className="font-medium text-white/70">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/30 p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-white/30">Customer impact</p>
              <div className="mt-2 space-y-1.5 text-[12px] text-white/60">
                <Impact show={step >= 2}>24 similar complaints</Impact>
                <Impact show={step >= 3}>11 customers affected</Impact>
                <Impact show={step >= 3}>4 enterprise accounts</Impact>
                <Impact show={step >= 4}>High reputational risk</Impact>
              </div>
            </div>
          </DemoPanel>

          {/* CENTER — investigation */}
          <DemoPanel title="Ask PM Investigation" tone="center" glow>
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#a48bf0]">
                <Sparkles className="size-3.5" /> {done ? "Investigation complete" : TIMELINE[Math.min(step, TIMELINE.length - 1)]}
              </span>
              <span className={`text-[11px] text-white/40 ${mono}`}>{Math.min(step, 12)}/12</span>
            </div>

            {/* repository scan */}
            <div className="relative overflow-hidden rounded-lg border border-white/[0.07] bg-black/40 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-white/30">
                <Search className="size-3" /> Scanning repository
              </div>
              {step >= 4 && step < 8 && (
                <motion.div
                  className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-[#5b43d6]/20 to-transparent"
                  animate={{ top: ["0%", "80%", "0%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <div className="space-y-1">
                {FILES.map((f, i) => {
                  const lit = step >= 5 + Math.min(i, 2) && i < 3;
                  return (
                    <div
                      key={f}
                      className={cn(
                        "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] transition-colors duration-500",
                        mono,
                        lit ? "bg-[#5b43d6]/10 text-white/80" : "text-white/30"
                      )}
                    >
                      <FileCode2 className={cn("size-3", lit ? "text-[#a48bf0]" : "text-white/20")} />
                      <span className="truncate">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* analysis summaries */}
            <div className="mt-3 space-y-1.5">
              {ANALYSIS.map((a) => (
                <AnimatePresence key={a.text}>
                  {step >= a.at && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 text-[12px] leading-snug text-white/65"
                    >
                      <Check className="mt-0.5 size-3 shrink-0 text-emerald-400" />
                      {a.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {/* code hypothesis */}
            <AnimatePresence>
              {step >= 8 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 overflow-hidden rounded-lg border border-white/[0.07] bg-[#07070c]"
                >
                  <div className={`border-b border-white/[0.06] px-3 py-1.5 text-[10.5px] text-white/35 ${mono}`}>
                    services/payment-processor.ts
                  </div>
                  <pre className={`overflow-x-auto px-3 py-2.5 text-[11px] leading-relaxed text-white/70 ${mono}`}>
                    <code>{`await paymentProcessor.charge({
  customerId,
  amount,
  transactionId
});`}</code>
                  </pre>
                  <div className="border-t border-white/[0.06] px-3 py-1.5 text-[10.5px] text-amber-300/80">
                    Possible missing guard →
                  </div>
                  <pre className={`overflow-x-auto border-l-2 border-[#5b43d6] bg-[#5b43d6]/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-[#c9bcff] ${mono}`}>
                    <code>{`if (await idempotencyStore.exists(transactionId)) {
  return idempotencyStore.get(transactionId);
}`}</code>
                  </pre>
                  <div className="flex items-center justify-between px-3 py-2 text-[11px]">
                    <span className="font-medium text-amber-300">Possible root-cause hypothesis</span>
                    <span className={`text-white/40 ${mono}`}>not confirmed</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </DemoPanel>

          {/* RIGHT — engineering result */}
          <DemoPanel title="Engineering Result" tone="right">
            <div className="flex items-center gap-3">
              <div className="relative flex size-14 items-center justify-center">
                <svg viewBox="0 0 56 56" className="-rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                  <motion.circle
                    cx="28" cy="28" r="22" fill="none" stroke="#5b43d6" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 22}
                    animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - confidence / 100) }}
                    transition={{ ease: "easeOut" }}
                  />
                </svg>
                <span className="absolute text-[13px] font-semibold text-white">{confidence}%</span>
              </div>
              <div className="text-[12px]">
                <p className="text-white/40">Confidence</p>
                <p className="font-medium text-white/80">Scope: Medium</p>
                <p className="text-white/40">~3 files impacted</p>
              </div>
            </div>

            <AnimatePresence>
              {step >= 9 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <p className="text-[13px] font-semibold leading-snug text-white">
                    Prevent duplicate payment processing during webhook retries
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/50">
                    Payment retry events may trigger duplicate transaction processing when the same webhook
                    event is received more than once.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {step >= 11 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 overflow-hidden">
                  <p className={`text-[10.5px] uppercase tracking-wider text-white/30 ${mono}`}>Acceptance criteria</p>
                  <div className="mt-1.5 space-y-1">
                    {ACCEPTANCE.slice(0, 4).map((a) => (
                      <div key={a} className="flex items-start gap-1.5 text-[11px] text-white/55">
                        <Check className="mt-0.5 size-3 shrink-0 text-emerald-400" /> {a}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {done && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#a48bf0]">
                    <Mail className="size-3" /> Customer reply draft
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-white/55">
                    &ldquo;We&rsquo;ve identified a possible issue affecting repeated payment events. Our engineering team is
                    reviewing the payment-processing flow, and we&rsquo;ll update you as soon as the investigation is complete.&rdquo;
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
              {CONTROLS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.replay ? () => setRunToken((t) => t + 1) : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                    c.primary
                      ? "border-[#5b43d6]/40 bg-[#5b43d6]/15 text-[#c9bcff] hover:bg-[#5b43d6]/25"
                      : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-white/80"
                  )}
                >
                  <c.icon className="size-3" /> {c.label}
                </button>
              ))}
            </div>
          </DemoPanel>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-[12px] text-white/35">
          <ShieldCheck className="size-3.5 text-[#a48bf0]" />
          Ask PM proposes — a human PM approves before any ticket is created.
        </p>
      </div>
    </section>
  );
}

function DemoPanel({
  title,
  tone,
  glow,
  children,
}: {
  title: string;
  tone: "left" | "center" | "right";
  glow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[26rem] flex-col rounded-2xl border bg-[#0b0b12]/80 p-4 backdrop-blur-xl",
        glow
          ? "border-[#5b43d6]/30 shadow-[0_0_0_1px_rgba(91,67,214,0.12),0_40px_100px_-40px_rgba(91,67,214,0.5)]"
          : "border-white/[0.08] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
      )}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-[#5b43d6]" />
        <span className={`text-[10.5px] uppercase tracking-wider ${mono} ${tone === "center" ? "text-[#a48bf0]" : "text-white/35"}`}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Impact({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-[#5b43d6]" /> {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
