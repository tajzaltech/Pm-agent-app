"use client";

import { useMemo, useState } from "react";
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
import { useAuditStore } from "@/lib/store/audit";
import { buildInviteMember, useTeamStore } from "@/lib/store/team";
import type { UserRole } from "@/lib/types";
import { inviteableRoles, roleLabel } from "@/lib/utils/team-rbac";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function TeamPage() {
  const { entries, search: searchAudit } = useAuditStore();
  const members = useTeamStore((s) => s.members);
  const currentUserId = useTeamStore((s) => s.currentUserId);
  const currentUser = members.find((m) => m.id === currentUserId);
  const canRemove = useTeamStore((s) => s.canRemove);
  const removeMember = useTeamStore((s) => s.removeMember);
  const addMember = useTeamStore((s) => s.addMember);

  const [inviteEmail, setInviteEmail] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const actorRole = currentUser?.role ?? "user";
  const rolesForInvite = inviteableRoles(actorRole);
  const [inviteRole, setInviteRole] = useState<UserRole>(rolesForInvite[0] ?? "user");

  const filteredAudit = searchAudit(auditQuery);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    if (!rolesForInvite.includes(inviteRole)) {
      toast.error("Your role cannot invite that permission level");
      return;
    }
    addMember(buildInviteMember(inviteEmail.trim(), inviteRole));
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  const handleRemove = (id: string, name: string) => {
    if (removeMember(id)) {
      toast.success(`${name} removed from the team`);
    } else {
      toast.error("You don't have permission to remove this member");
    }
  };

  const roleHint = useMemo(() => {
    if (actorRole === "owner") return "You can remove Admins and Users.";
    if (actorRole === "admin") return "You can remove Users only.";
    return "Users cannot remove team members.";
  }, [actorRole]);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 border-b bg-card/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center shrink-0">
        <div>
          <h1 className="text-sm font-medium tracking-tight">Team</h1>
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
            {currentUser && (
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
                Signed in as <strong className="text-foreground">{currentUser.name}</strong> ({roleLabel(currentUser.role)}). {roleHint}
              </p>
            )}

            {rolesForInvite.length > 0 ? (
              <div className="rounded-xl border bg-card p-4 flex gap-2 flex-wrap">
                <Input
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 min-w-[200px]"
                />
                <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v as UserRole)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rolesForInvite.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} className="gap-1.5">
                  <UserPlus className="size-4" /> Invite
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Users cannot invite new team members.
              </div>
            )}

            <div className="rounded-xl border bg-card divide-y">
              {members.map((m) => {
                const showRemove = canRemove(m.id);
                const isSelf = m.id === currentUserId;
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{m.avatarInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {m.name}
                        {isSelf && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs shrink-0">
                      {roleLabel(m.role)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-xs shrink-0", m.status === "active" ? "text-emerald-700" : "text-amber-700")}
                    >
                      {m.status}
                    </Badge>
                    {showRemove ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemove(m.id, m.name)}
                        aria-label={`Remove ${m.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <span className="size-8 shrink-0" aria-hidden />
                    )}
                  </div>
                );
              })}
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
