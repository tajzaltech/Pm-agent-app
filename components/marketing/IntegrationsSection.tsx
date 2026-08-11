"use client";

import { ArrowRight, Eye, GitBranch, Inbox, KeyRound, Rocket, ShieldCheck, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { FreshdeskLogo } from "@/components/shared/BrandLogos";
import { BrandMark, type Brand } from "@/components/marketing/BrandTile";
import { CARD, CARD_SHADOW, INK, INK_FAINT, INK_MUTED, LINE, mono } from "@/components/marketing/theme";
import { Reveal, SectionHead, StatusPill } from "@/components/marketing/ui";

type Tone = "live" | "beta" | "neutral";
type Node = Brand & { tone: Tone; label: string };

const GROUPS: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  caption: string;
  nodes: Node[];
}[] = [
  {
    icon: Inbox,
    title: "Support",
    caption: "Reads",
    nodes: [
      { name: "Zendesk", slug: "zendesk", color: "03363D", tone: "live", label: "Live" },
      { name: "Freshdesk", Logo: FreshdeskLogo, tone: "live", label: "Live" },
      { name: "Email", slug: "maildotru", color: "005FF9", tone: "live", label: "Live" },
      { name: "Intercom", slug: "intercom", color: "1F8DED", tone: "beta", label: "Beta" },
      { name: "Help Scout", slug: "helpscout", color: "1292EE", tone: "beta", label: "Beta" },
    ],
  },
  {
    icon: GitBranch,
    title: "Code",
    caption: "Reads",
    nodes: [
      { name: "GitHub", slug: "github", color: "181717", tone: "live", label: "Live" },
      { name: "GitLab", slug: "gitlab", color: "FC6D26", tone: "beta", label: "Beta" },
      { name: "Sentry", slug: "sentry", color: "362D59", tone: "beta", label: "Beta" },
      { name: "Bitbucket", slug: "bitbucket", color: "0052CC", tone: "neutral", label: "Soon" },
    ],
  },
  {
    icon: Rocket,
    title: "Delivery",
    caption: "Writes",
    nodes: [
      { name: "Jira", slug: "jira", color: "0052CC", tone: "live", label: "Live" },
      { name: "Linear", slug: "linear", color: "5E6AD2", tone: "live", label: "Live" },
      { name: "GitHub Issues", slug: "github", color: "181717", tone: "live", label: "Live" },
      { name: "Asana", slug: "asana", color: "F06A6A", tone: "neutral", label: "Soon" },
      { name: "ClickUp", slug: "clickup", tone: "neutral", label: "Soon" },
    ],
  },
];

const TRUST = [
  { icon: UserCheck, title: "Human approval", body: "Nothing ships without a person." },
  { icon: Eye, title: "Read-only code", body: "Never pushes, branches, or commits." },
  { icon: KeyRound, title: "Scoped access", body: "Only the projects you select." },
  { icon: ShieldCheck, title: "Traceable claims", body: "Every answer links to its source." },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className={cn("scroll-mt-16 border-y bg-[#fbfbfd] py-24 sm:py-28", LINE)}>
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHead eyebrow="Integrations" title="Reads from support and code. Writes to your tracker." />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {GROUPS.map((g, i) => (
            <Reveal key={g.title} delay={i * 0.08}>
              <div className={cn("flex h-full flex-col p-6", CARD, CARD_SHADOW)}>
                <div className="flex items-center gap-2.5">
                  <g.icon className="size-[18px] shrink-0 text-[#5b43d6]" />
                  <h3 className={cn("text-[15.5px] font-semibold tracking-[-0.015em]", INK)}>{g.title}</h3>
                  <span
                    className={cn("ml-auto flex items-center gap-1 text-[10.5px] uppercase tracking-[0.12em]", mono, INK_FAINT)}
                  >
                    {g.caption} <ArrowRight className="size-3" />
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {g.nodes.map((n) => (
                    <div
                      key={n.name}
                      className={cn("flex flex-col gap-2.5 rounded-xl border bg-[#fbfbfd] p-3", LINE)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <BrandMark brand={n} className="size-6" />
                        <StatusPill tone={n.tone}>{n.label}</StatusPill>
                      </div>
                      <span className={cn("truncate text-[12.5px] font-medium", INK)}>{n.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* security */}
        <div id="security" className="mt-20 scroll-mt-20">
          <Reveal>
            <SectionHead eyebrow="Security" title="Trusted with your inbox and your repository." />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.06}>
                <div className={cn("h-full p-5", CARD, CARD_SHADOW)}>
                  <t.icon className="size-[22px] text-[#5b43d6]" />
                  <h3 className={cn("mt-4 text-[14px] font-semibold", INK)}>{t.title}</h3>
                  <p className={cn("mt-1 text-[12.5px] leading-relaxed", INK_MUTED)}>{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
