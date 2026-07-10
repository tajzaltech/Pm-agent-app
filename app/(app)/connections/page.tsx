"use client";

import { useState } from "react";
import {
  Plugs,
  GitBranch,
  Ticket,
  ArrowRight,
  Check,
  Warning,
  Plus,
  Trash,
  GearSix,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useConnectionsStore } from "@/lib/store/connections";
import { Button } from "@/components/ui/button";

type CardStatus = "connected" | "attention" | "disconnected";

interface ConnectionCard {
  id: string;
  name: string;
  description: string;
  status: CardStatus;
  statusText: string;
  category: "source" | "repo" | "output";
  meta?: string;
}

const CONNECTIONS: ConnectionCard[] = [
  { id: "freshdesk", name: "Freshdesk", description: "Ticket source", status: "connected", statusText: "847 tickets/week", category: "source", meta: "Connected 24d ago" },
  { id: "zendesk", name: "Zendesk", description: "Ticket source", status: "connected", statusText: "312 tickets/week", category: "source", meta: "Connected 24d ago" },
  { id: "api-backend", name: "api-backend", description: "acmetech/api-backend", status: "connected", statusText: "Last indexed 2h ago", category: "repo" },
  { id: "web-frontend", name: "web-frontend", description: "acmetech/web-frontend", status: "connected", statusText: "Last indexed 2h ago", category: "repo" },
  { id: "data-pipeline", name: "data-pipeline", description: "acmetech/data-pipeline", status: "attention", statusText: "Re-index recommended", category: "repo" },
  { id: "linear", name: "Linear", description: "Ticket delivery", status: "connected", statusText: "94 tickets pushed", category: "output", meta: "Backend — Q3" },
  { id: "dev-agent", name: "Dev Agent", description: "Auto-dispatch", status: "connected", statusText: "12 runs this week", category: "output", meta: "Claude Code" },
];

const CATEGORY_META = {
  source: { label: "Ticket Sources", sub: "Where customer feedback arrives", icon: Ticket },
  repo: { label: "Repositories", sub: "Code the agent searches against", icon: GitBranch },
  output: { label: "Outputs", sub: "Where approved work gets delivered", icon: ArrowRight },
};

function StatusBadge({ status }: { status: CardStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
      status === "connected" && "bg-emerald-50 text-emerald-700",
      status === "attention" && "bg-amber-50 text-amber-700",
      status === "disconnected" && "bg-muted text-muted-foreground",
    )}>
      {status === "connected" && <Check size={9} weight="bold" />}
      {status === "attention" && <Warning size={9} weight="fill" />}
      {status === "connected" ? "Healthy" : status === "attention" ? "Attention" : "Not connected"}
    </span>
  );
}

export default function ConnectionsPage() {
  const [editMode, setEditMode] = useState(false);

  const sources = CONNECTIONS.filter((c) => c.category === "source");
  const repos = CONNECTIONS.filter((c) => c.category === "repo");
  const outputs = CONNECTIONS.filter((c) => c.category === "output");

  const totalSources = sources.length;
  const totalRepos = repos.length;
  const healthyRepos = repos.filter((r) => r.status === "connected").length;
  const totalOutputs = outputs.length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Sources live" value={String(totalSources)} />
          <StatCard label="Repos indexed" value={`${healthyRepos}/${totalRepos}`} />
          <StatCard label="Outputs active" value={String(totalOutputs)} />
          <StatCard label="Tickets / week" value="1,159" />
        </div>

        {/* Flow visualization */}
        <div className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground py-2">
          <span className="flex items-center gap-1.5 font-medium text-teal-600"><Ticket size={14} weight="fill" /> Sources</span>
          <ArrowRight size={12} className="text-muted-foreground/40" />
          <span className="flex items-center gap-1.5 font-medium text-violet-600"><GitBranch size={14} weight="fill" /> Repos</span>
          <ArrowRight size={12} className="text-muted-foreground/40" />
          <span className="flex items-center gap-1.5 font-medium text-indigo-600"><Plugs size={14} weight="fill" /> Outputs</span>
        </div>

        {/* Sections */}
        {(["source", "repo", "output"] as const).map((category) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          const items = CONNECTIONS.filter((c) => c.category === category);

          return (
            <section key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    category === "source" && "bg-teal-50 text-teal-600",
                    category === "repo" && "bg-violet-50 text-violet-600",
                    category === "output" && "bg-indigo-50 text-indigo-600",
                  )}>
                    <Icon size={16} weight="duotone" />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-semibold">{meta.label}</h2>
                    <p className="text-[11px] text-muted-foreground">{meta.sub}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                  <Plus size={12} /> Add
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group rounded-xl border bg-card p-4 space-y-3 transition-all hover:shadow-sm hover:border-primary/20",
                      item.status === "attention" && "border-amber-200/80"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[13px] font-semibold">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.description}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">{item.statusText}</p>
                      {item.meta && (
                        <p className="text-[10px] text-muted-foreground/60">{item.meta}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
    </div>
  );
}
