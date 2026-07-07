"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";

import { FreshdeskLogo, GitHubLogo, LinearLogo } from "@/components/shared/BrandLogos";
import { Button } from "@/components/ui/button";
import { MOCK_INTEGRATIONS, MOCK_REPOS } from "@/lib/mock/integrations";
import { cn } from "@/lib/utils";

export default function SourcesPage() {
  const [panel, setPanel] = useState<"source" | "repo" | "output" | null>(null);
  const sources = MOCK_INTEGRATIONS.filter((i) => i.type === "source");
  const outputs = MOCK_INTEGRATIONS.filter((i) => i.type === "output");
  const repos = MOCK_REPOS.filter((r) => r.selected);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Repos & Sources</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Ticket flow: source → code → output</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => toast.info("Re-syncing connection graph…")}>
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          {/* Visual pipeline graph */}
          <div className="relative rounded-2xl border bg-white p-6 md:p-10 min-h-[420px]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <line x1="22%" y1="50%" x2="50%" y2="50%" stroke="#c4b5fd" strokeWidth={Math.min(8, sources[0]?.ticketCount ? 4 : 2)} strokeOpacity={0.6} />
              <line x1="50%" y1="50%" x2="78%" y2="50%" stroke="#93c5fd" strokeWidth={Math.min(8, outputs[0]?.ticketCount ? 4 : 2)} strokeOpacity={0.6} />
            </svg>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Sources column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Ticket Sources</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setPanel("source")}>
                    <Plus className="size-3" /> Add
                  </Button>
                </div>
                {sources.map((src) => (
                  <GraphNode
                    key={src.id}
                    name={src.name}
                    meta={`${src.ticketCount ?? 0} tickets/wk`}
                    status={src.status}
                    icon={<FreshdeskLogo className="size-6" />}
                    volume={src.ticketCount ?? 0}
                  />
                ))}
              </div>

              {/* Repos column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Indexed Repos</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setPanel("repo")}>
                    <Plus className="size-3" /> Add
                  </Button>
                </div>
                {repos.map((repo) => (
                  <GraphNode
                    key={repo.id}
                    name={repo.name}
                    meta={repo.status === "indexed" ? "Indexed" : "Needs reindex"}
                    status={repo.status === "indexed" ? "connected" : repo.status === "needs_reindex" ? "connecting" : "error"}
                    icon={<GitHubLogo className="size-6" />}
                    volume={40}
                  />
                ))}
              </div>

              {/* Outputs column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Outputs & Agents</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setPanel("output")}>
                    <Plus className="size-3" /> Add
                  </Button>
                </div>
                {outputs.map((out) => (
                  <GraphNode
                    key={out.id}
                    name={out.name}
                    meta={out.targetProject ?? "Connected"}
                    status={out.status}
                    icon={<LinearLogo className="size-6" />}
                    volume={out.ticketCount ?? 0}
                  />
                ))}
                <GraphNode name="Dev Agent" meta="Claude Code webhook" status="connected" icon={<span className="text-lg">🤖</span>} volume={12} />
              </div>
            </div>
          </div>

          {/* Side panel for add */}
          {panel && (
            <div className="mt-4 rounded-xl border bg-white p-5 space-y-3">
              <p className="text-sm font-semibold capitalize">Add {panel}</p>
              <p className="text-xs text-muted-foreground">Same connection forms as before — triggered from the map.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { toast.success("Connection wizard opened"); setPanel(null); }}>Connect</Button>
                <Button size="sm" variant="outline" onClick={() => setPanel(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GraphNode({
  name,
  meta,
  status,
  icon,
  volume,
}: {
  name: string;
  meta: string;
  status: string;
  icon: React.ReactNode;
  volume: number;
}) {
  const statusColor =
    status === "connected" || status === "indexed"
      ? "border-emerald-200 bg-emerald-50/50"
      : status === "needs_reindex" || status === "connecting"
        ? "border-amber-200 bg-amber-50/50"
        : "border-red-200 bg-red-50/50";

  return (
    <div className={cn("rounded-xl border p-3 flex items-center gap-3 transition-shadow hover:shadow-md", statusColor)}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">{meta}</p>
      </div>
      {volume > 30 && (
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">High flow</span>
      )}
    </div>
  );
}
