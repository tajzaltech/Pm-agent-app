"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Check, FileCode2, Plus, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { INK, INK_FAINT, INK_MUTED, LINE, mono } from "@/components/marketing/theme";
import { PMAgentLogo } from "@/components/shared/BrandLogos";

const ROTATING_WORDS = ["tickets", "feedback", "requests", "reports", "issues"];

/** Cycles in the composer so the field looks alive and hints at what to ask. */
const PROMPTS = [
  "Why did payments break this week?",
  "Draft a ticket for the checkout bug",
  "What are customers complaining about most?",
  "Which accounts are at risk of churning?",
  "Summarise this week's support signal",
];

const CHATS = [
  { title: "Payment charged twice", time: "2m" },
  { title: "500 errors after deploy", time: "1h" },
  { title: "Bulk member import", time: "3h" },
  { title: "SSO configuration docs", time: "1d" },
];

const INVESTIGATION = [
  "Classified as a payments bug",
  "Grouped 24 similar reports from 11 customers",
  "Traced the Stripe webhook retry handler",
  "Found the missing idempotency guard",
];

const CODE_REFS = ["payments/webhooks/stripe-handler.ts", "utils/idempotency.ts"];

const ACCEPTANCE = [
  "Duplicate webhook events do not create a second charge",
  "Retried events return the original transaction result",
];

export function HeroSection() {
  const reduce = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      setWordIndex((index) => (index + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      setPromptIndex((index) => (index + 1) % PROMPTS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [reduce]);

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [authOpen]);

  return (
    <section id="top" className="relative overflow-x-clip pt-32 pb-28 sm:pt-40 sm:pb-36">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className={cn("text-[38px] font-semibold leading-[1.06] tracking-[-0.035em] sm:text-[58px]", INK)}
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
            </motion.span>{" "}
            into
            <br className="hidden sm:block" /> engineering-ready work.
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

        {/* ── the real product, shown whole and still ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 w-full overflow-hidden rounded-[18px] border border-[#efedf7] border-t-[#d9d2ef] bg-white shadow-[0_1px_3px_rgba(16,17,24,0.06)]"
        >
          <div className="flex min-h-[36rem]">
            {/* conversation rail */}
            <div className="hidden w-[210px] shrink-0 flex-col border-r border-black/[0.05] bg-[#fcfcfe] md:flex">
              <div className="flex h-12 items-center border-b border-black/[0.05] px-4">
                <PMAgentLogo className="size-5 object-contain" />
              </div>
              <div className="space-y-0.5 p-2">
                {CHATS.map((c) => (
                  <div key={c.title} className="rounded-lg px-2.5 py-2">
                    <p className="truncate text-[11.5px] font-medium leading-tight text-[#4e5162]">
                      {c.title}
                    </p>
                    <p className={cn("mt-0.5 text-[10px] leading-tight", INK_FAINT)}>{c.time} ago</p>
                  </div>
                ))}
              </div>
            </div>

            {/* the conversation */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-12 shrink-0 items-center gap-3 border-b border-black/[0.05] px-5">
                <span className={cn("truncate text-[11.5px]", mono, INK_FAINT)}>
                  payment charged twice
                </span>
                <span className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f3f0fe]">
                  <User className="size-3.5 text-[#5b43d6]" />
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex justify-end">
                  <p className="max-w-[78%] rounded-2xl rounded-br-md bg-gradient-to-br from-[#6d54e6] to-[#5b43d6] px-4 py-2.5 text-[13px] font-medium leading-snug text-white shadow-[0_8px_20px_-10px_rgba(91,67,214,0.8)]">
                    Payment was charged twice after checkout.
                  </p>
                </div>

                {/* what Ask PM did, before it answers */}
                <div className="mt-5 flex gap-2.5">
                  <PMAgentLogo className="mt-0.5 size-5 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[13px] leading-relaxed", INK_MUTED)}>
                      Looking into it — reading the ticket, then your repository.
                    </p>
                    <div className={cn("mt-2.5 rounded-xl border bg-[#faf8ff] p-3", "border-[#e9e3fb]")}>
                      {INVESTIGATION.map((s) => (
                        <p key={s} className="flex items-start gap-2 py-[3px] text-[12px] leading-snug text-[#4e5162]">
                          <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                          {s}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* the follow-up that produces the ticket */}
                <div className="mt-5 flex justify-end">
                  <p className="max-w-[78%] rounded-2xl rounded-br-md bg-gradient-to-br from-[#6d54e6] to-[#5b43d6] px-4 py-2.5 text-[13px] font-medium leading-snug text-white shadow-[0_8px_20px_-10px_rgba(91,67,214,0.8)]">
                    Draft the ticket for engineering.
                  </p>
                </div>

                <div className="mt-5 flex gap-2.5">
                  <PMAgentLogo className="mt-0.5 size-5 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className={cn("text-[13px] leading-relaxed", INK_MUTED)}>
                      Duplicate-charge bug in the checkout webhook — retried Stripe events reprocess a
                      completed charge. 24 similar reports, 4 enterprise accounts.
                    </p>

                    <div className={cn("rounded-xl border bg-[#fbfbfd] p-3.5", LINE)}>
                      <p className={cn("text-[13px] font-semibold leading-snug", INK)}>
                        Prevent duplicate payment processing in the checkout webhook
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Chip className="border-[#f3d4d0] bg-[#fdf2f1] text-[#c0392f]">Bug</Chip>
                        <Chip className="border-[#f2e0bd] bg-[#fdf7ea] text-[#a6690a]">Sev: High</Chip>
                        <Chip className="border-[#e8e8ef] bg-white text-[#5b5e70]">Scope: M</Chip>
                        <Chip className="border-[#c9e9db] bg-[#f0faf6] text-[#0f7f5b]">87% confidence</Chip>
                      </div>

                      <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                        {CODE_REFS.map((f) => (
                          <div
                            key={f}
                            className={cn(
                              "flex items-center gap-1.5 truncate rounded-lg border bg-white px-2 py-1.5 text-[10.5px] text-[#5b5e70]",
                              LINE,
                              mono
                            )}
                          >
                            <FileCode2 className="size-3 shrink-0 text-[#5b43d6]" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 space-y-1">
                        {ACCEPTANCE.map((a) => (
                          <p key={a} className="flex items-start gap-1.5 text-[11px] leading-snug text-[#5b5e70]">
                            <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                            {a}
                          </p>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f7f5b] px-3 py-1.5 text-[11.5px] font-semibold text-white">
                          <Check className="size-3.5" /> Approve
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-[11.5px] font-medium",
                            LINE,
                            INK_MUTED
                          )}
                        >
                          Edit
                        </span>
                        <span className={cn("ml-auto text-[11px]", INK_FAINT)}>Creates in Jira</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    onClick={() => setAuthOpen(true)}
                    aria-label="Sign in to ask your own question"
                    className={cn(
                      // matches the app composer: same radius, padding, border and shadow
                      "group flex w-full items-center gap-2 rounded-[26px] border border-[#e5e3ef] bg-white p-2.5 text-left",
                      "shadow-[0_3px_16px_rgba(38,24,78,0.06)] transition-all duration-200",
                      "hover:border-[#5b43d6]/40 hover:shadow-[0_10px_32px_-6px_rgba(98,65,196,0.22)]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                        "text-[#8b8e9e] group-hover:bg-[#f4f4f8] group-hover:text-[#101018]"
                      )}
                    >
                      <Plus className="size-[17px]" />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={PROMPTS[promptIndex]}
                          initial={reduce ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0, y: -8 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className={cn("truncate px-1 text-sm leading-relaxed", INK_MUTED)}
                        >
                          {PROMPTS[promptIndex]}
                        </motion.span>
                      </AnimatePresence>
                      {/* caret, so the field reads as ready for typing */}
                      <motion.span
                        aria-hidden
                        className="inline-block h-[15px] w-[2px] shrink-0 rounded-full bg-[#5b43d6]"
                        animate={reduce ? undefined : { opacity: [1, 1, 0, 0] }}
                        transition={{ duration: 1.05, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: "linear" }}
                      />
                    </span>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5b43d6] to-[#8E6CF3] text-white shadow-md transition-transform duration-200 group-hover:scale-105">
                      <ArrowUp className="size-[17px]" strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>{authOpen && <AuthPrompt onClose={() => setAuthOpen(false)} />}</AnimatePresence>
    </section>
  );
}

/** Shown when a visitor tries to use the composer — hands off to the real auth routes. */
function AuthPrompt({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#101018]/25 p-4 backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to Ask PM"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-7 text-center shadow-[0_40px_100px_-30px_rgba(46,26,120,0.55)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(91,67,214,0.12),transparent)]" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cn("absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-[#f4f4f8]", INK_FAINT)}
        >
          <X className="size-4" />
        </button>

        <div className="relative">
          <PMAgentLogo className="mx-auto size-11 object-contain" />
          <h2 className={cn("mt-4 text-[20px] font-semibold tracking-[-0.02em]", INK)}>
            Ask your own question
          </h2>
          <p className={cn("mx-auto mt-2 max-w-[17rem] text-[13.5px] leading-relaxed", INK_MUTED)}>
            Create a free account to connect your support inbox and repository, then ask Ask PM anything.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5b43d6] text-[14.5px] font-semibold text-white transition-colors hover:bg-[#4f39c4]"
            >
              Start free <ArrowUp className="size-4 rotate-90" />
            </Link>
            <Link
              href="/signin"
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-xl border bg-white text-[14.5px] font-medium transition-colors hover:bg-[#fafafc]",
                LINE,
                INK
              )}
            >
              I already have an account
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", className)}>
      {children}
    </span>
  );
}
