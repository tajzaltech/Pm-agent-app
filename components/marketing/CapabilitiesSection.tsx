"use client";

import { motion } from "framer-motion";
import { Boxes, Check, FileCode2, GitBranch, Mail, Tag, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD, CARD_SHADOW, INK, INK_FAINT, INK_MUTED, LINE, mono } from "@/components/marketing/theme";
import { Reveal, SectionHead } from "@/components/marketing/ui";

const CLASSES = [
  { label: "Bug", value: 86, selected: true },
  { label: "Churn risk", value: 42, selected: false },
  { label: "Customer question", value: 18, selected: false },
  { label: "Feature request", value: 9, selected: false },
];

const FILES: [string, boolean][] = [
  ["payments/webhooks/stripe-handler.ts", true],
  ["services/payment-processor.ts", true],
  ["utils/idempotency.ts", true],
  ["checkout/session.ts", false],
];

const GROUPING = [
  ["24", "similar tickets"],
  ["11", "customers affected"],
  ["4", "enterprise accounts"],
  ["$92k", "ARR at risk"],
];

export function CapabilitiesSection() {
  return (
    <section id="features" className="scroll-mt-16 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHead
            eyebrow="Capabilities"
            title="Everything a PM does before a ticket is worth an engineer's time."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {/* codebase investigation — wide */}
          <Reveal className="lg:col-span-2">
            <Tile
              icon={GitBranch}
              title="Codebase investigation"
              body="Traced to the files that own the behaviour."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  {FILES.map(([f, hot]) => (
                    <div
                      key={f}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px]",
                        mono,
                        hot ? "border-[#ddd5fa] bg-[#f7f5fe] text-[#101018]" : "border-[#eeeef3] bg-[#fbfbfd] text-[#b0b2be]"
                      )}
                    >
                      <FileCode2 className={cn("size-3 shrink-0", hot ? "text-[#5b43d6]" : "text-[#c5c7d1]")} />
                      <span className="truncate">{f}</span>
                      {hot ? <span className="ml-auto shrink-0 text-[10px] text-[#5b43d6]">suspect</span> : null}
                    </div>
                  ))}
                </div>
                <div className={cn("overflow-hidden rounded-lg border bg-[#fbfbfd]", LINE)}>
                  <div className={cn("border-b px-3 py-1.5 text-[10.5px] text-[#8b8e9e]", LINE, mono)}>
                    services/payment-processor.ts
                  </div>
                  <pre className={cn("overflow-x-auto px-3 py-2 text-[10.5px] leading-relaxed text-[#5b5e70]", mono)}>
                    <code>{`await paymentProcessor.charge({
  customerId, amount, transactionId
});`}</code>
                  </pre>
                  <pre
                    className={cn(
                      "overflow-x-auto border-l-2 border-[#5b43d6] bg-[#f5f2fe] px-3 py-2 text-[10.5px] leading-relaxed text-[#4a35b8]",
                      mono
                    )}
                  >
                    <code>{`if (await idempotencyStore.exists(transactionId)) {
  return idempotencyStore.get(transactionId);
}`}</code>
                  </pre>
                  <p className={cn("border-t px-3 py-1.5 text-[10.5px] text-[#a6690a]", LINE)}>
                    Possible root cause — not confirmed
                  </p>
                </div>
              </div>
            </Tile>
          </Reveal>

          {/* classification */}
          <Reveal delay={0.08}>
            <Tile
              icon={Tag}
              title="Classification"
              body="Scored, never guessed silently."
            >
              <div className="space-y-3">
                {CLASSES.map((c) => (
                  <div key={c.label}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className={cn("font-medium", c.selected ? INK : INK_FAINT)}>{c.label}</span>
                      <span className={cn("tabular-nums", mono, c.selected ? "text-[#5b43d6]" : INK_FAINT)}>
                        {c.value}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f2f2f6]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${c.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn("h-full rounded-full", c.selected ? "bg-[#5b43d6]" : "bg-[#dcdce4]")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Tile>
          </Reveal>

          {/* signal grouping */}
          <Reveal delay={0.04}>
            <Tile
              icon={Boxes}
              title="Signal grouping"
              body="One complaint is noise. Twenty-four is a priority."
            >
              <div className="grid grid-cols-2 gap-2.5">
                {GROUPING.map(([n, l]) => (
                  <div key={l} className={cn("rounded-xl border bg-[#fbfbfd] p-3", LINE)}>
                    <p className={cn("text-[22px] font-semibold tracking-[-0.03em]", INK)}>{n}</p>
                    <p className={cn("mt-0.5 text-[11.5px]", INK_FAINT)}>{l}</p>
                  </div>
                ))}
              </div>
            </Tile>
          </Reveal>

          {/* scope & confidence */}
          <Reveal delay={0.12}>
            <Tile
              icon={FileCode2}
              title="Scope & confidence"
              body="Size, risk, and a score you can argue with."
            >
              <div className="flex items-center gap-5">
                <ConfidenceRing value={87} />
                <dl className="space-y-1.5 text-[12.5px]">
                  {[
                    ["Scope", "Medium"],
                    ["Files impacted", "~3"],
                    ["Testing", "Moderate"],
                    ["Risk", "Contained"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3">
                      <dt className={cn("w-24", INK_FAINT)}>{k}</dt>
                      <dd className={cn("font-medium", INK)}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Tile>
          </Reveal>

          {/* human approval */}
          <Reveal delay={0.16}>
            <Tile
              icon={UserCheck}
              title="Human approval"
              body="Approve, edit, or send it back."
            >
              <div className={cn("rounded-xl border bg-[#fbfbfd] p-3", LINE)}>
                <p className={cn("text-[12.5px] font-semibold leading-snug", INK)}>
                  Prevent duplicate payment processing…
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#ece7fd] text-[10px] font-bold text-[#5b43d6]">
                    JR
                  </span>
                  <div className="min-w-0">
                    <p className={cn("truncate text-[11.5px] font-medium", INK)}>Jordan Reyes, Product Manager</p>
                    <p className={cn("text-[10.5px]", INK_FAINT)}>Reviewing now</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0f7f5b] px-2 py-2 text-[12px] font-semibold text-white">
                  <Check className="size-3.5" /> Approve
                </span>
                {["Edit", "Send back"].map((l) => (
                  <span
                    key={l}
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg border bg-white px-2 py-2 text-[12px] font-medium",
                      LINE,
                      INK_MUTED
                    )}
                  >
                    {l}
                  </span>
                ))}
              </div>
              <p className={cn("mt-3 flex items-center gap-1.5 text-[11.5px]", INK_FAINT)}>
                <Mail className="size-3.5" /> A customer reply is drafted alongside it.
              </p>
            </Tile>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Tile({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-full flex-col p-6", CARD, CARD_SHADOW)}>
      <div className="flex items-center gap-2.5">
        <Icon className="size-[18px] shrink-0 text-[#5b43d6]" />
        <h3 className={cn("text-[15.5px] font-semibold tracking-[-0.015em]", INK)}>{title}</h3>
      </div>
      <p className={cn("mt-2.5 text-[13.5px] leading-relaxed", INK_MUTED)}>{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[84px] shrink-0">
      <svg viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f0f0f5" strokeWidth="6" />
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
          whileInView={{ strokeDashoffset: c - (c * value) / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-[17px] font-semibold tabular-nums", INK)}>{value}%</span>
        <span className={cn("text-[9px] uppercase tracking-[0.14em]", INK_FAINT)}>conf</span>
      </div>
    </div>
  );
}
