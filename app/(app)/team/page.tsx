"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  Key,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_TEAM_MEMBERS } from "@/lib/mock/team";
import { useAuditStore } from "@/lib/store/audit";
import type { TeamMember, UserRole } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function TeamPage() {
  const { entries, search: searchAudit } = useAuditStore();
  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("reviewer");
  const [auditQuery, setAuditQuery] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const filteredAudit = searchAudit(auditQuery);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setMembers([
      ...members,
      {
        id: `u${Date.now()}`,
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        status: "invited",
        avatarInitials: inviteEmail[0].toUpperCase(),
      },
    ]);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 border-b bg-card/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center shrink-0">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Team & Governance</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Roles, billing, and audit trail</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full">
        <Tabs defaultValue="audit" className="space-y-6">
          <TabsList className="h-9 flex-wrap">
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search audit log..."
                className="pl-9"
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
              />
            </div>
            <div className="rounded-xl border bg-card divide-y overflow-hidden">
              {filteredAudit.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">No audit entries found</p>
              ) : (
                filteredAudit.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{entry.action.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">{entry.actor}</span>
                        {entry.actorType === "automation" && (
                          <Badge className="text-[10px] bg-violet-100 text-violet-700">Automation</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-foreground/90">{entry.detail}</p>
                      {entry.ticketTitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.ticketTitle}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(entry.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="rounded-xl border bg-card p-4 flex gap-2 flex-wrap">
              <Input placeholder="name@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1 min-w-[200px]" />
              <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v as UserRole)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} className="gap-1.5"><UserPlus className="size-4" /> Invite</Button>
            </div>
            <div className="rounded-xl border bg-card divide-y">
              {members.map((m) => (
                <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{m.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">{m.role}</Badge>
                  <Badge variant="outline" className={cn("text-xs", m.status === "active" ? "text-emerald-700" : "text-amber-700")}>{m.status}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">Plan & Billing</h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Growth Plan</p>
                  <p className="text-xs text-muted-foreground">$1,200/month · Renews Jul 1, 2026</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toast.info("Billing portal")}>Manage</Button>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">API Key</h3>
              <div className="flex gap-2">
                <code className="flex-1 text-xs font-mono bg-muted/40 border rounded-lg px-3 py-2">
                  {apiKeyVisible ? "sk-pm-xxxxxxxx-xxxx-xxxx" : "sk-pm-••••••••••••••••"}
                </code>
                <Button size="sm" variant="outline" onClick={() => setApiKeyVisible(!apiKeyVisible)}>
                  <Key className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Export started")}>
                <Download className="size-4" /> Export all data
              </Button>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800 flex items-center gap-1"><AlertTriangle className="size-4" /> Danger zone</p>
                <p className="text-xs text-red-600/80">Permanently delete organization</p>
              </div>
              <Button size="sm" variant="destructive"><Trash2 className="size-3.5" /> Delete</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
