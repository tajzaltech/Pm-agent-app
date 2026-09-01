"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Download, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTicketStore } from "@/lib/store/tickets";
import { usePipelineStore } from "@/lib/store/pipeline";
import { filterTicketsByClassification } from "@/lib/utils/workspace";
import {
  computeAcceptanceBreakdown,
  computeProcessingStats,
  getProcessingTicketLists,
  PROCESSING_CATEGORY_LABELS,
  type ProcessingCategory,
} from "@/lib/utils/insights-stats";
import { ProcessingTicketList } from "@/components/insights/ProcessingTicketList";
import { CountUp, Panel, Sparkline, VIZ, VizTooltip } from "@/components/insights/InsightsPrimitives";
import type { Classification } from "@/lib/types";
import { cn } from "@/lib/utils";

const CLASSIFICATION_MAP: Record<string, Classification> = {
  Bug: "bug",
  "Feature Request": "feature_request",
  Question: "question",
  "Churn Signal": "churn_signal",
};

/** Validated categorical slots, in fixed order — see VIZ in InsightsPrimitives. */
const CLASS_FILL: Record<string, string> = {
  Bug: VIZ.bug,
  "Feature Request": VIZ.feature,
  Question: VIZ.question,
  "Churn Signal": VIZ.churn,
};

export default function InsightsContent() {
  const router = useRouter();
  const { tickets } = useTicketStore();
  const pipelineCards = usePipelineStore((s) => s.cards);
  const [dateRange, setDateRange] = useState("30d");
  const [activeCategory, setActiveCategory] = useState<ProcessingCategory | null>(null);
  const reduce = useReducedMotion();
  const compare = "last month";

  const stats = useMemo(() => computeProcessingStats(tickets, pipelineCards), [tickets, pipelineCards]);
  const ticketLists = useMemo(() => getProcessingTicketLists(tickets, pipelineCards), [tickets, pipelineCards]);
  const acceptance = useMemo(() => computeAcceptanceBreakdown(tickets), [tickets]);
  const chatAcceptRate =
    stats.chatOriginated > 0 ? Math.round((stats.chatAccepted / stats.chatOriginated) * 100) : 0;

  const series = useMemo(() => {
    const buckets = new Map<string, { date: string; processed: number; accepted: number; rejected: number }>();
    for (const ticket of tickets) {
      const date = (ticket.createdAt ?? "").slice(0, 10) || "unknown";
      const row = buckets.get(date) ?? { date, processed: 0, accepted: 0, rejected: 0 };
      row.processed += 1;
      if (ticket.status === "accepted") row.accepted += 1;
      if (ticket.status === "rejected") row.rejected += 1;
      buckets.set(date, row);
    }
    return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  }, [tickets]);

  const dist = useMemo(() => {
    const counts: Record<string, number> = { Bug: 0, "Feature Request": 0, Question: 0, "Churn Signal": 0 };
    for (const ticket of tickets) {
      if (ticket.classification === "bug") counts.Bug += 1;
      if (ticket.classification === "feature_request") counts["Feature Request"] += 1;
      if (ticket.classification === "question") counts.Question += 1;
      if (ticket.classification === "churn_signal") counts["Churn Signal"] += 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: CLASS_FILL[name] ?? VIZ.brand }));
  }, [tickets]);

  const codeAreas = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ticket of tickets) {
      for (const ref of ticket.codeRefs) {
        const area = ref.filePath.split("/").slice(0, 2).join("/") || ref.filePath;
        counts.set(area, (counts.get(area) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [tickets]);

  const distTotal = dist.reduce((sum, d) => sum + d.value, 0);
  const areaMax = Math.max(1, ...codeAreas.map((a) => a.count));

  const aiPerformance = useMemo(() => {
    const decided = tickets.filter((t) => t.status !== "pending");
    const accepted = decided.filter((t) => t.status === "accepted").length;
    const rejected = decided.filter((t) => t.status === "rejected" || t.status === "ignored").length;
    const rate = decided.length ? Math.round((accepted / decided.length) * 100) : 0;
    return [
      {
        date: "Now",
        acceptanceRate: rate,
        editRate: 0,
        overrideRate: decided.length ? Math.round((rejected / decided.length) * 100) : 0,
      },
    ];
  }, [tickets]);

  const KPIS = [
    {
      key: "processed" as const,
      label: "Processed",
      value: stats.processed,
      hint: "Accepted, rejected, or ignored",
      trend: series.map((d) => d.processed),
      delta: 12,
    },
    {
      key: "in_process" as const,
      label: "In process",
      value: stats.inProcess,
      hint: `${stats.pending} in triage · ${stats.inPipeline} in pipeline`,
      trend: series.map((d) => d.accepted),
      delta: 5,
    },
    {
      key: "sent_to_developer" as const,
      label: "Sent to developer",
      value: stats.sentToDeveloper,
      hint: `${stats.inDevAgent} active in Dev Agent`,
      trend: series.map((d) => d.accepted),
      delta: 8,
    },
    {
      key: "responded_back" as const,
      label: "Responded back",
      value: stats.respondedBack,
      hint: "Non-technical replies sent",
      trend: series.map((d) => d.rejected),
      delta: -3,
    },
  ];

  // Funnel stages read as one magnitude progression, so they use the sequential ramp.
  const FUNNEL = [
    { label: "Intake", value: tickets.length },
    { label: "In Triage", value: stats.pending },
    { label: "In Dev Agent", value: stats.inDevAgent },
    { label: "Shipped", value: stats.shippedThisWeek },
  ];
  const funnelMax = Math.max(...FUNNEL.map((f) => f.value), 1);

  const handleSliceClick = (name: string) => {
    const classification = CLASSIFICATION_MAP[name];
    if (!classification) return;
    const count = filterTicketsByClassification(tickets, classification).length;
    toast.info(`${count} ${name} tickets — opening Triage filtered view`);
    router.push(`/triage?classification=${classification}`);
  };

  const exportData = (format: "csv" | "pdf") => {
    toast.success(`${format.toUpperCase()} export started — you'll receive a download shortly`);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/85 px-4 backdrop-blur-xl md:px-6">
        <div>
          <h1 className="text-[15px] font-semibold tracking-[-0.015em]">Insights</h1>
          <p className="hidden text-[11.5px] text-muted-foreground sm:block">
            Live view of how tickets move from support to shipped
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => exportData("csv")}>
            <Download className="size-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => exportData("pdf")}>
            <Download className="size-3.5" /> PDF
          </Button>
        </div>
      </header>

      <div className="w-full flex-1 space-y-4 overflow-y-auto bg-[#fbfaff] p-4 md:p-6">
        {/* ── KPI row ─────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((k, i) => {
            const isActive = activeCategory === k.key;
            const up = k.delta >= 0;
            return (
              <motion.button
                key={k.key}
                type="button"
                onClick={() => setActiveCategory(isActive ? null : k.key)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduce ? undefined : { y: -2 }}
                className={cn(
                  "group rounded-2xl border bg-white p-4 text-left transition-colors",
                  "shadow-[0_1px_2px_rgba(16,17,24,0.04),0_12px_32px_-20px_rgba(46,26,120,0.18)]",
                  isActive ? "border-primary/40 ring-2 ring-primary/10" : "border-black/[0.06] hover:border-primary/25"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-medium text-muted-foreground">{k.label}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold",
                      up ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {up ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                    {Math.abs(k.delta)}%
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <CountUp value={k.value} className="text-[30px] font-semibold leading-none tracking-[-0.03em]" />
                  <Sparkline data={k.trend} />
                </div>
                <p className="mt-2.5 truncate text-[11px] text-muted-foreground/80">{k.hint}</p>
                <p className="mt-1.5 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {isActive ? "Hide tickets ↑" : "View tickets ↓"}
                </p>
              </motion.button>
            );
          })}
        </div>

        {activeCategory && (
          <Panel className="p-0">
            <ProcessingTicketList
              category={activeCategory}
              label={PROCESSING_CATEGORY_LABELS[activeCategory]}
              items={ticketLists[activeCategory]}
              onClose={() => setActiveCategory(null)}
            />
          </Panel>
        )}

        {/* ── Funnel ──────────────────────────────────────── */}
        <Panel
          title="Delivery funnel"
          subtitle="Where every ticket currently sits"
          action={
            <Link
              href="/triage"
              className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-primary hover:underline"
            >
              Open Triage <ArrowRight className="size-3" />
            </Link>
          }
        >
          <ul className="space-y-3">
            {FUNNEL.map((f, i) => (
              <li key={f.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[12.5px] font-medium text-muted-foreground">{f.label}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-[#f4f2fc]">
                  <motion.div
                    className="h-full rounded-lg"
                    style={{ background: VIZ.ramp[i + 1] }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.max((f.value / funnelMax) * 100, f.value > 0 ? 6 : 0)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <CountUp value={f.value} className="w-8 shrink-0 text-right text-[14px] font-semibold" />
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-col gap-1 border-t pt-3 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-foreground">Ask PM accuracy</span>
            <span>
              {acceptance.total > 0
                ? `${acceptance.acceptedPct}% accepted · ${acceptance.rejectedPct}% rejected · ${acceptance.ignoredPct}% ignored`
                : "No reviewed tickets yet — accept or reject in Triage to track accuracy"}
            </span>
          </p>
        </Panel>

        {/* ── Classification + volume ─────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Classification breakdown" subtitle="Click a slice to filter Triage" delay={0.05}>
            <div className="flex items-center gap-4">
              <div className="relative h-52 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-pointer"
                      isAnimationActive={!reduce}
                      animationDuration={900}
                      onClick={(_, index) => handleSliceClick(dist[index].name)}
                    >
                      {dist.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<VizTooltip unit="%" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <CountUp value={distTotal} className="text-[22px] font-semibold leading-none" />
                  <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">total</span>
                </div>
              </div>
              {/* Direct labels: identity is never carried by color alone. */}
              <ul className="min-w-0 flex-1 space-y-1">
                {dist.map((d) => (
                  <li key={d.name}>
                    <button
                      type="button"
                      onClick={() => handleSliceClick(d.name)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.fill }} />
                      <span className="min-w-0 flex-1 truncate text-[12.5px]">{d.name}</span>
                      <span className="shrink-0 text-[12.5px] font-semibold tabular-nums">{d.value}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel title="Tickets processed over time" subtitle="Last 10 days" delay={0.1}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={VIZ.brand} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={VIZ.brand} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={VIZ.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: VIZ.axis }}
                    tickLine={false}
                    axisLine={{ stroke: VIZ.grid }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: VIZ.axis }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<VizTooltip />} cursor={{ stroke: VIZ.brand, strokeOpacity: 0.25 }} />
                  <Area
                    type="monotone"
                    dataKey="processed"
                    name="Processed"
                    stroke={VIZ.brand}
                    strokeWidth={2}
                    fill="url(#volumeFill)"
                    isAnimationActive={!reduce}
                    animationDuration={900}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ── AI performance + code areas ─────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Ask PM performance"
            subtitle="Lower override rate means more trust in automation"
            delay={0.05}
          >
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
              {[
                ["Acceptance", VIZ.feature],
                ["Edit rate", VIZ.question],
                ["Override", VIZ.bug],
              ].map(([label, color]) => (
                <span key={label} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiPerformance} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={VIZ.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: VIZ.axis }}
                    tickLine={false}
                    axisLine={{ stroke: VIZ.grid }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: VIZ.axis }}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                    width={38}
                  />
                  <Tooltip content={<VizTooltip unit="%" />} />
                  <Line
                    type="monotone"
                    dataKey="acceptanceRate"
                    name="Acceptance"
                    stroke={VIZ.feature}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={!reduce}
                  />
                  <Line
                    type="monotone"
                    dataKey="editRate"
                    name="Edit rate"
                    stroke={VIZ.question}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={!reduce}
                  />
                  <Line
                    type="monotone"
                    dataKey="overrideRate"
                    name="Override"
                    stroke={VIZ.bug}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={!reduce}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Top affected code areas" subtitle="Ticket volume by directory" delay={0.1}>
            <ul className="space-y-2">
              {codeAreas.map((area, i) => (
                <li key={area.area}>
                  <Link
                    href={`/triage?search=${encodeURIComponent(area.area)}`}
                    className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="w-32 shrink-0 truncate font-mono text-[11.5px] text-foreground/80">
                      {area.area}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#f4f2fc]">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: VIZ.ramp[3] }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(area.count / areaMax) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-[12.5px] font-semibold tabular-nums">
                      {area.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* ── Next actions ────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            stats.pending > 0
              ? {
                  title: `${stats.pending} ticket${stats.pending === 1 ? "" : "s"} waiting in Triage`,
                  body: `${Math.max(0, stats.inProcess - stats.pending)} already in the dev pipeline.`,
                  href: "/triage",
                }
              : {
                  title: "Triage queue is clear",
                  body: "New tickets will appear here for review.",
                  href: "/triage",
                },
            stats.chatOriginated > 0
              ? {
                  title: `Chat-originated tickets: ${chatAcceptRate}% accepted`,
                  body: `${stats.chatOriginated - stats.chatAccepted} still pending confirmation.`,
                  href: "/triage",
                }
              : {
                  title: "Ask PM escalations",
                  body: "Generate tickets from chat — they land in Triage for review.",
                  href: "/chat",
                },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={card.href}
                className="group flex h-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(16,17,24,0.04)] transition-colors hover:border-primary/25"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-snug">{card.title}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{card.body}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="pb-2 text-center text-[11px] text-muted-foreground/60">
          Compared against {compare}
        </p>
      </div>
    </div>
  );
}
