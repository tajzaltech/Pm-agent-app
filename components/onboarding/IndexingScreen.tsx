"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MOCK_TICKETS } from "@/lib/mock/tickets";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";

export function IndexingScreen() {
  const router = useRouter();
  const { indexingStatus, indexingStep, markSetupDone, step, workspaceRole } = useOnboardingStore();

  useEffect(() => {
    if (step === "done") {
      markSetupDone();
    }
  }, [step, markSetupDone]);

  const pendingCount = MOCK_TICKETS.filter((t) => t.status === "pending").length;
  const isDone = indexingStatus === "done";
  const isError = indexingStatus === "error";

  const STATUS_STEPS = [
    "Reading repository structure...",
    "Parsing functions and routes...",
    "Analyzing models and schemas...",
    "Building semantic map...",
    "Indexing complete.",
  ];

  const currentStepIdx = STATUS_STEPS.indexOf(indexingStep);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-full max-w-md text-center space-y-8 px-4">
        {/* Icon */}
        <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 mx-auto">
          {isDone ? (
            <CheckCircle className="size-8 text-primary" />
          ) : isError ? (
            <AlertCircle className="size-8 text-red-500" />
          ) : (
            <Zap className="size-8 text-primary animate-pulse" />
          )}
        </div>

        {isDone ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
              <p className="text-muted-foreground text-sm">
                Your codebase has been indexed and the agent is ready.
              </p>
              {pendingCount > 0 && (
                <p className="text-sm font-medium text-primary">
                  We found {pendingCount} tickets ready to analyze.
                </p>
              )}
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push(workspaceRole === "cs_agent" ? "/chat" : "/triage")}
            >
              {workspaceRole === "cs_agent" ? "Open PM Agent Chat →" : "Go to Triage Workspace →"}
            </Button>
          </>
        ) : isError ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-red-700">Indexing failed</h1>
              <p className="text-muted-foreground text-sm">
                Something went wrong while indexing your codebase.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <a href="mailto:support@pmagent.io" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                Contact support
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Indexing your codebase...</h1>
              <p className="text-muted-foreground text-sm">
                This usually takes 1-3 minutes depending on repository size.
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-4">
              <Progress
                value={currentStepIdx >= 0 ? ((currentStepIdx + 1) / STATUS_STEPS.length) * 100 : 10}
                className="h-2"
              />
              <ul className="space-y-2 text-left">
                {STATUS_STEPS.map((s, i) => {
                  const done = i < currentStepIdx || indexingStep === "Indexing complete.";
                  const active = s === indexingStep && indexingStep !== "Indexing complete.";
                  return (
                    <li
                      key={s}
                      className={
                        done
                          ? "text-sm text-emerald-600 font-medium"
                          : active
                          ? "text-sm text-foreground font-semibold"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {done ? "Done " : active ? "-> " : "  "}{s}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

