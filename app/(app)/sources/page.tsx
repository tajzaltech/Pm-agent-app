"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Circle,
  Code2,
  Inbox,
  Plus,
  RefreshCw,
  Send,
  X,
} from "lucide-react";

import {
  FreshdeskLogo,
  GitHubLogo,
  LinearLogo,
  ZendeskLogo,
} from "@/components/shared/BrandLogos";
import { Button } from "@/components/ui/button";
import { MOCK_INTEGRATIONS, MOCK_REPOS } from "@/lib/mock/integrations";
import type { Integration, Repo } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

type PanelType = "source" | "repo" | "output" | null;

const FLOW_STEPS = [
  { label: "Sources", sub: "Tickets in", icon: Inbox, tone: "text-teal-600 bg-teal-50 border-teal-100" },
  { label: "Repos", sub: "Code context", icon: Code2, tone: "text-violet-600 bg-violet-50 border-violet-100" },
  { label: "Outputs", sub: "Work shipped", icon: Send, tone: "text-indigo-600 bg-indigo-50 border-indigo-100" },
];

function sourceLogo(provider: string) {
  if (provider === "zendesk") return <ZendeskLogo className="size-7" />;
  return <FreshdeskLogo className="size-7" />;
}

function statusMeta(status: string) {
  if (status === "connected" || status === "indexed") {
    return { label: "Healthy", dot: "bg-emerald-500", ring: "border-emerald-200/80 bg-white" };
  }
  if (status === "needs_reindex" || status === "connecting") {
    return { label: "Attention", dot: "bg-amber-500", ring: "border-amber-200/80 bg-amber-50/30" };
  }
  return { label: "Offline", dot: "bg-red-400", ring: "border-red-200/80 bg-red-50/30" };
}

export default function SourcesPage() {
  const [panel, setPanel] = useState<PanelType>(null);
  const sources = MOCK_INTEGRATIONS.filter((i) => i.type === "source");
  const outputs = MOCK_INTEGRATIONS.filter((i) => i.type === "output");
  const repos = MOCK_REPOS.filter((r) => r.selected);

  const stats = useMemo(
    () => ({
      sources: sources.filter((s) => s.status === "connected").length,
      repos: repos.filter((r) => r.status === "indexed").length,
      outputs: outputs.filter((o) => o.status === "connected").length + 1,
      weeklyTickets: sources.reduce((sum, s) => sum + (s.ticketCount ?? 0), 0),
    }),
    [outputs, repos, sources]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b bg-white/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Repos & Sources</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            How customer tickets flow into code analysis and delivery
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => toast.success("All connections synced")}
        >
          <RefreshCw className="size-3.5" /> Sync
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Stats strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatPill label="Sources live" value={stats.sources} accent="text-teal-600" />
            <StatPill label="Repos indexed" value={`${stats.repos}/${repos.length}`} accent="text-violet-600" />
            <StatPill label="Outputs active" value={stats.outputs} accent="text-indigo-600" />
            <StatPill label="Tickets / week" value={stats.weeklyTickets.toLocaleString()} accent="text-primary" />
          </div>

          {/* Flow steps — desktop only */}
          <div className="hidden lg:flex items-center justify-center gap-2 py-1">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium", step.tone)}>
                  <step.icon className="size-3.5" />
                  <span>{step.label}</span>
                  <span className="text-[10px] font-normal opacity-70">{step.sub}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Three columns */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-4">
            <FlowColumn
              title="Ticket Sources"
              description="Where customer feedback arrives"
              accent="from-teal-500/10 to-transparent border-teal-100/80"
              onAdd={() => setPanel("source")}
            >
              {sources.map((src) => (
                <ConnectionCard
                  key={src.id}
                  name={src.name}
                  subtitle={`${src.ticketCount?.toLocaleString() ?? 0} tickets / week`}
                  status={src.status}
                  icon={sourceLogo(src.provider)}
                  metric={src.ticketCount ?? 0}
                  metricLabel="volume"
                />
              ))}
            </FlowColumn>

            <FlowColumn
              title="Indexed Repos"
              description="Code the agent maps tickets against"
              accent="from-violet-500/10 to-transparent border-violet-100/80"
              onAdd={() => setPanel("repo")}
            >
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </FlowColumn>

            <FlowColumn
              title="Outputs & Agents"
              description="Where approved work gets delivered"
              accent="from-indigo-500/10 to-transparent border-indigo-100/80"
              onAdd={() => setPanel("output")}
            >
              {outputs.map((out) => (
                <ConnectionCard
                  key={out.id}
                  name={out.name}
                  subtitle={out.targetProject ?? "Connected"}
                  status={out.status}
                  icon={<LinearLogo className="size-7" />}
                  metric={out.ticketCount ?? 0}
                  metricLabel="pushed"
                />
              ))}
              <ConnectionCard
                name="Dev Agent"
                subtitle="Claude Code · auto-dispatch"
                status="connected"
                icon={
                  <span className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <Bot className="size-4" />
                  </span>
                }
                metric={12}
                metricLabel="runs"
              />
            </FlowColumn>
          </div>

          {/* Add panel */}
          {panel && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Connect a new {panel === "source" ? "ticket source" : panel === "repo" ? "repository" : "output"}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">
                    OAuth setup takes under a minute. Existing connection forms open here — no need to leave this page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    toast.success("Connection wizard opened");
                    setPanel(null);
                  }}
                >
                  Start setup <ArrowRight className="size-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPanel(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-xl font-bold tracking-tight", accent)}>{value}</p>
    </div>
  );
}

function FlowColumn({
  title,
  description,
  accent,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  accent: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border bg-gradient-to-b shadow-sm overflow-hidden",
        accent
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border/50 bg-white/70 px-4 py-3.5 backdrop-blur-sm">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1 text-xs text-primary" onClick={onAdd}>
          <Plus className="size-3.5" /> Add
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-3 bg-white/50">{children}</div>
    </section>
  );
}

function ConnectionCard({
  name,
  subtitle,
  status,
  icon,
  metric,
  metricLabel,
}: {
  name: string;
  subtitle: string;
  status: string;
  icon: React.ReactNode;
  metric: number;
  metricLabel: string;
}) {
  const meta = statusMeta(status);
  const intensity = Math.min(100, Math.round((metric / 900) * 100));

  return (
    <div
      className={cn(
        "group rounded-xl border p-3 transition-all hover:shadow-md hover:border-primary/20",
        meta.ring
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{name}</p>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Circle className={cn("size-1.5 fill-current", meta.dot.replace("bg-", "text-"))} />
              <span className="text-[10px] text-muted-foreground">{meta.label}</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
        </div>
      </div>
      {metric > 0 && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span className="capitalize">{metricLabel}</span>
            <span className="font-medium text-foreground/80">{metric.toLocaleString()}</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all group-hover:bg-primary"
              style={{ width: `${Math.max(intensity, 8)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RepoCard({ repo }: { repo: Repo }) {
  const meta = statusMeta(repo.status === "indexed" ? "indexed" : repo.status === "needs_reindex" ? "connecting" : "error");

  return (
    <div className={cn("rounded-xl border p-3 transition-all hover:shadow-md hover:border-primary/20", meta.ring)}>
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm">
          <GitHubLogo className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold font-mono truncate">{repo.name}</p>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Circle className={cn("size-1.5 fill-current", meta.dot.replace("bg-", "text-"))} />
              <span className="text-[10px] text-muted-foreground">{meta.label}</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.fullName}</p>
        </div>
      </div>
      <p className="mt-2.5 text-[10px] text-muted-foreground pl-14">
        {repo.status === "needs_reindex"
          ? "Re-index recommended after recent pushes"
          : `Last indexed ${formatRelativeTime(repo.lastIndexed)}`}
      </p>
    </div>
  );
}
