"use client";

import { Bell, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/lib/store/theme";

export default function SettingsPage() {
  const { defaultLanding, setDefaultLanding } = useThemeStore();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b bg-card/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center">
        <h1 className="text-sm font-medium tracking-tight">Settings</h1>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <SettingCard title="Workspace" icon={LayoutGrid}>
            <div>
              <p className="text-sm font-medium">Default landing page</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Where you land after sign-in
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={defaultLanding === "/triage" ? "default" : "outline"}
                  onClick={() => setDefaultLanding("/triage")}
                >
                  Triage
                </Button>
                <Button
                  size="sm"
                  variant={defaultLanding === "/chat" ? "default" : "outline"}
                  onClick={() => setDefaultLanding("/chat")}
                >
                  AI PM
                </Button>
              </div>
            </div>
          </SettingCard>

          <SettingCard title="Notifications" icon={Bell}>
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
