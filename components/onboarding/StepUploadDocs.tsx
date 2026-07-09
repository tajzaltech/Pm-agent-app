"use client";

import { ArrowRight } from "lucide-react";

import { ProductDocsManager } from "@/components/shared/ProductDocsManager";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/lib/store/onboarding";

export function StepUploadDocs() {
  const { setStep, startIndexing } = useOnboardingStore();

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-8 pb-6 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Add product context</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Upload docs so PM Agent understands your product — optional but improves triage quality.
        </p>
      </div>

      <div className="p-6 space-y-4">
        <ProductDocsManager variant="onboarding" />
        <p className="text-xs text-muted-foreground">
          You can add more docs anytime from Settings → Preferences.
        </p>
      </div>

      <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-4">
        <Button variant="ghost" onClick={() => setStep(3)} className="text-muted-foreground">
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={startIndexing}>
            Skip for now
          </Button>
          <Button onClick={startIndexing} className="gap-2">
            Start indexing
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
