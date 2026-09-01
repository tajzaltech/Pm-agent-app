"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import {
  ClickUpLogo,
  GitHubIssuesLogo,
  JiraLogo,
  LinearLogo,
  MondayLogo,
  SlackLogo,
} from "@/components/shared/BrandLogos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { cn } from "@/lib/utils";

const OUTPUTS = [
  { id: "linear", name: "Linear", Logo: LinearLogo, desc: "Creates real issues via API key" },
  { id: "slack", name: "Slack", Logo: SlackLogo, desc: "Webhook later" },
  { id: "jira", name: "Jira", Logo: JiraLogo, desc: "Use Linear for live delivery" },
  { id: "monday", name: "Monday.com", Logo: MondayLogo, desc: "Coming soon" },
  { id: "clickup", name: "ClickUp", Logo: ClickUpLogo, desc: "Coming soon" },
  { id: "github_issues", name: "GitHub Issues", Logo: GitHubIssuesLogo, desc: "Coming soon" },
];

export function StepConnectOutput() {
  const { outputTool, outputToolStatus, selectedProject, connectOutputTool, setSelectedProject, setStep } =
    useOnboardingStore();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    if (id !== "linear") {
      setError("Linear is the live output in this build. Connect Linear to create real issues.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Paste a Linear personal API key.");
      return;
    }
    setError(null);
    setConnecting(id);
    try {
      await connectOutputTool(id, {
        apiKey: apiKey.trim(),
        teamId: teamId.trim() || undefined,
        project: teamId.trim() || selectedProject || "Linear",
      });
      if (!teamId.trim()) setSelectedProject("Linear");
    } catch {
      setError("Linear rejected that key. Create a personal API key in Linear settings and retry.");
    }
    setConnecting(null);
  };

  const isConnected = outputTool === "linear" && outputToolStatus === "connected";

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-8 pb-6 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Where should dev tickets go?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect Linear with an API key. Accepted tickets create real Linear issues.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {OUTPUTS.map(({ id, name, Logo, desc }) => {
            const connected = id === "linear" && isConnected;
            return (
              <div
                key={id}
                title={desc}
                className={cn(
                  "relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-white p-4 text-center",
                  connected ? "border-primary bg-primary/[0.03]" : "border-border"
                )}
              >
                {connected && (
                  <span className="absolute right-2 top-2 flex size-[18px] items-center justify-center rounded-full bg-primary">
                    <Check className="size-2.5 text-white" strokeWidth={2.5} />
                  </span>
                )}
                <Logo className="size-10" />
                <p className="text-xs font-semibold">{name}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="linear-key" className="text-xs">
              Linear API key
            </Label>
            <Input
              id="linear-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="lin_api_…"
              className="h-9 bg-white font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linear-team" className="text-xs">
              Team ID (optional — first team is used if empty)
            </Label>
            <Input
              id="linear-team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="UUID from Linear team settings"
              className="h-9 bg-white font-mono text-sm"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={() => void handleConnect("linear")} disabled={!!connecting} className="gap-2">
            {connecting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isConnected ? "Update Linear" : "Connect Linear"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-4">
        <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground">
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button onClick={() => setStep(4)} variant="outline">
            Skip for now
          </Button>
          <Button onClick={() => setStep(4)} disabled={!isConnected} className="min-w-28 gap-2">
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
