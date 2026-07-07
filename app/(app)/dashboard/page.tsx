"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Inbox,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { Button } from "@/components/ui/button";
import { MOCK_INTEGRATIONS, MOCK_REPOS } from "@/lib/mock/integrations";
import { useTicketStore } from "@/lib/store/tickets";
import {
  attentionTickets,
  confidenceDistribution,
  hoursSavedForTicket,
  KPI_SPARKLINES,
} from "@/lib/utils/workspace";
import { cn, formatRelativeTime } from "@/lib/utils";

const KPI_CONFIG = [
  { key: "tickets", label: "Tickets this week", value: "248", delta: "+12", href: "/insights?metric=tickets", color: "#6366f1", data: KPI_SPARKLINES.tickets.map((v, i) => ({ i, v })) },
  { key: "acceptance", label: "Acceptance rate", value: "74%", delta: "+4%", href: "/insights?metric=acceptance", color: "#10b981", data: KPI_SPARKLINES.acceptance.map((v, i) => ({ i, v })) },
  { key: "cycle", label: "Median cycle time", value: "2.4m", delta: "−0.8m", href: "/insights?metric=cycle", color: "#3b82f6", data: KPI_SPARKLINES.cycle.map((v, i) => ({ i, v })) },
  { key: "auto", label: "Auto-resolved", value: "8", delta: "+3", href: "/insights?metric=auto", color: "#f59e0b", data: KPI_SPARKLINES.autoResolved.map((v, i) => ({ i, v })) },
  { key: "hours", label: "Eng hours saved", value: "42h", delta: "+10h", href: "/insights?metric=hours", color: "#8b5cf6", data: KPI_SPARKLINES.hoursSaved.map((v, i) => ({ i, v })) },
];

export default function CommandCenterPage() {
  const { tickets, activity } = useTicketStore();
  const attention = useMemo(() => attentionTickets(tickets), [tickets]);
  const confidence = useMemo(() => confidenceDistribution(tickets), [tickets]);
  const accepted = tickets.filter((t) => t.status === "accepted");
  const hoursSaved = accepted.reduce((sum, t) => sum + hoursSavedForTicket(t), 0);
  const churnCaught = tickets.filter((t) => t.classification === "churn_signal" && t.status !== "rejected").length;
  const acceptanceRate = tickets.length ? Math.round((accepted.length / tickets.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center shrink-0">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Command Center</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">What needs attention right now</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {KPI_CONFIG.map((kpi) => (
            <Link
              key={kpi.key}
              href={kpi.href}
              className="rounded-xl border bg-white p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <div className="flex items-end justify-between mt-1 gap-2">
                <p className="text-xl font-bold">{kpi.value}</p>
                <span className="text-[10px] font-semibold text-emerald-600">{kpi.delta}</span>
              </div>
              <div className="h-8 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpi.data}>
                    <Area type="monotone" dataKey="v" stroke={kpi.color} fill={kpi.color} fillOpacity={0.15} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                View in Insights <ChevronRight className="size-3" />
              </p>
            </Link>
          ))}
        </div>

        {/* Impact banner */}
        <Link
          href="/insights?tab=summary"
          className="block rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-violet-50 to-white p-4 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">This week&apos;s impact</p>
              <p className="text-sm md:text-base font-medium mt-1 leading-relaxed">
                PM Agent saved an estimated <strong>{hoursSaved} engineering hours</strong>, caught{" "}
                <strong>{churnCaught} churn signals</strong> early, and maintained a{" "}
                <strong>{acceptanceRate}% acceptance rate</strong> — ready for your standup or leadership update.
              </p>
            </div>
            <ArrowRight className="size-5 text-primary shrink-0 mt-1" />
          </div>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Attention needed */}
          <div className="lg:col-span-2 rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <h2 className="text-sm font-semibold">Attention Needed</h2>
              </div>
              <Link href="/triage" className="text-xs text-primary hover:underline">Open Triage →</Link>
            </div>
            <div className="divide-y">
              {attention.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">All clear — no urgent drafts</p>
              ) : (
                attention.map((t) => (
                  <Link
                    key={t.id}
                    href={`/triage?ticket=${t.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1 mb-1">
                        <ClassificationBadge classification={t.classification} size="sm" />
                        <ScopeBadge scope={t.scope} className="size-5 text-[10px]" />
                        {(t.priorityScore ?? 0) >= 40 && (
                          <span className="text-[10px] bg-red-50 text-red-700 px-1.5 rounded font-semibold">High risk</span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{t.draftTitle}</p>
                      <p className="text-xs text-muted-foreground">{t.customer.name} · {formatRelativeTime(t.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-xs font-bold", t.aiConfidenceLevel === "low" ? "text-red-600" : "text-muted-foreground")}>
                        {t.aiConfidence}%
                      </p>
                      <ChevronRight className="size-4 text-muted-foreground ml-auto mt-1" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* AI confidence + activity */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-4 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-violet-500" /> AI Confidence
              </h2>
              {[
                { label: "High", count: confidence.high, color: "bg-emerald-500" },
                { label: "Medium", count: confidence.medium, color: "bg-amber-500" },
                { label: "Low", count: confidence.low, color: "bg-red-500" },
              ].map(({ label, count, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, count * 12)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-white overflow-hidden">
              <div className="px-4 py-3 border-b">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="size-4 text-blue-500" /> Live Activity
                </h2>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y">
                {activity.slice(0, 6).map((entry) => (
                  <Link key={entry.id} href={`/triage?ticket=${entry.ticketId}`} className="block px-4 py-2.5 hover:bg-muted/20 text-xs">
                    <span className="font-medium capitalize">{entry.action.replace("_", " ")}</span>
                    <span className="text-muted-foreground"> · {entry.ticketTitle.slice(0, 40)}…</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System health */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">System Health</h2>
            <Link href="/sources"><Button variant="ghost" size="sm" className="h-7 text-xs">Repos & Sources →</Button></Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <HealthGroup title="Ticket Sources" items={MOCK_INTEGRATIONS.filter((i) => i.type === "source").map((i) => ({ name: i.name, ok: i.status === "connected" }))} />
            <HealthGroup title="Indexed Repos" items={MOCK_REPOS.filter((r) => r.selected).map((r) => ({ name: r.name, ok: r.status === "indexed" }))} />
            <HealthGroup title="Outputs & Agents" items={[
              ...MOCK_INTEGRATIONS.filter((i) => i.type === "output").map((i) => ({ name: i.name, ok: i.status === "connected" })),
              { name: "Dev Agent", ok: true },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthGroup({ title, items }: { title: string; items: { name: string; ok: boolean }[] }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <Circle className={cn("size-2 fill-current", item.ok ? "text-emerald-500" : "text-red-400")} />
          <span className="truncate flex-1">{item.name}</span>
        </div>
      ))}
    </div>
  );
}
