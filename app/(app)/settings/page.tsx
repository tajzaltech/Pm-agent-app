"use client";

import Link from "next/link";
import { Moon, Sun, Bell, Users, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useThemeStore } from "@/lib/store/theme";
import { useAutomationStore } from "@/lib/store/automation";

export default function SettingsPage() {
  const { mode, setMode, density, setDensity, defaultLanding, setDefaultLanding } = useThemeStore();
  const { preset, setPreset } = useAutomationStore();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b bg-card/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center">
        <h1 className="text-base font-semibold tracking-tight">Settings</h1>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <Tabs defaultValue="workspace">
            <TabsList className="mb-4">
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="space-y-4">
              <SettingCard title="Appearance" icon={mode === "dark" ? Moon : Sun}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Dark mode</p>
                    <p className="text-xs text-muted-foreground">Full token-based light/dark theme</p>
                  </div>
                  <Switch checked={mode === "dark"} onCheckedChange={(on) => setMode(on ? "dark" : "light")} />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant={density === "comfortable" ? "default" : "outline"} onClick={() => setDensity("comfortable")}>
                    Comfortable
                  </Button>
                  <Button size="sm" variant={density === "compact" ? "default" : "outline"} onClick={() => setDensity("compact")}>
                    Compact
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant={defaultLanding === "/triage" ? "default" : "outline"} onClick={() => setDefaultLanding("/triage")}>
                    Triage Workspace
                  </Button>
                  <Button size="sm" variant={defaultLanding === "/chat" ? "default" : "outline"} onClick={() => setDefaultLanding("/chat")}>
                    PM Agent Chat
                  </Button>
                </div>
              </SettingCard>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <SettingCard title="Alerts" icon={Bell}>
                {[
                  "New major-category ticket",
                  "Chat-originated escalation",
                  "Dev agent dispatch failure",
                ].map((label) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{label}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
              </SettingCard>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <SettingCard title="PM Agent Chat defaults" icon={Zap}>
                <p className="text-xs text-muted-foreground mb-3">Auto-accept preset for low-risk categories</p>
                <div className="flex gap-2">
                  {(["conservative", "balanced", "aggressive"] as const).map((p) => (
                    <Button key={p} size="sm" variant={preset === p ? "default" : "outline"} onClick={() => setPreset(p)} className="capitalize">
                      {p}
                    </Button>
                  ))}
                </div>
              </SettingCard>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <SettingCard title="Team & Governance" icon={Users}>
                <p className="text-sm text-muted-foreground mb-3">Roles, invites, and audit log</p>
                <Link
                  href="/team"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
                >
                  Open Team & Governance →
                </Link>
              </SettingCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SettingCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
