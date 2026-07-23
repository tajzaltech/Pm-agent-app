"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { mono } from "@/components/marketing/theme";

type Status = "Available" | "In Beta" | "Coming Soon";
type Node = { name: string; status: Status; data: string[] };

const SUPPORT: Node[] = [
  { name: "Zendesk", status: "Available", data: ["Customer message", "Account context", "Ticket history", "Priority", "Sentiment"] },
  { name: "Freshdesk", status: "Available", data: ["Customer message", "Ticket metadata", "Priority", "Product area"] },
  { name: "Intercom", status: "In Beta", data: ["Conversation thread", "Customer attributes", "Recent events"] },
  { name: "Help Scout", status: "In Beta", data: ["Message body", "Customer profile", "Tags"] },
  { name: "Email", status: "Available", data: ["Raw message", "Sender identity", "Thread history"] },
];

const CODE: Node[] = [
  { name: "GitHub", status: "Available", data: ["Code files", "Commit history", "Pull requests", "Ownership", "Relevant components"] },
  { name: "GitLab", status: "In Beta", data: ["Repositories", "Merge requests", "Blame & ownership"] },
  { name: "Bitbucket", status: "Coming Soon", data: ["Repositories", "Commit history"] },
  { name: "Error Tracking", status: "In Beta", data: ["Stack traces", "Error frequency", "Affected releases"] },
];

const DELIVERY: Node[] = [
  { name: "Jira", status: "Available", data: ["Title", "Scope", "Priority", "Acceptance criteria", "Code references", "Customer impact"] },
  { name: "Linear", status: "Available", data: ["Title", "Scope", "Labels", "Acceptance criteria", "Code references"] },
  { name: "GitHub Issues", status: "Available", data: ["Title", "Body", "Code references", "Labels"] },
  { name: "Asana", status: "Coming Soon", data: ["Task title", "Description", "Priority"] },
  { name: "ClickUp", status: "Coming Soon", data: ["Task title", "Scope", "Priority"] },
];

const OUTCOMES = [
  "Stop manually translating support requests into engineering work.",
  "Give engineers the problem context, code references, and repro up front.",
  "Catch repeated complaints before they grow into product-wide issues.",
  "Prioritize by real customer impact, not by whoever shouts loudest.",
  "Keep a human PM in the loop on every ticket that ships.",
  "Close the loop faster between support, product, and engineering.",
];

const STATUS_STYLE: Record<Status, string> = {
  Available: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  "In Beta": "border-[#5b43d6]/30 bg-[#5b43d6]/12 text-[#a48bf0]",
  "Coming Soon": "border-white/10 bg-white/[0.03] text-white/40",
};

export function EcosystemSection() {
  const [sel, setSel] = useState<Node>(SUPPORT[0]);
  const dir: "in" | "out" = DELIVERY.some((d) => d.name === sel.name) ? "out" : "in";

  return (
    <section id="ecosystem" className="relative overflow-hidden bg-[#09090d] py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.12),transparent)] blur-2xl" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a48bf0] ${mono}`}>One System</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Between support, product, and engineering
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/50">
            Ask PM reads from support and code on the left, and hands development-ready work to your
            tracker on the right — with a human approving in between. Hover a system to see what moves.
          </p>
        </div>

        {/* map */}
        <div className="mt-14 grid items-center gap-6 lg:grid-cols-[1fr_1.15fr_1fr]">
          {/* inputs */}
          <div className="space-y-6">
            <NodeGroup label="Support sources" nodes={SUPPORT} sel={sel} onSel={setSel} />
            <NodeGroup label="Code & engineering" nodes={CODE} sel={sel} onSel={setSel} />
            <FlowHint className="hidden lg:flex" dir="right" active />
          </div>

          {/* core + detail */}
          <div className="flex flex-col items-center">
            <div className="mb-4 flex items-center gap-1.5 rounded-full border border-[#5b43d6]/30 bg-[#5b43d6]/10 px-3 py-1.5 text-[11px] font-medium text-[#a48bf0]">
              <ShieldCheck className="size-3.5" /> Human approval · control layer
            </div>
            <div className="relative flex size-40 items-center justify-center">
              <motion.span
                className="absolute inset-0 rounded-full border border-[#5b43d6]/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              />
              <motion.span
                className="absolute inset-4 rounded-full border border-dashed border-[#5b43d6]/20"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              <span className="absolute inset-0 rounded-full bg-[#5b43d6]/15 blur-2xl" />
              <div className="relative flex flex-col items-center gap-2 rounded-2xl border border-[#5b43d6]/40 bg-[#0b0b12] px-5 py-4 shadow-[0_0_40px_-6px_rgba(91,67,214,0.6)]">
                <Image src="/apple-icon.png" alt="Ask PM" width={180} height={180} className="size-12 rounded-2xl object-contain" />
                <span className="text-[13px] font-semibold text-white">Ask PM</span>
              </div>
            </div>

            {/* live detail panel */}
            <div className="mt-6 w-full max-w-xs">
              <AnimatePresence mode="wait">
                <motion.div
                  key={sel.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl border border-white/[0.08] bg-[#0b0b12]/90 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                      {dir === "in" ? `${sel.name} → Ask PM` : `Ask PM → ${sel.name}`}
                      <ArrowRight className="size-3 text-[#a48bf0]" />
                    </span>
                    <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-bold", STATUS_STYLE[sel.status])}>
                      {sel.status}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {sel.data.map((d) => (
                      <span key={d} className={`rounded-md border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-[10.5px] text-white/55 ${mono}`}>
                        {d}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* outputs */}
          <div className="space-y-6">
            <FlowHint className="hidden lg:flex" dir="right" active />
            <NodeGroup label="Delivery & tracking" nodes={DELIVERY} sel={sel} onSel={setSel} align="right" />
          </div>
        </div>

        {/* outcomes */}
        <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((o, i) => (
            <motion.div
              key={o}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="group rounded-xl border border-white/[0.07] bg-white/[0.015] p-4 transition-colors hover:border-[#5b43d6]/30"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-[#5b43d6]/12 text-[11px] font-bold text-[#a48bf0]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">{o}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NodeGroup({
  label,
  nodes,
  sel,
  onSel,
  align = "left",
}: {
  label: string;
  nodes: Node[];
  sel: Node;
  onSel: (n: Node) => void;
  align?: "left" | "right";
}) {
  return (
    <div>
      <p className={cn("mb-2 text-[10.5px] uppercase tracking-wider text-white/30", mono, align === "right" && "lg:text-right")}>
        {label}
      </p>
      <div className="space-y-1.5">
        {nodes.map((n) => {
          const active = sel.name === n.name;
          return (
            <button
              key={n.name}
              type="button"
              onMouseEnter={() => onSel(n)}
              onFocus={() => onSel(n)}
              onClick={() => onSel(n)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-200",
                active
                  ? "border-[#5b43d6]/40 bg-[#5b43d6]/[0.08] shadow-[0_0_20px_-6px_rgba(91,67,214,0.6)]"
                  : "border-white/[0.07] bg-white/[0.015] hover:border-white/15",
                align === "right" && "lg:flex-row-reverse lg:text-right"
              )}
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", active ? "bg-[#5b43d6]" : "bg-white/20")} />
              <span className={cn("flex-1 text-[13px] font-medium", active ? "text-white" : "text-white/60")}>{n.name}</span>
              <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-bold", STATUS_STYLE[n.status])}>
                {n.status === "Coming Soon" ? "Soon" : n.status === "In Beta" ? "Beta" : "Live"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FlowHint({ className, active }: { className?: string; dir: "right"; active?: boolean }) {
  return (
    <div className={cn("relative h-6 items-center justify-center", className)}>
      <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {active && (
        <motion.span
          className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[#5b43d6] shadow-[0_0_8px_2px_rgba(91,67,214,0.7)]"
          animate={{ left: ["10%", "90%"], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <ArrowRight className="relative mx-auto size-3 text-white/20" />
    </div>
  );
}
