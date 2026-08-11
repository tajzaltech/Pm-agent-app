"use client";

import { motion } from "framer-motion";
import { Eye, KeyRound, ShieldCheck, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { WorkflowGraph } from "@/components/marketing/WorkflowGraph";
import { INK, INK_MUTED, LINE } from "@/components/marketing/theme";
import { Reveal, SectionHead } from "@/components/marketing/ui";

const TRUST = [
  { icon: UserCheck, title: "Human approval", body: "Nothing ships without a person." },
  { icon: Eye, title: "Read-only code", body: "Never pushes, branches, or commits." },
  { icon: KeyRound, title: "Scoped access", body: "Only the projects you select." },
  { icon: ShieldCheck, title: "Traceable claims", body: "Every answer links to its source." },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="scroll-mt-16 bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHead eyebrow="Integrations" title="Reads from support and code. Writes to your tracker." />
        </Reveal>

        {/*
          The graph and the guarantees are one object: the hub is labelled
          "Human approval", and these four lines are what that promise means.
        */}
        <Reveal>
          <div
            id="security"
            className={cn(
              "mt-14 scroll-mt-20 overflow-hidden rounded-[22px] border bg-white",
              LINE,
              "shadow-[0_1px_2px_rgba(16,17,24,0.04),0_30px_70px_-40px_rgba(46,26,120,0.28)]"
            )}
          >
            <div className="px-5 pb-2 pt-6 sm:px-8 sm:pt-8">
              <WorkflowGraph />
            </div>

            <div className={cn("grid divide-y border-t sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0", LINE, "divide-[#eeecf6]")}>
              {TRUST.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="group p-5 transition-colors hover:bg-[#fbfaff]"
                >
                  <t.icon className="size-[22px] text-[#5b43d6] transition-transform duration-200 group-hover:-translate-y-0.5" />
                  <h3 className={cn("mt-3.5 text-[14px] font-semibold", INK)}>{t.title}</h3>
                  <p className={cn("mt-1 text-[12.5px] leading-relaxed", INK_MUTED)}>{t.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
