"use client";

import { useState } from "react";
import { MOCK_ANALYTICS, MOCK_CLASSIFICATION_DIST, MOCK_CODE_AREAS } from "@/lib/mock/analytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, Zap } from "lucide-react";

const METRICS = [
  { label: "Total Processed", value: "248", delta: "+12 this week", up: true, color: "text-violet-600", dot: "bg-violet-500" },
  { label: "Acceptance Rate", value: "74%", delta: "+4% vs prior", up: true, color: "text-emerald-600", dot: "bg-emerald-500" },
  { label: "Median Draft Time", value: "4 min", delta: "ticket → spec", up: null, color: "text-blue-600", dot: "bg-blue-500" },
  { label: "End-to-End", value: "6.4 min", delta: "customer → dev", up: null, color: "text-amber-600", dot: "bg-amber-500" },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [source, setSource] = useState("all");

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-6 h-14 flex items-center justify-between shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => { if (v) setDateRange(v); }}>
            <SelectTrigger className="h-8 w-32 text-sm bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={(v) => { if (v) setSource(v); }}>
            <SelectTrigger className="h-8 w-36 text-sm bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="freshdesk">Freshdesk</SelectItem>
              <SelectItem value="zendesk">Zendesk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="px-6 py-4 border-b border-border/40 grid grid-cols-4 divide-x divide-border/40 shrink-0">
        {METRICS.map(({ label, value, delta, up, color, dot }) => (
          <div key={label} className="px-5 first:pl-0 last:pr-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full shrink-0", dot)} />
              <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
            </div>
            <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
            <div className="flex items-center gap-1">
              {up === true && <TrendingUp className="size-3 text-emerald-500" />}
              {up === false && <TrendingDown className="size-3 text-red-400" />}
              <span className="text-[11px] text-muted-foreground">{delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3-column kanban layout — each column scrolls independently */}
      <div className="flex flex-1 divide-x divide-border/40 overflow-hidden">

        {/* Column 1 — Trend */}
        <div className="flex-[2] min-w-0 flex flex-col overflow-y-auto">
          <div className="px-6 pt-5 pb-3 shrink-0">
            <h2 className="text-sm font-semibold">Ticket Trend</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Processed, accepted, rejected over time</p>
          </div>

          {/* Legend */}
          <div className="px-6 pb-3 flex items-center gap-4 shrink-0">
            {[
              { label: "Processed", color: "bg-violet-500" },
              { label: "Accepted", color: "bg-emerald-500" },
              { label: "Rejected", color: "bg-red-400" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", color)} />
                {label}
              </div>
            ))}
          </div>

          <div className="px-4 flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ANALYTICS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gProcessed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 2" }} />
                <Area type="monotone" dataKey="processed" stroke="#6366f1" strokeWidth={2} fill="url(#gProcessed)" name="Processed" dot={false} />
                <Area type="monotone" dataKey="accepted" stroke="#10b981" strokeWidth={2} fill="url(#gAccepted)" name="Accepted" dot={false} />
                <Area type="monotone" dataKey="rejected" stroke="#f87171" strokeWidth={2} fill="none" strokeDasharray="4 2" name="Rejected" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Timing below chart */}
          <div className="px-6 py-5 border-t border-border/40 space-y-3 shrink-0">
            <h3 className="text-sm font-semibold">End-to-End Timing</h3>
            <div className="space-y-2.5">
              {[
                { label: "Median draft time", value: "4 min", color: "text-violet-600", bar: "bg-violet-400", pct: 62 },
                { label: "Median review time", value: "2.4 min", color: "text-blue-600", bar: "bg-blue-400", pct: 37 },
                { label: "Total end-to-end", value: "6.4 min", color: "text-emerald-600", bar: "bg-emerald-400", pct: 100 },
              ].map(({ label, value, color, bar, pct }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn("text-sm font-bold", color)}>{value}</p>
                  </div>
                  <div className="h-1 rounded-full bg-muted/50">
                    <div className={cn("h-1 rounded-full", bar)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2 — Classification */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <div className="px-5 pt-5 pb-3 shrink-0">
            <h2 className="text-sm font-semibold">Classification</h2>
            <p className="text-xs text-muted-foreground mt-0.5">By ticket type</p>
          </div>

          <div className="px-4 h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MOCK_CLASSIFICATION_DIST} cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {MOCK_CLASSIFICATION_DIST.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }} formatter={(v) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend rows */}
          <div className="px-5 py-3 space-y-2 flex-1">
            {MOCK_CLASSIFICATION_DIST.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="size-2 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="flex-1 text-xs text-muted-foreground">{d.name}</span>
                <div className="w-20 h-1 rounded-full bg-muted/50">
                  <div className="h-1 rounded-full" style={{ width: `${d.value}%`, background: d.fill }} />
                </div>
                <span className="text-xs font-semibold w-8 text-right">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3 — Code Areas */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <div className="px-5 pt-5 pb-3 shrink-0">
            <h2 className="text-sm font-semibold">Code Areas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Most affected by tickets</p>
          </div>

          <div className="px-2 flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CODE_AREAS} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="area" tick={{ fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }} cursor={{ fill: "#f4f4ff" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top areas list */}
          <div className="px-5 py-4 border-t border-border/40 space-y-2 shrink-0">
            <p className="text-[11px] text-muted-foreground font-medium">Top areas</p>
            {MOCK_CODE_AREAS.slice(0, 4).map((d, i) => (
              <div key={d.area} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50 w-3">{i + 1}</span>
                <span className="font-mono text-[11px] flex-1 text-muted-foreground truncate">{d.area}</span>
                <span className="text-xs font-semibold text-violet-600">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
