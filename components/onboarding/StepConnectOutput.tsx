"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import { ConnectProviderDialog } from "@/components/onboarding/ConnectProviderDialog";

import {
  ClickUpLogo,
  GitHubIssuesLogo,
  JiraLogo,
  LinearLogo,
  MondayLogo,
} from "@/components/shared/BrandLogos";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { cn } from "@/lib/utils";

const OUTPUTS = [
  { id: "linear", name: "Linear", Logo: LinearLogo, desc: "Modern project tracking" },
  { id: "jira", name: "Jira", Logo: JiraLogo, desc: "Atlassian project management" },
  { id: "monday", name: "Monday.com", Logo: MondayLogo, desc: "Work OS and boards" },
  { id: "clickup", name: "ClickUp", Logo: ClickUpLogo, desc: "All-in-one productivity" },
  { id: "github_issues", name: "GitHub Issues", Logo: GitHubIssuesLogo, desc: "Built-in repo issues" },
];

const PROJECTS: Record<string, string[]> = {
  linear: ["Backend - Q3", "Frontend - Q3", "Infrastructure", "Mobile"],
  jira: ["BACK", "FRONT", "OPS", "MOBILE"],
  monday: ["Development Board", "Sprint Board", "Bug Tracker"],
  clickup: ["Engineering", "Platform", "Design"],
  github_issues: ["api-backend", "web-frontend", "data-pipeline"],
};

export function StepConnectOutput() {
  const {
    outputTool,
    outputToolStatus,
    selectedProject,
    connectOutputTool,
    setSelectedProject,
    setStep,
  } = useOnboardingStore();
  const [dialogProvider, setDialogProvider] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    if (outputTool === id && outputToolStatus === "connected") return;
    setConnecting(id);
    await connectOutputTool(id);
    setConnecting(null);
  };

  const projects = outputTool ? PROJECTS[outputTool] ?? [] : [];
  const dialogMeta = OUTPUTS.find((o) => o.id === dialogProvider);

  return (
    <>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-8 pb-6 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Where should dev tickets go?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect your project management tool to push accepted tickets automatically.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {OUTPUTS.map(({ id, name, Logo, desc }) => {
            const isConnected = outputTool === id && outputToolStatus === "connected";
            const isConnecting = connecting === id;

            return (
              <button
                key={id}
                disabled={isConnecting}
                onClick={() => {
                  if (isConnected) return;
                  setDialogProvider(id);
                }}
                title={desc}
                className={cn(
                  "group relative flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-white p-4 text-center transition-all duration-150",
                  isConnected
                    ? "border-primary bg-primary/[0.03] shadow-sm"
                    : isConnecting
                      ? "border-muted-foreground/20 bg-muted/20 cursor-wait"
                      : "border-border hover:border-primary/40 hover:shadow-sm"
                )}
              >
                {isConnected && (
                  <span className="absolute right-2 top-2 flex size-[18px] items-center justify-center rounded-full bg-primary shadow-sm">
                    <Check className="size-2.5 text-white" strokeWidth={2.5} />
                  </span>
                )}

                <div className="relative flex size-12 items-center justify-center">
                  <Logo className="size-10 transition-transform duration-150 group-hover:scale-105" />
                  {isConnecting && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/85">
                      <Loader2 className="size-4 animate-spin text-primary" />
                    </span>
                  )}
                </div>

                <p className={cn("text-xs font-semibold leading-tight", isConnected ? "text-primary" : "text-foreground")}>
                  {name}
                </p>
              </button>
            );
          })}
        </div>

        {outputToolStatus === "connected" && projects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Select target project / board</p>
            <Select
              value={selectedProject ?? ""}
              onValueChange={(value) => {
                if (value) setSelectedProject(value);
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-4">
        <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground">
          Back
        </Button>
        <Button
          onClick={() => setStep(4)}
          disabled={outputToolStatus !== "connected" || !selectedProject}
          className="min-w-28 gap-2"
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>

    {dialogMeta && (
      <ConnectProviderDialog
        open={!!dialogProvider}
        providerId={dialogMeta.id}
        providerName={dialogMeta.name}
        Logo={dialogMeta.Logo}
        onClose={() => setDialogProvider(null)}
        onConnected={async () => {
          await handleConnect(dialogMeta.id);
        }}
      />
    )}
    </>
  );
}
