"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, FileCode2, Inbox, Loader2, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { INK, INK_FAINT, INK_MUTED, LIFT, LINE, mono } from "@/components/marketing/theme";
import { PMAgentLogo } from "@/components/shared/BrandLogos";

const STEPS = [
  "Classifying the report",
  "Grouping similar complaints",
  "Reading the payments service",
  "Tracing the Stripe webhook",
  "Checking idempotency logic",
  "Estimating engineering scope",
  "Writing acceptance criteria",
];

const ROTATING_WORDS = ["tickets", "feedback", "requests", "reports", "issues"];

const CODE_REFS = ["payments/webhooks/stripe-handler.ts", "services/payment-processor.ts", "utils/idempotency.ts"];

const ACCEPTANCE = [
  "Duplicate webhook events do not create a second charge",
  "Retried events return the original transaction result",
  "Regression tests cover repeated Stripe webhooks",
];

export function HeroSection() {
  const reduce = useReducedMotion();
  const [ticked, setTicked] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let d = 0;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      timer = setTimeout(
        () => {
          d = d >= STEPS.length ? 0 : d + 1;
          setTicked(d);
          run();
        },
        d >= STEPS.length ? 3200 : 700
      );
    };
    run();
    return () => clearTimeout(timer);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      setWordIndex((index) => (index + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [reduce]);

  // With reduced motion the panel renders its finished state instead of animating.
  const done = reduce ? STEPS.length : ticked;
  const progress = done / STEPS.length;
  const complete = done >= STEPS.length;

  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      {/* backdrop — one soft brand wash, nothing more */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-14rem] h-[34rem] w-[62rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.10),transparent)]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "text-[38px] font-semibold leading-[1.06] tracking-[-0.035em] sm:text-[58px]",
              INK
            )}
          >
            Turn support{" "}
            <motion.span
              key={ROTATING_WORDS[wordIndex]}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-block bg-gradient-to-r from-[#5b43d6] via-[#7a5cf0] to-[#a48bf0] bg-clip-text text-transparent"
            >
              {ROTATING_WORDS[wordIndex]}
            </motion.span>{" "}into
            <br className="hidden sm:block" />{" "}
            engineering-ready work.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className={cn("mx-auto mt-6 max-w-xl text-[16.5px] leading-relaxed", INK_MUTED)}
          >
            Reads from support. Investigates code. Ships to your tracker.
          </motion.p>
        </div>

        {/* product frame */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn("mx-auto mt-16 max-w-5xl overflow-hidden rounded-[20px] border bg-white", LINE, LIFT)}
        >
          {/* toolbar */}
          <div className={cn("flex h-11 items-center gap-3 border-b bg-[#fcfcfd] px-4", LINE)}>
            <span className={cn("truncate text-[11.5px]", mono, INK_FAINT)}>
              ask-pm / ticket #48213 / Acme Logistics
            </span>
            <span className={cn("ml-auto hidden shrink-0 whitespace-nowrap text-[11px] font-medium sm:inline", INK_FAINT)}>
              {complete ? "Ready for review" : "Analyzing"}
            </span>
          </div>

          <div className="grid divide-y divide-[#f0f0f5] lg:grid-cols-[0.95fr_1.05fr_1fr] lg:divide-x lg:divide-y-0">
            {/* incoming */}
            <Column icon={Inbox} label="Incoming from Zendesk">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef4fd] text-[11px] font-bold text-[#2f6fb5]">
                  AL
                </span>
                <div className="min-w-0">
                  <p className={cn("truncate text-[13px] font-semibold", INK)}>Acme Logistics</p>
                  <p className={cn("text-[11px]", INK_FAINT)}>Enterprise, $148k / yr</p>
                </div>
              </div>
              <p className={cn("mt-4 text-[13.5px] font-medium leading-snug", INK)}>
                &ldquo;Payment was charged twice after checkout.&rdquo;
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-2">
                <Meta k="Priority" v="High" tone="text-[#c0392f]" />
                <Meta k="Sentiment" v="Frustrated" tone="text-[#a6690a]" />
                <Meta k="Ticket age" v="14 min" />
                <Meta k="Product area" v="Payments" />
              </dl>
            </Column>

            {/* investigating */}
            <Column icon={PMAgentLogo} label="Ask PM investigating" brand>
              <ul className="space-y-1">
                {STEPS.map((s, i) => {
                  const isDone = i < done;
                  const isActive = i === done && !complete;
                  return (
                    <li
                      key={s}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-[5px] text-[12.5px] transition-colors duration-300",
                        isActive && "bg-[#f3f0fe] font-medium text-[#101018]",
                        isDone && !isActive && "text-[#5b5e70]",
                        !isDone && !isActive && "text-[#b9bbc7]"
                      )}
                    >
                      {isDone ? (
                        <Check className="size-3.5 shrink-0 text-emerald-600" />
                      ) : isActive ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-[#5b43d6]" />
                      ) : (
                        <span className="size-3.5 shrink-0 rounded-full border border-[#e2e2ea]" />
                      )}
                      <span className="truncate">{s}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0f0f5]">
                  <motion.div
                    className="h-full rounded-full bg-[#5b43d6]"
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
                <span className={cn("text-[11px] tabular-nums", mono, INK_FAINT)}>
                  {Math.min(done, STEPS.length)}/{STEPS.length}
                </span>
              </div>
            </Column>

            {/* engineering-ready */}
            <Column icon={FileCode2} label="Engineering-ready">
              {progress < 0.3 ? (
                <div className="space-y-2.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-3 animate-pulse rounded bg-[#f2f2f6]"
                      style={{ width: `${92 - i * 13}%`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                  <p className={cn("flex items-center gap-1.5 pt-1 text-[11.5px]", INK_FAINT)}>
                    <Loader2 className="size-3 animate-spin" /> Assembling ticket…
                  </p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className={cn("text-[13.5px] font-semibold leading-snug", INK)}>
                    Prevent duplicate payment processing in the checkout webhook
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip className="border-[#f3d4d0] bg-[#fdf2f1] text-[#c0392f]">Bug</Chip>
                    <Chip className="border-[#f2e0bd] bg-[#fdf7ea] text-[#a6690a]">Sev: High</Chip>
                    <Chip className="border-[#e8e8ef] bg-[#fafafc] text-[#5b5e70]">Scope: M</Chip>
                    <Chip className="border-[#c9e9db] bg-[#f0faf6] text-[#0f7f5b]">87% confidence</Chip>
                  </div>

                  {progress > 0.5 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                      <p className={cn("text-[10.5px] uppercase tracking-[0.14em]", mono, INK_FAINT)}>Code references</p>
                      {CODE_REFS.map((f) => (
                        <div
                          key={f}
                          className={cn(
                            "flex items-center gap-2 truncate rounded-lg border bg-[#fbfbfd] px-2.5 py-1.5 text-[11px] text-[#5b5e70]",
                            LINE,
                            mono
                          )}
                        >
                          <FileCode2 className="size-3 shrink-0 text-[#5b43d6]" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {progress > 0.8 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                      <p className={cn("pt-1 text-[10.5px] uppercase tracking-[0.14em]", mono, INK_FAINT)}>Acceptance</p>
                      {ACCEPTANCE.map((a) => (
                        <div key={a} className="flex items-start gap-1.5 text-[11.5px] leading-snug text-[#5b5e70]">
                          <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" /> {a}
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {complete && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#f3f0fe] px-3 py-2 text-[11.5px] font-semibold text-[#5b43d6]"
                    >
                      <ShieldCheck className="size-3.5" /> Waiting for PM approval
                    </motion.div>
                  )}
                </motion.div>
              )}
            </Column>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── building blocks ─────────────────────────────────────── */

function Column({
  icon: Icon,
  label,
  brand,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  brand?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-h-[19rem] flex-col p-5", brand && "bg-[#fcfbff]")}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", brand ? "text-[#5b43d6]" : "text-[#8b8e9e]")} />
        <span
          className={cn(
            "text-[10.5px] font-semibold uppercase tracking-[0.14em]",
            mono,
            brand ? "text-[#5b43d6]" : "text-[#8b8e9e]"
          )}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Meta({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className={cn("rounded-lg border bg-[#fbfbfd] px-2.5 py-1.5", LINE)}>
      <dt className={cn("text-[9.5px] uppercase tracking-[0.12em]", mono, INK_FAINT)}>{k}</dt>
      <dd className={cn("mt-0.5 text-[11.5px] font-semibold", tone ?? "text-[#101018]")}>{v}</dd>
    </div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold", className)}>
      {children}
    </span>
  );
}
