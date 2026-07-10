"use client";

import {
  GearSix,
  Bell,
  Palette,
  User,
  Buildings,
  GitBranch,
  ShieldCheck,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/lib/store/theme";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const TABS = [
  { id: "general", label: "General", icon: GearSix },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "workspace", label: "Workspace", icon: Buildings },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <nav className="md:w-48 shrink-0 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                  activeTab === id
                    ? "bg-primary/8 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon size={16} weight={activeTab === id ? "fill" : "regular"} />
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-5">
            {activeTab === "general" && <GeneralTab />}
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "workspace" && <WorkspaceTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── General ─── */

function GeneralTab() {
  const { defaultLanding, setDefaultLanding } = useThemeStore();

  return (
    <>
      <SectionHeader title="General" description="App-wide preferences and defaults" />

      <SettingCard>
        <div className="space-y-4">
          <SettingRow
            icon={Palette}
            title="Default landing page"
            description="Where you land after sign-in"
          >
            <div className="flex gap-2">
              {[
                { value: "/chat", label: "Ask PM" },
                { value: "/pipeline", label: "Pipeline" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDefaultLanding(opt.value)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-all",
                    defaultLanding === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <div className="border-t" />

          <SettingRow
            icon={ShieldCheck}
            title="Auto-classify incoming tickets"
            description="Automatically categorize new tickets using AI"
          >
            <Switch defaultChecked />
          </SettingRow>

          <div className="border-t" />

          <SettingRow
            icon={GitBranch}
            title="Auto-index repositories"
            description="Re-index connected repos when new commits are pushed"
          >
            <Switch defaultChecked />
          </SettingRow>
        </div>
      </SettingCard>
    </>
  );
}

/* ─── Profile ─── */

function ProfileTab() {
  return (
    <>
      <SectionHeader title="Profile" description="Your account details" />

      <SettingCard>
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
            DU
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold">Demo User</p>
            <p className="text-[12px] text-muted-foreground">demo@pmagent.io</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Admin</p>
          </div>
          <Button variant="outline" size="sm" className="text-[12px] h-8" onClick={() => toast.info("Profile editing coming soon")}>
            Edit profile
          </Button>
        </div>

        <div className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <FieldDisplay label="Full name" value="Demo User" />
            <FieldDisplay label="Email" value="demo@pmagent.io" />
            <FieldDisplay label="Role" value="Admin" />
            <FieldDisplay label="Timezone" value="UTC+5 (PKT)" />
          </div>
        </div>
      </SettingCard>
    </>
  );
}

/* ─── Notifications ─── */

function NotificationsTab() {
  return (
    <>
      <SectionHeader title="Notifications" description="Control what alerts you receive" />

      <SettingCard>
        <div className="space-y-1">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Ticket events
          </p>
          {[
            { label: "New high-priority ticket", desc: "When a critical or P0 ticket is created", default: true },
            { label: "Ticket classification complete", desc: "When AI finishes classifying a ticket", default: true },
            { label: "Ticket assigned to you", desc: "When you're assigned as owner", default: true },
          ].map((item) => (
            <NotifRow key={item.label} {...item} />
          ))}
        </div>

        <div className="border-t my-4" />

        <div className="space-y-1">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Chat & AI
          </p>
          {[
            { label: "Chat-originated escalation", desc: "When Ask PM creates a ticket from chat", default: true },
            { label: "AI investigation complete", desc: "When PM Agent finishes analyzing an issue", default: false },
          ].map((item) => (
            <NotifRow key={item.label} {...item} />
          ))}
        </div>

        <div className="border-t my-4" />

        <div className="space-y-1">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Delivery
          </p>
          <SettingRow
            icon={EnvelopeSimple}
            title="Email digest"
            description="Receive a daily summary of activity"
          >
            <Switch />
          </SettingRow>
        </div>
      </SettingCard>
    </>
  );
}

/* ─── Workspace ─── */

function WorkspaceTab() {
  const workspace = useWorkspaceStore((s) => s.getActiveWorkspace());
  const data = useWorkspaceStore((s) => s.getActiveData());

  return (
    <>
      <SectionHeader title="Workspace" description={`Settings for ${workspace.name}`} />

      <SettingCard>
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className={cn("flex size-10 items-center justify-center rounded-lg text-sm font-bold text-white", workspace.color)}>
            {workspace.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold">{workspace.name}</p>
            <p className="text-[12px] text-muted-foreground">{workspace.description}</p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Tickets" value={String(data.tickets.length)} />
            <StatMini label="Connections" value={String(data.connections.length)} />
            <StatMini label="Repos" value={String(data.connections.filter((c) => c.category === "repo").length)} />
          </div>
        </div>

        <div className="border-t my-4" />

        <div className="space-y-4">
          <SettingRow
            icon={ShieldCheck}
            title="Require approval for ticket creation"
            description="Tickets created from chat need manual approval before entering pipeline"
          >
            <Switch defaultChecked />
          </SettingRow>

          <div className="border-t" />

          <SettingRow
            icon={GitBranch}
            title="Connected repositories"
            description={`${data.connections.filter((c) => c.category === "repo").length} repos indexed for this workspace`}
          >
            <Button variant="outline" size="sm" className="text-[12px] h-7" onClick={() => toast.info("Repo management coming soon")}>
              Manage
            </Button>
          </SettingRow>
        </div>
      </SettingCard>
    </>
  );
}

/* ─── Shared components ─── */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
      <p className="text-[12px] text-muted-foreground">{description}</p>
    </div>
  );
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      {children}
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ size?: number; weight?: string; className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium">{title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NotifRow({ label, desc, default: defaultChecked }: { label: string; desc: string; default: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-[13px] font-medium">{value}</p>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-center">
      <p className="text-lg font-bold tracking-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
