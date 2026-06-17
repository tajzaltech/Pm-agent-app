"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MOCK_TEAM_MEMBERS } from "@/lib/mock/team";
import type { TeamMember, UserRole, AutoAcceptRule, Classification, Scope, AgentType, DeliveryTool } from "@/lib/types";
import { useDispatchStore, AGENT_LABELS } from "@/lib/store/dispatch";
import { useDeliveryStore, TOOL_LABELS } from "@/lib/store/delivery";
import { ProductDocsManager } from "@/components/shared/ProductDocsManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Trash2,
  Key,
  Download,
  AlertTriangle,
  Plus,
  X,
  BotMessageSquare,
  Webhook,
  Zap,
  CheckCircle2,
  Loader2,
  GitFork,
  SendHorizonal,
  ArrowRight,
  User,
} from "lucide-react";

export default function SettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("reviewer");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  // Preferences state
  const [autoClassify, setAutoClassify] = useState(true);
  const [scopeEstimation, setAutoScope] = useState(true);
  const [emailDigest, setEmailDigest] = useState<"daily" | "weekly" | "off">("daily");
  const [realTime, setRealTime] = useState(true);
  const [autoAcceptRules, setAutoAcceptRules] = useState<AutoAcceptRule[]>([
    { id: "rule1", classification: "question", scope: "S", enabled: true },
  ]);
  const [templateDesc, setTemplateDesc] = useState(true);
  const [templateCode, setTemplateCode] = useState(true);
  const [templateAC, setTemplateAC] = useState(true);
  const [templateApproach, setTemplateApproach] = useState(true);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    const newMember: TeamMember = {
      id: `u${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "invited",
      avatarInitials: inviteEmail[0].toUpperCase(),
    };
    setMembers([...members, newMember]);
    setInviteEmail("");
    toast.success(`Invitation sent to ${inviteEmail}`);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    toast.info("Member removed");
  };

  const handleChangeRole = (id: string, role: UserRole) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
    toast.success("Role updated");
  };

  const handleAddRule = () => {
    setAutoAcceptRules([
      ...autoAcceptRules,
      { id: `rule${Date.now()}`, classification: "question", scope: "S", enabled: false },
    ]);
  };

  const handleRemoveRule = (id: string) => {
    setAutoAcceptRules(autoAcceptRules.filter((r) => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    setAutoAcceptRules(autoAcceptRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const updateRule = (id: string, field: "classification" | "scope", value: string | null) => {
    if (!value) return;
    setAutoAcceptRules(autoAcceptRules.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const ROLE_COLORS: Record<UserRole, string> = {
    admin: "bg-violet-50 text-violet-700 border-violet-200",
    reviewer: "bg-blue-50 text-blue-700 border-blue-200",
    viewer: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 md:px-6 h-14 flex items-center shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Settings</h1>
      </div>

    <div className="p-6 space-y-6">

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="h-10 rounded-xl bg-muted/50 border p-1 gap-0.5 flex-wrap md:flex-nowrap overflow-x-auto">
          <TabsTrigger value="team" className="rounded-lg text-sm">Team</TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg text-sm">Preferences</TabsTrigger>
          <TabsTrigger value="delivery" className="rounded-lg text-sm">Delivery</TabsTrigger>
          <TabsTrigger value="agents" className="rounded-lg text-sm">Dev Agents</TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg text-sm">Account</TabsTrigger>
        </TabsList>

        {/* Team */}
        <TabsContent value="team" className="space-y-6 mt-0">
          {/* Invite */}
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold">Invite Member</h3>
            <div className="flex gap-2">
              <Input
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(v) => { if (v) setInviteRole(v as UserRole); }}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} className="gap-1.5">
                <UserPlus className="size-4" />
                Invite
              </Button>
            </div>
          </div>

          {/* Member list */}
          <div className="rounded-2xl border bg-white divide-y overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-muted/30 flex items-center text-xs font-semibold text-muted-foreground gap-4">
              <span className="flex-1">Member</span>
              <span className="w-28">Role</span>
              <span className="w-20">Status</span>
              <span className="w-8" />
            </div>
            {members.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {m.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                </div>
                <div className="w-28">
                  <Select
                    value={m.role}
                    onValueChange={(v) => { if (v) handleChangeRole(m.id, v as UserRole); }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px] h-5",
                      m.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {m.status}
                  </Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-red-600 shrink-0"
                  onClick={() => handleRemoveMember(m.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {members.filter((m) => m.status === "active").length} / 10 seats used Â· <a href="#" className="text-primary hover:underline">Upgrade plan</a>
          </p>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6 mt-0">
          <div className="rounded-2xl border bg-white p-5 space-y-5">
            <h3 className="text-sm font-semibold">Agent Behavior</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-classify tickets</Label>
                <p className="text-xs text-muted-foreground">Agent assigns classification vs. suggesting it for PM review</p>
              </div>
              <Switch checked={autoClassify} onCheckedChange={setAutoClassify} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Scope estimation</Label>
                <p className="text-xs text-muted-foreground">Automatically estimate S/M/L scope based on code impact</p>
              </div>
              <Switch checked={scopeEstimation} onCheckedChange={setAutoScope} />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-5">
            <h3 className="text-sm font-semibold">Notifications</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email digest</Label>
                <p className="text-xs text-muted-foreground">Summary of new drafts and queue activity</p>
              </div>
              <Select value={emailDigest} onValueChange={(v) => { if (v) setEmailDigest(v as "daily" | "weekly" | "off"); }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Real-time notifications</Label>
                <p className="text-xs text-muted-foreground">In-app notification for each new draft ticket</p>
              </div>
              <Switch checked={realTime} onCheckedChange={setRealTime} />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <ProductDocsManager variant="settings" />
          </div>

          {/* Auto-accept rules */}
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Auto-Accept Rules</h3>
                <p className="text-xs text-muted-foreground">Automatically accept tickets matching these criteria</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={handleAddRule}>
                <Plus className="size-3.5" />
                Add rule
              </Button>
            </div>

            {autoAcceptRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No auto-accept rules configured.</p>
            ) : (
              <div className="space-y-2">
                {autoAcceptRules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                      className="shrink-0"
                    />
                    <span className="text-xs text-muted-foreground">If</span>
                    <Select
                      value={rule.classification}
                      onValueChange={(v) => updateRule(rule.id, "classification", v)}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="churn_signal">Churn Signal</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">+</span>
                    <Select
                      value={rule.scope}
                      onValueChange={(v) => updateRule(rule.id, "scope", v)}
                    >
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any scope</SelectItem>
                        <SelectItem value="S">Small</SelectItem>
                        <SelectItem value="M">Medium</SelectItem>
                        <SelectItem value="L">Large</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground flex-1">â†’ auto-accept</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 text-muted-foreground hover:text-red-600 shrink-0"
                      onClick={() => handleRemoveRule(rule.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket template */}
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Ticket Template Sections</h3>
              <p className="text-xs text-muted-foreground">Toggle which sections the agent includes in each draft</p>
            </div>
            {[
              { label: "Description", value: templateDesc, onChange: setTemplateDesc },
              { label: "Code Context (Affected files)", value: templateCode, onChange: setTemplateCode },
              { label: "Acceptance Criteria", value: templateAC, onChange: setTemplateAC },
              { label: "Suggested Approach", value: templateApproach, onChange: setTemplateApproach },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex items-center justify-between">
                <Label className="text-sm font-medium">{label}</Label>
                <Switch checked={value} onCheckedChange={onChange} />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Delivery flow */}
        <TabsContent value="delivery" className="space-y-6 mt-0">
          <DeliveryTab />
        </TabsContent>

        {/* Developer Agents */}
        <TabsContent value="agents" className="space-y-6 mt-0">
          <AgentsTab />
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="space-y-6 mt-0">
          <div className="rounded-2xl border bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold">Plan & Billing</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Growth Plan</p>
                <p className="text-xs text-muted-foreground">$199/month Â· Renews Jul 1, 2026</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.info("Billing portal")}>Manage</Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold">API Key</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-muted/40 border rounded-lg px-3 py-2 text-muted-foreground">
                {apiKeyVisible ? "sk-pm-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" : "sk-pm-â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8"
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
              >
                <Key className="size-3.5" />
                {apiKeyVisible ? "Hide" : "Reveal"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use this key to access the PM Agent API for custom integrations.</p>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold">Export Data</h3>
            <p className="text-xs text-muted-foreground">Download all your tickets, decisions, and activity as JSON.</p>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("Export started â€” you'll receive an email when ready")}>
              <Download className="size-4" />
              Export all data
            </Button>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800">Danger Zone</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Disconnect all integrations</p>
                <p className="text-xs text-red-600/70">Removes all connected sources, repos, and outputs</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-100"
                onClick={() => toast.error("Confirmation required to disconnect all integrations")}
              >
                Disconnect all
              </Button>
            </div>
            <Separator className="border-red-200" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Delete account</p>
                <p className="text-xs text-red-600/70">Permanently deletes your organization and all data</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => toast.error("Account deletion requires email confirmation")}
              >
                Delete account
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}

const AGENT_TYPE_OPTIONS: { type: AgentType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: "claude-code", label: "Claude Code", icon: <BotMessageSquare className="size-4 text-violet-600" />, desc: "Anthropic's agentic CLI â€” runs in VS Code or terminal" },
  { type: "cursor", label: "Cursor", icon: <Zap className="size-4 text-blue-600" />, desc: "Cursor Background Agent â€” auto-codes in your IDE" },
  { type: "custom", label: "Custom Agent", icon: <Webhook className="size-4 text-slate-600" />, desc: "Any webhook-based agent (Devin, Codex, your own)" },
];

function AgentsTab() {
  const { config, records, updateConfig } = useDispatchStore();
  const [testLoading, setTestLoading] = useState(false);

  const handleTest = async () => {
    if (!config.webhookUrl) { toast.error("Enter a webhook URL first"); return; }
    setTestLoading(true);
    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true, source: "pm-agent", timestamp: new Date().toISOString() }),
      });
      if (res.ok) toast.success("Test ping sent â€” webhook reachable!");
      else toast.error(`Webhook returned ${res.status}`);
    } catch {
      toast.error("Could not reach webhook URL");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BotMessageSquare className="size-4 text-primary" />
              Auto-dispatch to Developer Agent
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              When a ticket is accepted, instantly send the full spec to your AI coding agent.
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(v) => { updateConfig({ enabled: v }); toast.success(v ? "Agent dispatch enabled" : "Dispatch disabled"); }}
          />
        </div>

        {config.enabled && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-800">
                Active â€” accepted tickets will be dispatched to <strong>{AGENT_LABELS[config.agentType]}</strong>
                {config.webhookUrl ? "" : " (set webhook URL below to complete setup)"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Agent type selection */}
      <div className={cn("rounded-2xl border bg-white p-5 space-y-4 transition-opacity", !config.enabled && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-semibold">Agent Type</h3>
        <div className="space-y-2">
          {AGENT_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.type}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                config.agentType === opt.type ? "border-primary bg-primary/5" : "hover:bg-muted/20"
              )}
            >
              <input
                type="radio"
                name="agentType"
                value={opt.type}
                checked={config.agentType === opt.type}
                onChange={() => updateConfig({ agentType: opt.type })}
                className="accent-primary"
              />
              <span>{opt.icon}</span>
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Webhook URL */}
      <div className={cn("rounded-2xl border bg-white p-5 space-y-4 transition-opacity", !config.enabled && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-semibold">Webhook URL</h3>
        <div className="flex gap-2">
          <Input
            placeholder="https://your-agent.local/webhook"
            value={config.webhookUrl}
            onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
            className="font-mono text-xs"
          />
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={handleTest} disabled={testLoading}>
            {testLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
            Test
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          PM Agent POSTs the full ticket spec here on accept. Use{" "}
          <a href="https://webhook.site" target="_blank" rel="noopener noreferrer" className="text-primary underline">webhook.site</a>{" "}
          to test.
        </p>
      </div>

      {/* Branch pattern */}
      <div className={cn("rounded-2xl border bg-white p-5 space-y-4 transition-opacity", !config.enabled && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-semibold">Branch Naming</h3>
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
            placeholder="e.g. pm-agent/{id}"
            value={config.customBranchPattern}
            onChange={(e) => updateConfig({ customBranchPattern: e.target.value })}
            className="font-mono text-xs h-8"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Branch created for each dispatched ticket. <code className="font-mono bg-muted px-1 rounded">{"{id}"}</code> is replaced with the ticket ID.
        </p>
      </div>

      {/* Payload options */}
      <div className={cn("rounded-2xl border bg-white p-5 space-y-4 transition-opacity", !config.enabled && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-semibold">Payload Options</h3>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Include code references</Label>
            <p className="text-xs text-muted-foreground">File paths, functions, and code snippets</p>
          </div>
          <Switch checked={config.includeCodeRefs} onCheckedChange={(v) => updateConfig({ includeCodeRefs: v })} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Include suggested approach</Label>
            <p className="text-xs text-muted-foreground">Agent&apos;s recommended implementation strategy</p>
          </div>
          <Switch checked={config.includeApproach} onCheckedChange={(v) => updateConfig({ includeApproach: v })} />
        </div>
      </div>

      {/* Dispatch history */}
      {records.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 text-xs font-semibold text-muted-foreground">Recent Dispatches</div>
          <div className="divide-y">
            {records.slice(0, 8).map((r) => (
              <div key={r.ticketId} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.ticketTitle}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{r.branchName}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{AGENT_LABELS[r.agentType]}</span>
                {r.status === "dispatched" && <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200">Sent</Badge>}
                {r.status === "dispatching" && <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200 animate-pulse">Sendingâ€¦</Badge>}
                {r.status === "failed" && <Badge variant="outline" className="text-[10px] h-5 bg-red-50 text-red-700 border-red-200">Failed</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/10 py-10 text-center">
          <GitFork className="size-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No dispatches yet</p>
          <p className="text-xs text-muted-foreground mt-1">Enable dispatch and accept a ticket to see history here.</p>
        </div>
      )}
    </div>
  );
}

const MOCK_TEAM_DELIVERY = [
  { id: "1", name: "Ali Khan",   initials: "AK", role: "Backend",    color: "bg-violet-100 text-violet-700", tool: "jira" as DeliveryTool },
  { id: "2", name: "Sara Ahmed", initials: "SA", role: "Frontend",   color: "bg-blue-100 text-blue-700",     tool: "linear" as DeliveryTool },
  { id: "3", name: "Umar Dev",   initials: "UD", role: "Full Stack", color: "bg-emerald-100 text-emerald-700", tool: "github" as DeliveryTool },
  { id: "4", name: "Rabia M",    initials: "RM", role: "Mobile",     color: "bg-amber-100 text-amber-700",   tool: "clickup" as DeliveryTool },
];

const ALL_TOOLS: { value: DeliveryTool; label: string; desc: string }[] = [
  { value: "jira",    label: "Jira",          desc: "Atlassian project management" },
  { value: "linear",  label: "Linear",        desc: "Fast issue tracking for teams" },
  { value: "github",  label: "GitHub Issues", desc: "Native GitHub issue tracker" },
  { value: "clickup", label: "ClickUp",       desc: "All-in-one productivity" },
  { value: "asana",   label: "Asana",         desc: "Work management platform" },
];

function DeliveryTab() {
  const { config, setConfig, records } = useDeliveryStore();

  return (
    <div className="space-y-6">
      {/* Flow diagram */}
      <div className="rounded-2xl border bg-gradient-to-br from-violet-50/60 to-blue-50/40 p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">How it works</p>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { icon: <Zap className="size-4 text-amber-500" />, label: "Ticket arrives", color: "bg-amber-50 border-amber-200" },
            { icon: <ArrowRight className="size-3.5 text-muted-foreground" />, label: "", color: "" },
            { icon: <BotMessageSquare className="size-4 text-violet-500" />, label: "AI drafts spec", color: "bg-violet-50 border-violet-200" },
            { icon: <ArrowRight className="size-3.5 text-muted-foreground" />, label: "", color: "" },
            { icon: <CheckCircle2 className="size-4 text-emerald-500" />, label: "PM accepts", color: "bg-emerald-50 border-emerald-200" },
            { icon: <ArrowRight className="size-3.5 text-muted-foreground" />, label: "", color: "" },
            { icon: <User className="size-4 text-blue-500" />, label: "Assign dev", color: "bg-blue-50 border-blue-200" },
            { icon: <ArrowRight className="size-3.5 text-muted-foreground" />, label: "", color: "" },
            { icon: <SendHorizonal className="size-4 text-indigo-500" />, label: "Push to tool", color: "bg-indigo-50 border-indigo-200" },
          ].map((step, i) =>
            step.label ? (
              <div key={i} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${step.color}`}>
                {step.icon}
                <span className="text-xs font-medium">{step.label}</span>
              </div>
            ) : (
              <span key={i}>{step.icon}</span>
            )
          )}
        </div>
      </div>

      {/* Master toggle */}
      <div className="rounded-2xl border bg-white p-5 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Enable Delivery Flow</p>
            <p className="text-xs text-muted-foreground mt-0.5">Show assign + push modal when accepting tickets</p>
          </div>
          <Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ enabled: v })} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Auto-deliver on accept</p>
            <p className="text-xs text-muted-foreground mt-0.5">Skip the modal, use default developer + tool</p>
          </div>
          <Switch checked={config.autoDeliver} onCheckedChange={(v) => setConfig({ autoDeliver: v })} disabled={!config.enabled} />
        </div>
      </div>

      {/* Default tool */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <p className="text-sm font-semibold">Default Destination Tool</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_TOOLS.map((tool) => (
            <button
              key={tool.value}
              onClick={() => setConfig({ defaultTool: tool.value })}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                config.defaultTool === tool.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "hover:border-primary/30 hover:bg-muted/20"
              )}
            >
              <span className="text-sm font-medium">{tool.label}</span>
              <span className="text-[11px] text-muted-foreground">{tool.desc}</span>
              {config.defaultTool === tool.value && (
                <span className="mt-1 text-[10px] font-semibold text-primary">Default âœ“</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Team member â†’ tool mapping */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <p className="text-sm font-semibold">Team Member Tool Mapping</p>
        <p className="text-xs text-muted-foreground">Each dev's preferred destination â€” overrides the default.</p>
        <div className="divide-y rounded-xl border overflow-hidden">
          {MOCK_TEAM_DELIVERY.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-muted/20">
              <span className={cn("size-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", member.color)}>
                {member.initials}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-[11px] text-muted-foreground">{member.role}</p>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground/40 shrink-0" />
              <span className="text-xs font-semibold text-primary">{TOOL_LABELS[member.tool]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery history */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <p className="text-sm font-semibold">Delivery History</p>
        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed py-8 text-center">
            <SendHorizonal className="size-7 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No deliveries yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accept a ticket to push it to your PM tool.</p>
          </div>
        ) : (
          <div className="divide-y rounded-xl border overflow-hidden">
            {records.slice(0, 10).map((r) => (
              <div key={r.ticketId} className="flex items-center gap-3 px-3 py-2.5">
                <span className={cn(
                  "size-2 rounded-full shrink-0",
                  r.status === "delivered" ? "bg-emerald-500" : r.status === "delivering" ? "bg-blue-400 animate-pulse" : "bg-red-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.ticketTitle}</p>
                  <p className="text-[11px] text-muted-foreground">{r.assigneeName} â†’ {TOOL_LABELS[r.tool]}</p>
                </div>
                {r.externalId && (
                  <span className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">{r.externalId}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
