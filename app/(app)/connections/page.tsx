"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Plugs,
  GitBranch,
  Ticket,
  ArrowRight,
  Check,
  Warning,
  Plus,
  CircleNotch,
  ShieldCheck,
  LinkSimple,
  X,
  GearSix,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { Button } from "@/components/ui/button";
import type { WorkspaceConnection } from "@/lib/mock/workspaces";
import { ConnectorLogo } from "@/components/shared/ConnectorLogos";

type ConnectCategory = "source" | "repo" | "output";

interface AvailableConnector {
  id: string;
  name: string;
  description: string;
  category: ConnectCategory;
  oauthUrl?: string;
}

const AVAILABLE_CONNECTORS: AvailableConnector[] = [
  { id: "freshdesk", name: "Freshdesk", description: "Import tickets from Freshdesk", category: "source", oauthUrl: "https://freshdesk.com/oauth" },
  { id: "zendesk", name: "Zendesk", description: "Import tickets from Zendesk", category: "source", oauthUrl: "https://zendesk.com/oauth" },
  { id: "intercom", name: "Intercom", description: "Import conversations from Intercom", category: "source", oauthUrl: "https://intercom.io/oauth" },
  { id: "hubspot", name: "HubSpot", description: "Sync tickets from HubSpot Service Hub", category: "source", oauthUrl: "https://hubspot.com/oauth" },
  { id: "github", name: "GitHub", description: "Connect a GitHub repository", category: "repo", oauthUrl: "https://github.com/login/oauth" },
  { id: "gitlab", name: "GitLab", description: "Connect a GitLab repository", category: "repo", oauthUrl: "https://gitlab.com/oauth" },
  { id: "bitbucket", name: "Bitbucket", description: "Connect a Bitbucket repository", category: "repo", oauthUrl: "https://bitbucket.org/oauth" },
  { id: "linear", name: "Linear", description: "Push tickets to Linear", category: "output", oauthUrl: "https://linear.app/oauth" },
  { id: "jira", name: "Jira", description: "Push tickets to Jira", category: "output", oauthUrl: "https://atlassian.com/oauth" },
  { id: "asana", name: "Asana", description: "Push tickets to Asana", category: "output", oauthUrl: "https://asana.com/oauth" },
  { id: "github-issues", name: "GitHub Issues", description: "Create issues in GitHub", category: "output", oauthUrl: "https://github.com/login/oauth" },
  { id: "slack", name: "Slack", description: "Send notifications to Slack", category: "output", oauthUrl: "https://slack.com/oauth" },
];

const CATEGORY_META = {
  source: { label: "Ticket Sources", sub: "Where customer feedback arrives", icon: Ticket },
  repo: { label: "Repositories", sub: "Code the agent searches against", icon: GitBranch },
  output: { label: "Outputs", sub: "Where approved work gets delivered", icon: ArrowRight },
};

type OAuthStep = "idle" | "selecting" | "authorizing" | "permissions" | "success";

function StatusBadge({ status }: { status: WorkspaceConnection["status"] }) {
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
  const connections = useWorkspaceStore((s) => s.getActiveData().connections);
  const workspace = useWorkspaceStore((s) => s.getActiveWorkspace());
  const [oauthModal, setOauthModal] = useState<{ connector: AvailableConnector; step: OAuthStep } | null>(null);
  const [addDropdown, setAddDropdown] = useState<ConnectCategory | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAddDropdown(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sources = connections.filter((c) => c.category === "source");
  const repos = connections.filter((c) => c.category === "repo");
  const outputs = connections.filter((c) => c.category === "output");

  const totalSources = sources.length;
  const totalRepos = repos.length;
  const healthyRepos = repos.filter((r) => r.status === "connected").length;
  const totalOutputs = outputs.length;

  const startOauth = (connector: AvailableConnector) => {
    setAddDropdown(null);
    setOauthModal({ connector, step: "authorizing" });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Sources live" value={String(totalSources)} />
          <StatCard label="Repos indexed" value={`${healthyRepos}/${totalRepos}`} />
          <StatCard label="Outputs active" value={String(totalOutputs)} />
          <StatCard label="Tickets / week" value={sources.reduce((sum, s) => {
            const m = s.statusText.match(/([\d,]+)/);
            return sum + (m ? parseInt(m[1].replace(",", ""), 10) : 0);
          }, 0).toLocaleString()} />
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
          const items = connections.filter((c) => c.category === category);
          const available = AVAILABLE_CONNECTORS.filter((c) => c.category === category);
          const connectedIds = new Set(items.map((i) => i.id));

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

                <div className="relative" ref={addDropdown === category ? dropdownRef : undefined}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => setAddDropdown(addDropdown === category ? null : category)}
                  >
                    <Plus size={12} /> Add
                  </Button>

                  {addDropdown === category && (
                    <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-64 rounded-xl border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Available integrations
                      </p>
                      {available.map((connector) => {
                        const alreadyConnected = connectedIds.has(connector.id);
                        return (
                          <button
                            key={connector.id}
                            type="button"
                            disabled={alreadyConnected}
                            onClick={() => startOauth(connector)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                              alreadyConnected ? "opacity-40 cursor-default" : "hover:bg-muted/60"
                            )}
                          >
                            <ConnectorLogo connectorId={connector.id} name={connector.name} category={connector.category} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium">{connector.name}</p>
                              <p className="text-[10px] text-muted-foreground">{connector.description}</p>
                            </div>
                            {alreadyConnected && <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group rounded-xl border bg-card p-4 space-y-3 transition-all hover:shadow-sm hover:border-primary/20 cursor-pointer",
                      item.status === "attention" && "border-amber-200/80"
                    )}
                    onClick={() => toast.info(`${item.name} settings`, { description: "Connection management coming soon" })}
                  >
                    <div className="flex items-start gap-3">
                      <ConnectorLogo connectorId={item.id} name={item.name} category={item.category} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-semibold">{item.name}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{item.description}</p>
                      </div>
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

      {/* OAuth simulation modal */}
      {oauthModal && (
        <OAuthModal
          connector={oauthModal.connector}
          workspace={workspace.name}
          onClose={() => setOauthModal(null)}
          onComplete={() => {
            setOauthModal(null);
            toast.success(`${oauthModal.connector.name} connected successfully`);
          }}
        />
      )}
    </div>
  );
}

/* ─── OAuth simulation modal ─── */

function OAuthModal({
  connector,
  workspace,
  onClose,
  onComplete,
}: {
  connector: AvailableConnector;
  workspace: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<"authorizing" | "permissions" | "configuring" | "success">("authorizing");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStep("permissions"), 1500));
    return () => timers.forEach(clearTimeout);
  }, []);

  const grantPermissions = () => {
    setStep("configuring");
    setTimeout(() => setStep("success"), 2000);
  };

  const PERMISSIONS: Record<string, string[]> = {
    source: ["Read tickets and conversations", "Access customer profiles", "Read ticket metadata and tags"],
    repo: ["Read repository contents", "Access commit history", "Read pull request data"],
    output: ["Create and update tickets", "Add comments and attachments", "Manage labels and assignments"],
  };

  const perms = PERMISSIONS[connector.category] ?? PERMISSIONS.source;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <ConnectorLogo connectorId={connector.id} name={connector.name} category={connector.category} size="lg" />
            <div>
              <p className="text-[14px] font-semibold">Connect {connector.name}</p>
              <p className="text-[11px] text-muted-foreground">{connector.oauthUrl}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {step === "authorizing" && (
            <div className="text-center py-6 space-y-3">
              <CircleNotch size={32} className="mx-auto text-primary animate-spin" />
              <div>
                <p className="text-[14px] font-semibold">Connecting to {connector.name}…</p>
                <p className="text-[12px] text-muted-foreground mt-1">Redirecting to authorization page</p>
              </div>
            </div>
          )}

          {step === "permissions" && (
            <div className="space-y-4">
              <div className="text-center">
                <ShieldCheck size={28} className="mx-auto text-primary mb-2" />
                <p className="text-[14px] font-semibold">Grant permissions</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  <strong>{connector.name}</strong> is requesting access to <strong>{workspace}</strong>
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 divide-y">
                {perms.map((perm) => (
                  <div key={perm} className="flex items-center gap-3 px-4 py-3">
                    <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
                    <p className="text-[12px]">{perm}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 text-[12px]" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1 h-9 text-[12px] gap-1.5" onClick={grantPermissions}>
                  <LinkSimple size={14} /> Authorize
                </Button>
              </div>
            </div>
          )}

          {step === "configuring" && (
            <div className="text-center py-6 space-y-3">
              <CircleNotch size={32} className="mx-auto text-primary animate-spin" />
              <div>
                <p className="text-[14px] font-semibold">Setting up connection…</p>
                <p className="text-[12px] text-muted-foreground mt-1">Syncing {connector.category === "repo" ? "repository data" : connector.category === "source" ? "ticket sources" : "output channels"}</p>
              </div>
              <div className="space-y-2 pt-2">
                {["Validating credentials", "Testing connection", "Initial sync"].map((label, i) => (
                  <StepLine key={label} label={label} delay={i * 600} />
                ))}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check size={24} weight="bold" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Connected successfully</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  {connector.name} is now linked to {workspace}
                </p>
              </div>
              <Button className="h-9 text-[12px] px-6" onClick={onComplete}>
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepLine({ label, delay }: { label: string; delay: number }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), delay + 500);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex items-center gap-2 justify-center">
      {done ? (
        <Check size={12} weight="bold" className="text-emerald-500" />
      ) : (
        <CircleNotch size={12} className="text-primary animate-spin" />
      )}
      <span className={cn("text-[11px]", done ? "text-muted-foreground" : "text-foreground font-medium")}>
        {label}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white/70 backdrop-blur-sm p-3.5 hover:shadow-sm transition-shadow">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tracking-tight mt-0.5 gradient-text">{value}</p>
    </div>
  );
}
