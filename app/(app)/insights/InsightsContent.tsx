"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
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
import { Download, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_ANALYTICS, MOCK_CLASSIFICATION_DIST, MOCK_CODE_AREAS } from "@/lib/mock/analytics";
import { useTicketStore } from "@/lib/store/tickets";
import { filterTicketsByClassification } from "@/lib/utils/workspace";
import type { Classification } from "@/lib/types";
import { cn } from "@/lib/utils";

const AI_PERFORMANCE = [
  { date: "Jun 10", overrideRate: 18, editRate: 24, acceptanceRate: 68 },
  { date: "Jun 12", overrideRate: 15, editRate: 21, acceptanceRate: 71 },
  { date: "Jun 14", overrideRate: 12, editRate: 19, acceptanceRate: 74 },
  { date: "Jun 16", overrideRate: 9, editRate: 16, acceptanceRate: 76 },
];

const CLASSIFICATION_MAP: Record<string, Classification> = {
  Bug: "bug",
  "Feature Request": "feature_request",
  Question: "question",
  "Churn Signal": "churn_signal",
};

export default function InsightsContent() {
  const { tickets } = useTicketStore();
  const [dateRange, setDateRange] = useState("30d");
  const compare = "last_month";

  const handlePieClick = (name: string) => {
    const classification = CLASSIFICATION_MAP[name];
    if (!classification) return;
    const count = filterTicketsByClassification(tickets, classification).length;
    toast.info(`${count} ${name} tickets — opening Triage filtered view`);
    window.location.href = `/triage?classification=${classification}`;
  };

  const exportData = (format: "csv" | "pdf") => {
    toast.success(`${format.toUpperCase()} export started — you'll receive a download shortly`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 border-b bg-card/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-medium tracking-tight">Insights</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Click any chart segment to drill down</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* 2.1 Recommendation cards */}
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              title: "Billing acceptance dropped 18% this week",
              body: "3 tickets were re-opened after Accept (non-technical). Review before closing.",
              href: "/triage?classification=bug",
            },
            {
              title: "Chat-originated tickets: 82% accepted",
              body: "PM Agent Chat escalations are holding up — 4 pending confirmation in Triage.",
              href: "/triage",
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-xl border bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <p className="text-sm font-semibold leading-snug">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{card.body}</p>
              <span className="text-xs text-primary mt-2 inline-block">View tickets →</span>
            </Link>
          ))}
        </div>

        {/* Delivery health + chat accuracy */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery health</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { label: "Median cycle", value: "2.4d", accent: "text-foreground" },
              { label: "In Dev Agent", value: "5", accent: "text-violet-600" },
              { label: "Shipped this week", value: "12", accent: "text-emerald-600" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center px-3 py-4 text-center">
                <p className={cn("text-xl font-bold tabular-nums leading-none", s.accent)}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="border-t bg-muted/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <p className="text-sm font-semibold text-foreground">PM Agent Chat accuracy</p>
            <p className="text-xs text-muted-foreground">
              74% accepted · 12% rejected · 14% ignored
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Acceptance rate", current: "74%", prior: "70%", up: true },
            { label: "Median cycle time", current: "2.4m", prior: "3.2m", up: true },
            { label: "Ticket volume", current: "248", prior: "221", up: false },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-bold">{m.current}</p>
                <span className={cn("text-xs font-semibold flex items-center gap-0.5", m.up ? "text-emerald-600" : "text-amber-600")}>
                  {m.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  vs {compare} ({m.prior})
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-1">Classification breakdown</h2>
            <p className="text-xs text-muted-foreground mb-4">Click a slice to view matching tickets in Triage</p>
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_CLASSIFICATION_DIST}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    className="cursor-pointer"
                    onClick={(_, index) => handlePieClick(MOCK_CLASSIFICATION_DIST[index].name)}
                  >
                    {MOCK_CLASSIFICATION_DIST.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} className="hover:opacity-80" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {MOCK_CLASSIFICATION_DIST.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => handlePieClick(d.name)}
                    className="flex items-center gap-2 w-full text-left text-sm hover:bg-muted/40 rounded-lg px-2 py-1 transition-colors"
                  >
                    <span className="size-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                    <span className="flex-1">{d.name}</span>
                    <span className="font-semibold">{d.value}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4">Tickets over time</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_ANALYTICS.slice(-7)}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="accepted" fill="#10b981" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={() => { window.location.href = "/triage"; }} />
                  <Bar dataKey="rejected" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold">AI Performance — override & edit rates</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Lower override rate = more trust in automation over time</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={AI_PERFORMANCE}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="overrideRate" stroke="#ef4444" strokeWidth={2} name="Override rate" dot={false} />
                <Line type="monotone" dataKey="editRate" stroke="#f59e0b" strokeWidth={2} name="Edit rate" dot={false} />
                <Line type="monotone" dataKey="acceptanceRate" stroke="#10b981" strokeWidth={2} name="Acceptance rate" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Top affected code areas</h2>
          <div className="space-y-2">
            {MOCK_CODE_AREAS.map((area) => (
              <Link
                key={area.area}
                href={`/triage?search=${encodeURIComponent(area.area)}`}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-muted/30 transition-colors"
              >
                <span className="font-mono text-xs flex-1">{area.area}</span>
                <span className="text-sm font-semibold">{area.count} tickets</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
