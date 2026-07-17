"use client";

import { Check, FileText, GitBranch, Send, TicketCheck } from "lucide-react";

import { IndexingScreen } from "@/components/onboarding/IndexingScreen";
import { PMAgentLogo } from "@/components/shared/BrandLogos";
import { StepConnectOutput } from "@/components/onboarding/StepConnectOutput";
import { StepConnectRepo } from "@/components/onboarding/StepConnectRepo";
import { StepConnectSource } from "@/components/onboarding/StepConnectSource";
import { StepUploadDocs } from "@/components/onboarding/StepUploadDocs";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Ticket source", description: "Import requests", Icon: TicketCheck },
  { number: 2, label: "Code repo", description: "Map codebase", Icon: GitBranch },
  { number: 3, label: "Output tool", description: "Push tickets", Icon: Send },
  { number: 4, label: "Product docs", description: "Add context", Icon: FileText },
];

export default function OnboardingPage() {
  const { step } = useOnboardingStore();

  if (step === "indexing" || step === "done") {
    return <IndexingScreen />;
  }

  const current = typeof step === "number" ? step : 4;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <PMAgentLogo className="size-9 object-contain" />
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">Ask PM</p>
              <p className="mt-1 text-xs text-muted-foreground">Workspace setup</p>
            </div>
          </div>
          <div className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            Step {current} of {STEPS.length}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="mb-8 w-full max-w-5xl">
          <div className="grid gap-3 md:grid-cols-4">
            {STEPS.map(({ number, label, description, Icon }) => {
              const isDone = current > number;
              const isActive = current === number;

              return (
                <div
                  key={number}
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-card p-4 transition-all",
                    isActive && "border-primary shadow-sm ring-2 ring-primary/10",
                    isDone && "border-primary/25 bg-primary/[0.025]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl border",
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/40 text-muted-foreground"
                      )}
                    >
                      {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                        {label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-1",
                      isDone || isActive ? "bg-primary" : "bg-transparent"
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-3xl">
          {step === 1 && <StepConnectSource />}
          {step === 2 && <StepConnectRepo />}
          {step === 3 && <StepConnectOutput />}
          {step === 4 && <StepUploadDocs />}
        </div>
      </main>
    </div>
  );
}
