"use client";

import Image from "next/image";
import { ArrowRight, Boxes, Check, FileCode2, GitBranch, Inbox, Ruler, Tag, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandMark, type Brand } from "@/components/marketing/BrandTile";
import { CARD, CARD_SHADOW, INK, INK_FAINT, INK_MUTED, LINE, mono } from "@/components/marketing/theme";
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
  { icon: Inbox, label: "Intake" },
  { icon: Tag, label: "Classify" },
  { icon: Boxes, label: "Group" },
  { icon: GitBranch, label: "Trace code" },
  { icon: Ruler, label: "Scope" },
  { icon: FileCode2, label: "Draft" },
  { icon: UserCheck, label: "Approve" },
];

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

        {/* the full pipeline, as one visual rail */}
        <Reveal delay={0.1}>
          <div className={cn("mt-4 p-6", CARD, CARD_SHADOW)}>
            <ol className="relative flex items-start justify-between gap-1">
              <span className="absolute left-[6%] right-[6%] top-5 -z-0 h-px bg-[#e8e8ef]" aria-hidden />
              {STAGES.map((s) => (
                <li key={s.label} className="relative z-10 flex flex-1 flex-col items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border bg-white text-[#5b43d6]",
                      LINE
                    )}
                  >
                    <s.icon className="size-4" />
                  </span>
                  <span className={cn("text-center text-[11px] font-medium leading-tight", INK_MUTED)}>{s.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
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
