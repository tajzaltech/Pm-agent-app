"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MOCK_INTEGRATIONS, MOCK_REPOS } from "@/lib/mock/integrations";
import type { Integration, Repo, RepoStatus, AgentType } from "@/lib/types";
import { useDispatchStore, AGENT_LABELS } from "@/lib/store/dispatch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Plus,
  RefreshCw,
  Circle,
  Unplug,
  Settings2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  BotMessageSquare,
  Webhook,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  GitFork,
  Zap,
} from "lucide-react";

export default function ConnectionsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [repos, setRepos] = useState<Repo[]>(MOCK_REPOS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [reindexProgress, setReindexProgress] = useState<number>(0);

  const sources = integrations.filter((i) => i.type === "source");
  const outputs = integrations.filter((i) => i.type === "output");

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "disconnected" } : i))
    );
    toast.info("Integration disconnected");
  };

  const handleReindex = async (repoId: string) => {
    setReindexingId(repoId);
    setReindexProgress(0);
    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, status: "indexing" } : r))
    );

    for (let p = 0; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 400));
      setReindexProgress(p);
    }

    setRepos((prev) =>
      prev.map((r) =>
        r.id === repoId
          ? { ...r, status: "indexed", lastIndexed: new Date().toISOString() }
          : r
      )
    );
    setReindexingId(null);
    toast.success("Repository reindexed successfully");
  };

  const STATUS_DOT_COLOR: Record<string, string> = {
    connected: "text-emerald-500",
    disconnected: "text-muted-foreground",
    connecting: "text-blue-500",
    error: "text-red-500",
  };

  const REPO_STATUS_COLOR: Record<RepoStatus, string> = {
    indexed: "text-emerald-500",
    indexing: "text-blue-500",
    error: "text-red-500",
    needs_reindex: "text-amber-500",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-6 h-14 flex items-center shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Connections</h1>
      </div>

    <div className="p-6 space-y-10">

      {/* Ticket Sources */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Ticket Sources (Input)</h2>
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => toast.info("Add source modal â€” connect a new ticket source")}>
            <Plus className="size-3.5" />
            Add Source
          </Button>
        </div>
        <div className="space-y-3">
          {sources.map((src) => (
            <IntegrationCard
              key={src.id}
              integration={src}
              expanded={expandedId === src.id}
              onToggle={() => setExpandedId(expandedId === src.id ? null : src.id)}
              onDisconnect={() => handleDisconnect(src.id)}
              statusColor={STATUS_DOT_COLOR[src.status]}
            />
          ))}
          {sources.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-xl bg-muted/20">No ticket sources connected.</p>
          )}
        </div>
      </section>

      {/* Code Repositories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Code Repositories</h2>
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => toast.info("Add repository â€” connect GitHub or Bitbucket")}>
            <Plus className="size-3.5" />
            Add Repo
          </Button>
        </div>
        <div className="rounded-2xl border bg-white divide-y overflow-hidden shadow-sm">
          {repos.map((repo) => (
            <div key={repo.id} className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                {repo.platform === "github" ? <GitBranch className="size-4 text-muted-foreground" /> : <GitBranch className="size-4 text-muted-foreground" />}
                <span className="text-sm font-mono font-medium flex-1">{repo.fullName}</span>

                {repo.status === "needs_reindex" && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Needs reindex</Badge>
                )}
                {repo.status === "indexing" && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 animate-pulse">Indexingâ€¦</Badge>
                )}
                {repo.status === "indexed" && (
                  <span className="text-xs text-muted-foreground">Indexed {formatRelativeTime(repo.lastIndexed)}</span>
                )}

                <Circle className={cn("size-2 fill-current shrink-0", REPO_STATUS_COLOR[repo.status])} />

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  disabled={reindexingId === repo.id || repo.status === "indexing"}
                  onClick={() => handleReindex(repo.id)}
                >
                  <RefreshCw className={cn("size-3", (reindexingId === repo.id) && "animate-spin")} />
                  Reindex
                </Button>
              </div>
              {reindexingId === repo.id && (
                <Progress value={reindexProgress} className="h-1.5" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Output Tools */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Output Tools</h2>
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => toast.info("Add output â€” connect Linear, Jira, or other tools")}>
            <Plus className="size-3.5" />
            Add Output
          </Button>
        </div>
        <div className="space-y-3">
          {outputs.map((out) => (
            <IntegrationCard
              key={out.id}
              integration={out}
              expanded={expandedId === out.id}
              onToggle={() => setExpandedId(expandedId === out.id ? null : out.id)}
              onDisconnect={() => handleDisconnect(out.id)}
              statusColor={STATUS_DOT_COLOR[out.status]}
            />
          ))}
        </div>
      </section>

      {/* Developer Agents */}
      <DeveloperAgentsSection />
    </div>
    </div>
  );
}

const AGENT_CARDS: { type: AgentType; name: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    type: "claude-code",
    name: "Claude Code",
    desc: "Anthropic's agentic CLI â€” auto-implements tickets inside VS Code or terminal.",
    icon: <BotMessageSquare className="size-5 text-violet-600" />,
    color: "border-violet-200 bg-violet-50/60",
  },
  {
    type: "cursor",
    name: "Cursor",
    desc: "Cursor Background Agent â€” opens ticket spec directly in your Cursor IDE.",
    icon: <Zap className="size-5 text-blue-600" />,
    color: "border-blue-200 bg-blue-50/60",
  },
  {
    type: "custom",
    name: "Custom Agent",
    desc: "Any agent that listens on a webhook â€” Codex, Devin, or your own setup.",
    icon: <Webhook className="size-5 text-slate-600" />,
    color: "border-slate-200 bg-slate-50/60",
  },
];

function DeveloperAgentsSection() {
  const { config, records, updateConfig } = useDispatchStore();
  const [testLoading, setTestLoading] = useState(false);

  const handleTestWebhook = async () => {
    if (!config.webhookUrl) { toast.error("Enter a webhook URL first"); return; }
    setTestLoading(true);
    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true, source: "pm-agent", timestamp: new Date().toISOString() }),
      });
      if (res.ok) toast.success("Webhook reachable â€” test ping sent!");
      else toast.error(`Webhook returned ${res.status}`);
    } catch {
      toast.error("Could not reach webhook URL");
    } finally {
      setTestLoading(false);
    }
  };

  const recentRecords = records.slice(0, 5);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Developer Agents</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Dispatch accepted tickets to an AI agent in your developer&apos;s IDE.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{config.enabled ? "Active" : "Off"}</span>
          <Switch checked={config.enabled} onCheckedChange={(v) => { updateConfig({ enabled: v }); toast.success(v ? "Agent dispatch enabled" : "Agent dispatch disabled"); }} />
        </div>
      </div>

      {/* Agent type cards */}
      <div className="grid grid-cols-3 gap-3">
        {AGENT_CARDS.map((card) => (
          <button
            key={card.type}
            onClick={() => updateConfig({ agentType: card.type })}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              config.agentType === card.type
                ? `${card.color} ring-2 ring-primary/40`
                : "bg-white hover:bg-muted/20"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {card.icon}
              <span className="text-sm font-semibold">{card.name}</span>
              {config.agentType === card.type && (
                <CheckCircle2 className="size-3.5 text-primary ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Webhook config */}
      <div className={cn("rounded-xl border bg-white p-5 space-y-4 transition-opacity", !config.enabled && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Webhook className="size-4 text-muted-foreground" />
          Webhook Configuration
        </h3>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://your-agent.local/webhook or https://webhook.site/..."
              value={config.webhookUrl}
              onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
              className="font-mono text-xs"
            />
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5 h-9" onClick={handleTestWebhook} disabled={testLoading}>
              {testLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
              Test
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">PM Agent will POST the full ticket spec here when a ticket is accepted.</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs font-medium">Branch naming</Label>
          <div className="flex gap-2 flex-wrap">
            {(["fix/{id}", "feat/{id}", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => updateConfig({ branchPattern: p })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors",
                  config.branchPattern === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 hover:bg-muted/60"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          {config.branchPattern === "custom" && (
            <Input
              placeholder="e.g. pm-agent/{id}-fix"
              value={config.customBranchPattern}
              onChange={(e) => updateConfig({ customBranchPattern: e.target.value })}
              className="font-mono text-xs h-8"
            />
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-xs font-medium">Payload includes</Label>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Code references & file paths</span>
            <Switch checked={config.includeCodeRefs} onCheckedChange={(v) => updateConfig({ includeCodeRefs: v })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Suggested approach</span>
            <Switch checked={config.includeApproach} onCheckedChange={(v) => updateConfig({ includeApproach: v })} />
          </div>
        </div>
      </div>

      {/* Payload preview */}
      <div className="rounded-xl border bg-slate-950 p-4 text-xs font-mono overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-[11px] font-sans font-medium">Dispatch Payload Preview</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-slate-400 hover:text-white px-2"
            onClick={() => { navigator.clipboard.writeText(SAMPLE_PAYLOAD); toast.success("Copied!"); }}
          >
            <Copy className="size-3" />
            Copy
          </Button>
        </div>
        <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">{SAMPLE_PAYLOAD}</pre>
      </div>

      {/* Recent dispatches */}
      {recentRecords.length > 0 && (
        <div className="rounded-2xl border bg-white divide-y overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-muted/30 flex items-center text-xs font-semibold text-muted-foreground">
            <span className="flex-1">Recent Dispatches</span>
            <span className="w-24">Agent</span>
            <span className="w-24">Branch</span>
            <span className="w-20">Status</span>
          </div>
          {recentRecords.map((r) => (
            <div key={r.ticketId} className="px-4 py-3 flex items-center gap-3 text-sm">
              <span className="flex-1 truncate text-xs">{r.ticketTitle}</span>
              <span className="w-24 text-xs text-muted-foreground">{AGENT_LABELS[r.agentType]}</span>
              <code className="w-24 text-xs font-mono text-muted-foreground truncate">{r.branchName}</code>
              <span className="w-20">
                {r.status === "dispatched" && <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><CheckCircle2 className="size-3" />Sent</Badge>}
                {r.status === "dispatching" && <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200 gap-1 animate-pulse"><Loader2 className="size-3 animate-spin" />Sending</Badge>}
                {r.status === "failed" && <Badge variant="outline" className="text-[10px] h-5 bg-red-50 text-red-700 border-red-200 gap-1"><XCircle className="size-3" />Failed</Badge>}
              </span>
            </div>
          ))}
        </div>
      )}

      {recentRecords.length === 0 && config.enabled && (
        <div className="rounded-xl border border-dashed bg-muted/10 py-8 text-center">
          <GitFork className="size-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No dispatches yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Accept a ticket from the queue to trigger your first agent dispatch.</p>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-blue-50 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">How it works</h3>
        <div className="space-y-2.5">
          {[
            { step: "1", text: "PM reviews and accepts a ticket in PM Agent" },
            { step: "2", text: "PM Agent POSTs the full spec (title, description, code refs, acceptance criteria) to your webhook" },
            { step: "3", text: `Your ${AGENT_LABELS[config.agentType]} picks it up, creates a branch, and starts implementing` },
            { step: "4", text: "Agent opens a PR â€” you review, merge, done." },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</span>
              <span className="text-xs text-muted-foreground leading-relaxed">{text}</span>
            </div>
          ))}
        </div>
        <a
          href="https://docs.anthropic.com/claude-code"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-1"
        >
          Claude Code docs <ExternalLink className="size-3" />
        </a>
      </div>
    </section>
  );
}

const SAMPLE_PAYLOAD = `{
  "ticket_id": "TKT-001",
  "title": "Fix login timeout on mobile",
  "description": "Users on iOS are being logged out...",
  "suggested_approach": "Increase session TTL and...",
  "acceptance_criteria": [
    "Session persists for 7 days on mobile",
    "Logout only on explicit action"
  ],
  "branch_name": "fix/TKT-001",
  "code_refs": [
    { "file_path": "src/auth/session.ts", "line_start": 42 }
  ],
  "agent_type": "claude-code"
}`;

function IntegrationCard({
  integration,
  expanded,
  onToggle,
  onDisconnect,
  statusColor,
}: {
  integration: Integration;
  expanded: boolean;
  onToggle: () => void;
  onDisconnect: () => void;
  statusColor: string;
}) {
  return (
    <div className="rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20" onClick={onToggle}>
        <Circle className={cn("size-2.5 fill-current shrink-0", statusColor)} />
        <div className="flex-1">
          <p className="text-sm font-medium">{integration.name}</p>
          <p className="text-xs text-muted-foreground">
            {integration.status === "connected"
              ? `${integration.ticketCount ?? 0} tickets Â· Connected ${integration.connectedAt ? formatRelativeTime(integration.connectedAt) : ""}`
              : integration.status}
            {integration.targetProject && ` Â· ${integration.targetProject}`}
          </p>
        </div>
        {expanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() => toast.info(`Refreshing ${integration.name} OAuth...`)}
          >
            <RefreshCw className="size-3" />
            Refresh Auth
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() => toast.info("Change target project / board")}
          >
            <Settings2 className="size-3" />
            Change Project
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 ml-auto"
            onClick={onDisconnect}
          >
            <Unplug className="size-3" />
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
}
