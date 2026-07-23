"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Check,
  ChevronDown,
  CircleDot,
  FileCode2,
  Gauge,
  Inbox,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { mono } from "@/components/marketing/theme";
import { GlowChip, PanelChrome } from "@/components/marketing/PanelChrome";

const REASONING = [
  "Reading complaint",
  "Detecting duplicate payment issue",
  "Classifying as Bug",
  "Searching related complaints",
  "Finding affected accounts",
  "Investigating repository",
  "Tracing payment webhook",
  "Checking idempotency logic",
  "Estimating engineering scope",
  "Writing acceptance criteria",
];

const CODE_REFS = [
  "payments/webhooks/stripe-handler.ts",
  "services/payment-processor.ts",
  "utils/idempotency.ts",
];

const ACCEPTANCE = [
  "Duplicate webhook events do not create duplicate charges",
  "Retry events return the original transaction result",
  "Regression tests cover repeated Stripe webhook events",
];

const PLATFORMS = ["Zendesk", "Freshdesk", "Intercom", "Help Scout", "GitHub", "Jira", "Linear"];

// deterministic particle field (avoids hydration mismatch)
const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 53.3) % 100,
  size: (i % 3) + 1,
  delay: (i % 7) * 0.4,
  dur: 5 + (i % 5),
}));

export function HeroSection() {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // live reasoning ticker → also drives the right-hand ticket assembly
  useEffect(() => {
    let d = 0;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      const delay = d >= REASONING.length ? 2600 : 620;
      timer = setTimeout(() => {
        d = d >= REASONING.length ? 0 : d + 1;
        setDone(d);
        run();
      }, delay);
    };
    run();
    return () => clearTimeout(timer);
  }, []);

  // cursor-reactive parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const leftX = useTransform(sx, [-1, 1], [16, -16]);
  const leftY = useTransform(sy, [-1, 1], [10, -10]);
  const rightX = useTransform(sx, [-1, 1], [-16, 16]);
  const rightY = useTransform(sy, [-1, 1], [-10, 10]);
  const centerY = useTransform(sy, [-1, 1], [6, -6]);

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  const progress = done / REASONING.length;
  const confidence = Math.round(progress * 87);
  const complete = done >= REASONING.length;

  return (
    <section
      ref={sectionRef}
      id="top"
      onMouseMove={onMove}
      className="relative flex min-h-screen items-center overflow-hidden pt-40 pb-16 sm:pt-48"
    >
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_70%_55%_at_50%_35%,black,transparent)]" />
        <div className="absolute left-1/2 top-1/3 h-[38rem] w-[52rem] -translate-x-1/2 -translate-y-1/3 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.28),transparent)] blur-[40px]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#050507] to-transparent" />
        {!reduce &&
          PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-[#a48bf0]/40"
              style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
              animate={{ y: [0, -18, 0], opacity: [0.15, 0.6, 0.15] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
      </div>

      <div className="mx-auto w-full max-w-6xl px-6">
        {/* headline */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.03em] text-white sm:text-6xl">
            <MaskLine delay={0.05}>Support tickets in.</MaskLine>
            <MaskLine delay={0.18}>
              <span className="bg-gradient-to-r from-white via-[#c9bcff] to-[#8b6ff5] bg-clip-text text-transparent">
                Engineering-ready work out.
              </span>
            </MaskLine>
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-8"
          >
            <p className={`text-[11px] uppercase tracking-wider text-white/30 ${mono}`}>
              Reads from support · investigates code · ships to your tracker
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {PLATFORMS.map((p) => (
                <span key={p} className={`text-[13px] font-medium text-white/35 ${mono}`}>
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 3-panel product preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16 grid items-stretch gap-4 lg:grid-cols-[1fr_1.1fr_1fr]"
        >
          {/* flow lanes (desktop) */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <FlowLane className="left-[33%] w-[6%]" active={done > 0} />
            <FlowLane className="left-[61%] w-[6%]" active={complete} />
          </div>

          {/* LEFT — incoming ticket */}
          <motion.div style={reduce ? undefined : { x: leftX, y: leftY }}>
            <PanelChrome label="Incoming · Zendesk" icon={Inbox}>
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-[11px] font-bold text-white shadow-[0_4px_14px_-2px_rgba(56,132,255,0.6)]">
                  AL
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-white/90">Acme Logistics</p>
                  <p className="text-[10.5px] text-white/40">Enterprise · $148k / yr</p>
                </div>
              </div>
              <p className="mt-3.5 text-[13.5px] font-medium leading-snug text-white/90">
                &ldquo;Payment was charged twice after checkout.&rdquo;
              </p>
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <MetaTile k="Priority" v="High" tone="text-red-300" />
                <MetaTile k="Sentiment" v="Frustrated" tone="text-amber-300" />
                <MetaTile k="Ticket age" v="14 min" />
                <MetaTile k="Source" v="Zendesk" />
              </div>
              <div className="mt-auto pt-3.5">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/50">
                  <CircleDot className="size-3 shrink-0 text-white/30" /> Awaiting triage
                </div>
              </div>
            </PanelChrome>
          </motion.div>

          {/* CENTER — Ask PM reasoning */}
          <motion.div style={reduce ? undefined : { y: centerY }}>
            <PanelChrome label="Ask PM · analyzing" icon={Sparkles} tone="brand" glow>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-white">Reasoning</span>
                <span className={`rounded-full bg-white/[0.06] px-2 py-0.5 text-[10.5px] text-white/50 ${mono}`}>
                  {Math.min(done, REASONING.length)}/{REASONING.length}
                </span>
              </div>
              <ul className="h-[196px] space-y-1 overflow-hidden">
                {REASONING.map((r, i) => {
                  const isDone = i < done;
                  const isActive = i === done && !complete;
                  return (
                    <li
                      key={r}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-[5px] text-[12px] transition-all duration-300",
                        isActive && "bg-[#5b43d6]/12 text-white ring-1 ring-inset ring-[#5b43d6]/25",
                        isDone && !isActive && "text-white/40",
                        !isDone && !isActive && "text-white/18"
                      )}
                    >
                      {isDone ? (
                        <Check className="size-3.5 shrink-0 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-[#a48bf0]" />
                      ) : (
                        <span className="size-3.5 shrink-0 rounded-full border border-white/15" />
                      )}
                      <span className="truncate">{r}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#5b43d6] to-[#a48bf0] shadow-[0_0_10px_1px_rgba(164,139,240,0.6)]"
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
                <span className={`text-[10.5px] text-white/40 ${mono}`}>{Math.round(progress * 100)}%</span>
              </div>
            </PanelChrome>
          </motion.div>

          {/* RIGHT — engineering-ready ticket */}
          <motion.div style={reduce ? undefined : { x: rightX, y: rightY }}>
            <PanelChrome label="Engineering-ready" icon={FileCode2}>
              <AnimatePresence mode="wait">
                {progress < 0.35 ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-3 animate-pulse rounded bg-white/[0.06]"
                        style={{ width: `${90 - i * 12}%`, animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                    <p className="flex items-center gap-1.5 pt-2 text-[11px] text-white/30">
                      <Loader2 className="size-3 animate-spin" /> Assembling ticket…
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="ticket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <p className="text-[13px] font-semibold leading-snug text-white">
                      Prevent duplicate payment processing in checkout webhook
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <GlowChip dot="bg-red-400 text-red-400" className="border-red-500/25 bg-red-500/10 text-red-300">
                        Bug
                      </GlowChip>
                      <GlowChip dot="bg-amber-400 text-amber-400" className="border-amber-500/25 bg-amber-500/10 text-amber-300">
                        Sev: High
                      </GlowChip>
                      <GlowChip className="border-white/10 bg-white/5 text-white/60">Scope: M</GlowChip>
                      <span className="ml-auto flex items-center gap-1">
                        <Gauge className="size-3 text-emerald-400" />
                        <span className="text-[11px] font-bold text-emerald-300">{confidence}%</span>
                      </span>
                    </div>
                    <RevealRows show={progress > 0.55}>
                      <p className={`text-[10.5px] uppercase tracking-wider text-white/30 ${mono}`}>Code references</p>
                      {CODE_REFS.map((f) => (
                        <div
                          key={f}
                          className={`flex items-center gap-2 truncate rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1.5 text-[11px] text-white/60 ${mono}`}
                        >
                          <FileCode2 className="size-3 shrink-0 text-[#8b6ff5]" /> {f}
                        </div>
                      ))}
                    </RevealRows>
                    <RevealRows show={progress > 0.85}>
                      <p className={`pt-1 text-[10.5px] uppercase tracking-wider text-white/30 ${mono}`}>Acceptance</p>
                      {ACCEPTANCE.map((a) => (
                        <div key={a} className="flex items-start gap-1.5 text-[11px] text-white/55">
                          <Check className="mt-0.5 size-3 shrink-0 text-emerald-400" /> {a}
                        </div>
                      ))}
                    </RevealRows>
                    {complete && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#6d54e6] to-[#5b43d6] px-3 py-2 text-[11.5px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(91,67,214,0.7)]"
                      >
                        <ShieldCheck className="size-3.5" /> Ready for PM approval
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </PanelChrome>
          </motion.div>
        </motion.div>
      </div>

      {/* scroll indicator */}
      <motion.a
        href="#pipeline"
        aria-label="Scroll to how it works"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-white/30 sm:flex"
      >
        <span className={`text-[10px] uppercase tracking-widest ${mono}`}>Scroll</span>
        <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <ChevronDown className="size-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}

/* ── building blocks ─────────────────────────────────────── */

function MaskLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ delay, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

function MetaTile({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
      <p className={`text-[9.5px] uppercase tracking-wide text-white/30 ${mono}`}>{k}</p>
      <p className={cn("mt-0.5 text-[11.5px] font-semibold text-white/80", tone)}>{v}</p>
    </div>
  );
}

function RevealRows({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-1 overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FlowLane({ className, active }: { className: string; active: boolean }) {
  return (
    <div className={cn("absolute top-[46%] h-px", className)}>
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {active && (
        <motion.span
          className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[#5b43d6] shadow-[0_0_8px_2px_rgba(91,67,214,0.7)]"
          animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
