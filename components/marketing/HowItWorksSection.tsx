"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Boxes, Check, FileCode2, GitBranch, Inbox, Ruler, Tag, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandMark, type Brand } from "@/components/marketing/BrandTile";
import { CARD, CARD_SHADOW, INK, INK_FAINT, LINE, mono } from "@/components/marketing/theme";
import { Reveal, SectionHead } from "@/components/marketing/ui";

const SOURCES: Brand[] = [
  { name: "Zendesk", slug: "zendesk", color: "03363D" },
  { name: "Intercom", slug: "intercom", color: "1F8DED" },
  { name: "GitHub", slug: "github", color: "181717" },
  { name: "GitLab", slug: "gitlab", color: "FC6D26" },
];

const TRACKERS: Brand[] = [
  { name: "Jira", slug: "jira", color: "0052CC" },
  { name: "Linear", slug: "linear", color: "5E6AD2" },
  { name: "GitHub", slug: "github", color: "181717" },
];

const STAGES = [
  { icon: Inbox, label: "Intake", note: "The ticket arrives" },
  { icon: Tag, label: "Classify", note: "Bug, or a feature?" },
  { icon: Boxes, label: "Group", note: "24 say the same thing" },
  { icon: GitBranch, label: "Trace code", note: "Finds the guilty file" },
  { icon: Ruler, label: "Scope", note: "Sizes the work" },
  { icon: FileCode2, label: "Draft", note: "Writes it up" },
  { icon: UserCheck, label: "Approve", note: "You have the last word" },
];

/** How long each stage holds before the rail advances. */
const STAGE_MS = 1600;

export function HowItWorksSection() {
  return (
    <section
      id="how"
      className="scroll-mt-16 bg-white py-24 shadow-[0_-24px_60px_-40px_rgba(46,26,120,0.34),0_24px_60px_-40px_rgba(46,26,120,0.34)] sm:py-28"
    >
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <SectionHead eyebrow="How it works" title="Three steps between a complaint and a commit." />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <Step index={0} title="Connect">
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map((b) => (
                <div key={b.name} className={cn("flex items-center gap-2 rounded-xl border bg-[#fbfbfd] px-3 py-2.5", LINE)}>
                  <BrandMark brand={b} className="size-5" />
                  <span className={cn("truncate text-[12.5px] font-medium", INK)}>{b.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <ArrowRight className="size-3.5 rotate-90 text-[#c5c7d1]" />
            </div>
            <div className={cn("flex items-center justify-center gap-2 rounded-xl border bg-white py-2.5", LINE)}>
              <Image src="/ask-pm-logo-v3.png" alt="" width={512} height={512} className="size-6 object-contain" />
              <span className={cn("text-[12.5px] font-semibold", INK)}>Ask PM</span>
            </div>
          </Step>

          <Step index={1} title="Investigate">
            <div className="space-y-2.5">
              {[
                ["Bug", 86, true],
                ["Churn risk", 42, false],
                ["Question", 18, false],
              ].map(([label, val, sel]) => (
                <div key={label as string}>
                  <div className="mb-1 flex items-center justify-between text-[11.5px]">
                    <span className={cn("font-medium", sel ? INK : INK_FAINT)}>{label as string}</span>
                    <span className={cn("tabular-nums", mono, sel ? "text-[#5b43d6]" : INK_FAINT)}>{val as number}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f0f5]">
                    <div
                      className={cn("h-full rounded-full", sel ? "bg-[#5b43d6]" : "bg-[#dcdce4]")}
                      style={{ width: `${val as number}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5">
              {["payments/stripe-handler.ts", "utils/idempotency.ts"].map((f) => (
                <div
                  key={f}
                  className={cn(
                    "flex items-center gap-2 truncate rounded-lg border border-[#ddd5fa] bg-[#f7f5fe] px-2.5 py-1.5 text-[11px] text-[#101018]",
                    mono
                  )}
                >
                  <FileCode2 className="size-3 shrink-0 text-[#5b43d6]" />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>
          </Step>

          <Step index={2} title="Approve & ship">
            <div className={cn("rounded-xl border bg-[#fbfbfd] p-3", LINE)}>
              <p className={cn("text-[12.5px] font-semibold leading-snug", INK)}>
                Prevent duplicate payment processing
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  ["Bug", "border-[#f3d4d0] bg-[#fdf2f1] text-[#c0392f]"],
                  ["Scope: M", "border-[#e8e8ef] bg-white text-[#5b5e70]"],
                  ["87%", "border-[#c9e9db] bg-[#f0faf6] text-[#0f7f5b]"],
                ].map(([l, c]) => (
                  <span key={l} className={cn("rounded-full border px-2 py-0.5 text-[10.5px] font-semibold", c)}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <span className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#0f7f5b] py-2.5 text-[12.5px] font-semibold text-white">
              <Check className="size-3.5" /> Approve
            </span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <ArrowRight className="size-3.5 rotate-90 text-[#c5c7d1]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TRACKERS.map((b, i) => (
                <div key={`${b.name}-${i}`} className={cn("flex items-center justify-center rounded-xl border bg-white py-2.5", LINE)}>
                  <BrandMark brand={b} className="size-5" />
                </div>
              ))}
            </div>
          </Step>
        </div>

        {/* the full pipeline — no panel, it lights up a stage at a time */}
        <StageRail />
      </div>
    </section>
  );
}

function Step({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <Reveal delay={index * 0.08}>
      <div className={cn("flex h-full flex-col p-6", CARD, CARD_SHADOW)}>
        <div className="mb-5 flex items-center gap-2.5">
          <span className={cn("text-[11px] font-semibold tabular-nums", mono, INK_FAINT)}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className={cn("text-[17px] font-semibold tracking-[-0.02em]", INK)}>{title}</h3>
        </div>
        {children}
      </div>
    </Reveal>
  );
}

/** Walks the seven stages on a loop, growing whichever one is live. */
function StageRail() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % STAGES.length);
    }, STAGE_MS);
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <div className="mt-12">
      <ol className="relative grid grid-cols-2 gap-x-2 gap-y-8 sm:grid-cols-4 md:flex md:items-start md:justify-between md:gap-1">
        {/* the rail only reads as a rail once the stages sit in one row */}
        <span className="absolute left-[7%] right-[7%] top-8 hidden h-px bg-[#eceaf4] md:block" aria-hidden />
        <motion.span
          className="absolute left-[7%] top-8 hidden h-px bg-gradient-to-r from-[#5b43d6] to-[#a48bf0] md:block"
          animate={{ width: `${(active / (STAGES.length - 1)) * 86}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />

        {STAGES.map((s, i) => {
          const live = reduce || i === active;
          return (
            <li key={s.label} className="relative z-10 flex flex-col items-center gap-3 md:flex-1">
              <motion.span
                animate={live ? { scale: 1.18 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className={cn(
                  "flex size-16 items-center justify-center rounded-full transition-colors duration-300",
                  live
                    ? "bg-gradient-to-br from-[#6d54e6] to-[#5b43d6] text-white shadow-[0_12px_28px_-10px_rgba(91,67,214,0.75)]"
                    : "bg-[#f4f2fc] text-[#a9a2c8]"
                )}
              >
                <s.icon className="size-7" />
              </motion.span>

              <span className="flex flex-col items-center gap-1 px-1 text-center">
                <span
                  className={cn(
                    "text-[13px] font-semibold leading-tight transition-colors duration-300",
                    live ? "text-[#5b43d6]" : INK
                  )}
                >
                  {s.label}
                </span>
                <span
                  className={cn(
                    "text-[11.5px] leading-snug transition-colors duration-300",
                    live ? "text-[#5b5e70]" : "text-[#a9abb8]"
                  )}
                >
                  {s.note}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
