"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useTicketStore } from "@/lib/store/tickets";

export function IndexingScreen() {
  const router = useRouter();
  const { indexingStatus, indexingStep, markSetupDone, step, startIndexing } = useOnboardingStore();
  const pendingCount = useTicketStore((s) => s.tickets.filter((t) => t.status === "pending").length);

  useEffect(() => {
    if (step === "done") markSetupDone();
  }, [step, markSetupDone]);

  useEffect(() => {
    if (step === "indexing" && indexingStatus === "idle") void startIndexing();
  }, [step, indexingStatus, startIndexing]);

  const isDone = indexingStatus === "done";
  const isError = indexingStatus === "error";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          {isDone ? (
            <CheckCircle className="size-8 text-primary" />
          ) : isError ? (
            <AlertCircle className="size-8 text-red-500" />
          ) : (
            <Zap className="size-8 animate-pulse text-primary" />
          )}
        </div>

        {isDone ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
              <p className="text-sm text-muted-foreground">Your repository is indexed. Ask PM can retrieve real files.</p>
              {pendingCount > 0 && (
                <p className="text-sm font-medium text-primary">{pendingCount} ticket{pendingCount === 1 ? "" : "s"} in the queue.</p>
              )}
            </div>
            <Button size="lg" className="w-full" onClick={() => router.replace("/chat")}>
              Open Ask PM →
            </Button>
          </>
        ) : isError ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-red-700">Indexing failed</h1>
              <p className="text-sm text-muted-foreground">{indexingStep || "Something went wrong while indexing."}</p>
            </div>
            <Button onClick={() => void startIndexing()}>Retry</Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Indexing your codebase…</h1>
              <p className="text-sm text-muted-foreground">{indexingStep || "Fetching repository files and embeddings."}</p>
            </div>
            <Progress value={55} className="h-2" />
          </>
        )}
      </div>
    </div>
  );
}
