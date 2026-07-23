"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Boxes,
  Check,
  FileCode2,
  Gauge,
  Mail,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

import { GlowButton } from "@/components/marketing/LandingNav";
import { cn } from "@/lib/utils";
import { mono } from "@/components/marketing/theme";

const DEMO = "Payment was charged twice after checkout.";

const CARDS = [
  { icon: Tag, title: "Classification", body: "Bug · High severity", tint: "text-red-300" },
  { icon: Boxes, title: "Similar complaints", body: "24 tickets · 3 recurring themes", tint: "text-[#a48bf0]" },
  { icon: Users, title: "Affected accounts", body: "11 customers · 4 enterprise", tint: "text-[#a48bf0]" },
  { icon: FileCode2, title: "Code references", body: "stripe-handler.ts · idempotency.ts", tint: "text-[#a48bf0]" },
  { icon: Gauge, title: "Scope & confidence", body: "Medium · 87% confidence", tint: "text-emerald-300" },
  { icon: Check, title: "Acceptance criteria", body: "5 criteria · 2 edge cases", tint: "text-emerald-300" },
  { icon: Sparkles, title: "Jira-ready ticket", body: "Prevent duplicate payment processing", tint: "text-[#a48bf0]" },
  { icon: Mail, title: "Customer reply", body: "Draft ready for support review", tint: "text-[#a48bf0]" },
];

const TRUST = [
  "Human approval before any ticket is created",
  "Secure, read-only repository access",
  "Controlled, scoped integrations",
  "Clear source references on every claim",
];

export function FinalCtaSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [typed, setTyped] = useState("");
  const [generated, setGenerated] = useState(false);
  const [token, setToken] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let type: ReturnType<typeof setInterval>;
    let done: ReturnType<typeof setTimeout>;
    const raf = requestAnimationFrame(() => {
      setTyped("");
      setGenerated(false);
      let i = 0;
      type = setInterval(() => {
        i += 1;
        setTyped(DEMO.slice(0, i));
        if (i >= DEMO.length) {
          clearInterval(type);
          done = setTimeout(() => setGenerated(true), 400);
        }
      }, 45);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (type) clearInterval(type);
      if (done) clearTimeout(done);
    };
  }, [inView, token]);

  return (
    <section ref={ref} id="cta" className="relative overflow-hidden bg-[#050507] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-dark opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />
        <div className="absolute left-1/2 top-20 h-[34rem] w-[50rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.2),transparent)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Your next engineering priority may already be sitting in support.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/55">
            Connect your support platform and repository. Ask PM will identify the signal, investigate
            the codebase, and prepare the work for your team to review.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <GlowButton href="/signup" large>
              Analyze Your First Ticket
            </GlowButton>
            <a
              href="/signup"
              className="inline-flex h-12 items-center rounded-xl border border-white/12 bg-white/[0.03] px-5 text-[15px] font-medium text-white/85 backdrop-blur transition-colors hover:border-white/25 hover:bg-white/[0.06]"
            >
              Book a Product Demo
            </a>
          </div>
        </div>

        {/* interactive ticket input → generated workspace */}
        <div className="mx-auto mt-14 max-w-3xl">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0b12]/80 p-2 shadow-[0_40px_120px_-40px_rgba(91,67,214,0.5)] backdrop-blur-xl">
            <div className="flex items-center gap-3 rounded-xl border border-[#5b43d6]/25 bg-black/40 px-4 py-3">
              <Sparkles className="size-4 shrink-0 text-[#a48bf0]" />
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] text-white/85 ${mono}`}>
                  {typed || <span className="text-white/30">Paste a customer complaint…</span>}
                  {typed.length < DEMO.length && inView && (
                    <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-[#a48bf0] align-middle" />
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToken((t) => t + 1)}
                className="shrink-0 rounded-lg bg-[#5b43d6] px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#6d54e6]"
              >
                Analyze
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CARDS.map((c, i) => (
              <AnimatePresence key={c.title}>
                {generated && (
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5"
                  >
                    <c.icon className={cn("size-4", c.tint)} />
                    <p className="mt-2.5 text-[10.5px] uppercase tracking-wider text-white/35">{c.title}</p>
                    <p className="mt-0.5 text-[12.5px] font-medium leading-snug text-white/80">{c.body}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>
        </div>

        {/* trust / security */}
        <div id="security" className="mx-auto mt-16 max-w-3xl scroll-mt-24">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t} className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#a48bf0]" />
                <span className="text-[12.5px] leading-snug text-white/65">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
