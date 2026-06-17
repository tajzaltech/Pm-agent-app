"use client";

import { useState } from "react";
import Link from "next/link";
import { useTicketStore } from "@/lib/store/tickets";
import { useAlertStore } from "@/lib/store/alerts";
import { MOCK_INTEGRATIONS, MOCK_REPOS } from "@/lib/mock/integrations";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  Inbox,
  CheckCircle2,
  Clock,
  BarChart3,
  AlertTriangle,
  X,
  Bell,
  BellOff,
  Circle,
  RefreshCw,
  ChevronRight,
  CheckCheck,
  XCircle,
  PenLine,
  Zap,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const { tickets, activity } = useTicketStore();
  const { alerts, dismiss, snooze } = useAlertStore();
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const pending = tickets.filter((t) => t.status === "pending").length;
  const accepted = tickets.filter((t) => t.status === "accepted").length;
  const rejected = tickets.filter((t) => t.status === "rejected").length;
  const total = tickets.length;
  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const activeAlerts = alerts.filter((a) => !a.dismissed);

  const filteredActivity =
    activityFilter === "all" ? activity : activity.filter((a) => a.action === activityFilter);

  const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    accepted:       { label: "Accepted",        icon: <CheckCheck className="size-3.5" />,  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
    rejected:       { label: "Rejected",        icon: <XCircle className="size-3.5" />,     color: "text-red-600",     bg: "bg-red-50 border-red-100" },
    edited:         { label: "Edited",          icon: <PenLine className="size-3.5" />,     color: "text-violet-700",  bg: "bg-violet-50 border-violet-100" },
    edited_accepted:{ label: "Edit & Accept",   icon: <PenLine className="size-3.5" />,     color: "text-blue-700",    bg: "bg-blue-50 border-blue-100" },
    new_draft:      { label: "New Draft",       icon: <Zap className="size-3.5" />,         color: "text-amber-700",   bg: "bg-amber-50 border-amber-100" },
  };

  const FILTER_TABS = ["all", "accepted", "rejected", "edited", "edited_accepted", "new_draft"];

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-6 h-14 flex items-center justify-between shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 border rounded-lg px-3 py-1.5">
            <Activity className="size-3.5 text-emerald-500" />
            Agent active · last run 3m ago
          </div>

          {/* Alert bell */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative inline-flex size-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
              <Bell className="size-4" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {activeAlerts.length}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-2xl">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="text-sm font-semibold">Alerts</p>
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{activeAlerts.length} active</Badge>
                )}
              </div>
              {activeAlerts.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Bell className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active alerts</p>
                </div>
              ) : (
                <div className="divide-y max-h-80 overflow-y-auto">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className={cn(
                      "flex items-start gap-3 px-4 py-3",
                      alert.severity === "high" ? "bg-red-50/60" : "bg-orange-50/60"
                    )}>
                      <AlertTriangle className={cn("size-4 mt-0.5 shrink-0", alert.severity === "high" ? "text-red-500" : "text-orange-400")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold", alert.severity === "high" ? "text-red-800" : "text-orange-800")}>{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.description}</p>
                        {alert.clusterId && (
                          <Link href={`/clusters/${alert.clusterId}`} className="text-xs text-primary hover:underline mt-1 inline-block font-medium">
                            View cluster →
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button size="icon" variant="ghost" className="size-6" title="Snooze" onClick={() => snooze(alert.id)}>
                          <BellOff className="size-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-6" title="Dismiss" onClick={() => dismiss(alert.id)}>
                          <X className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    <div className="p-6 space-y-7">

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Tickets Processed"
          value={total}
          sublabel="this week"
          icon={<Inbox className="size-5" />}
          iconBg="bg-violet-100 text-violet-600"
          trend="up"
          trendLabel="+12 vs last week"
        />
        <StatCard
          label="Acceptance Rate"
          value={`${acceptanceRate}%`}
          sublabel={`${accepted} accepted`}
          icon={<BarChart3 className="size-5" />}
          iconBg="bg-emerald-100 text-emerald-600"
          trend="up"
          trendLabel="+4% vs last week"
        />
        <StatCard
          label="Avg Review Time"
          value="2.4m"
          sublabel="per ticket"
          icon={<Clock className="size-5" />}
          iconBg="bg-blue-100 text-blue-600"
          trend="down"
          trendLabel="-0.8m faster"
          trendGood
        />
        <Link href="/queue" className="block">
          <StatCard
            label="Pending Review"
            value={pending}
            sublabel="in queue now"
            icon={<CheckCircle2 className="size-5" />}
            iconBg={pending > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}
            trend="neutral"
            trendLabel={pending > 0 ? "Needs attention" : "All clear"}
            highlight={pending > 0}
          />
        </Link>
      </div>

      {/* Activity + Agent health */}
      <div className="grid grid-cols-3 gap-5">
        {/* Activity feed */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5 border">
              {FILTER_TABS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActivityFilter(f)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md transition-all font-medium",
                    activityFilter === f
                      ? "bg-white text-foreground shadow-sm border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? "All" : ACTION_META[f]?.label ?? f}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            {filteredActivity.slice(0, 12).map((entry, i) => {
              const meta = ACTION_META[entry.action];
              return (
                <Link
                  key={entry.id}
                  href={`/queue/${entry.ticketId}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group",
                    i !== 0 && "border-t"
                  )}
                >
                  <span className={cn(
                    "size-6 rounded-lg flex items-center justify-center shrink-0 border text-xs",
                    meta?.bg ?? "bg-muted border-muted",
                    meta?.color ?? "text-muted-foreground"
                  )}>
                    {meta?.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-xs font-semibold mr-1.5", meta?.color ?? "text-muted-foreground")}>
                      {meta?.label}
                    </span>
                    <span className="text-sm text-foreground truncate">{entry.ticketTitle}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(entry.timestamp)}</span>
                  <ChevronRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Agent health */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Agent Health</h2>
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            {/* Integrations */}
            <div className="p-4 space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Integrations</p>
              <div className="space-y-2">
                {MOCK_INTEGRATIONS.map((int) => (
                  <div key={int.id} className="flex items-center gap-2.5">
                    <Circle className={cn("size-2 fill-current shrink-0", int.status === "connected" ? "text-emerald-500" : "text-red-400")} />
                    <span className="text-sm flex-1 truncate">{int.name}</span>
                    {int.ticketCount != null && (
                      <span className="text-xs text-muted-foreground tabular-nums">{int.ticketCount}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t mx-4" />

            {/* Repos */}
            <div className="p-4 space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Repositories</p>
              <div className="space-y-2.5">
                {MOCK_REPOS.filter((r) => r.selected).map((repo) => (
                  <div key={repo.id}>
                    <div className="flex items-center gap-2">
                      <Circle className={cn(
                        "size-2 fill-current shrink-0",
                        repo.status === "indexed" ? "text-emerald-500" : repo.status === "needs_reindex" ? "text-amber-400" : "text-red-400"
                      )} />
                      <span className="text-xs flex-1 font-mono truncate">{repo.name}</span>
                      {repo.status === "needs_reindex" && (
                        <Button size="icon" variant="ghost" className="size-5 text-muted-foreground hover:text-primary">
                          <RefreshCw className="size-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-4 mt-0.5">
                      {repo.status === "needs_reindex" ? "Needs reindex" : `Indexed ${formatRelativeTime(repo.lastIndexed)}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 bg-muted/30 border-t">
              <p className="text-xs text-muted-foreground">
                Last run <span className="text-foreground font-medium">3 min ago</span>
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border bg-white p-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{accepted}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Accepted</p>
            </div>
            <div className="rounded-xl border bg-white p-3 text-center">
              <p className="text-xl font-bold text-red-500">{rejected}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Rejected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}


function StatCard({
  label, value, sublabel, icon, iconBg, trend, trendLabel, trendGood, highlight,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ReactNode;
  iconBg: string;
  trend: "up" | "down" | "neutral";
  trendLabel: string;
  trendGood?: boolean;
  highlight?: boolean;
}) {
  const trendColor = trendGood
    ? "text-emerald-600"
    : trend === "up" ? "text-emerald-600"
    : trend === "down" ? "text-red-500"
    : "text-muted-foreground";

  return (
    <div className={cn(
      "rounded-xl border bg-white px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow",
      highlight && "border-amber-200 bg-amber-50/50"
    )}>
      <span className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold tracking-tight leading-tight mt-0.5">{value}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">{sublabel}</span>
          <span className={cn("flex items-center gap-0.5 text-[11px] font-semibold", trendColor)}>
            {trend === "up" && <TrendingUp className="size-2.5" />}
            {trend === "down" && <TrendingDown className="size-2.5" />}
            {trendLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
