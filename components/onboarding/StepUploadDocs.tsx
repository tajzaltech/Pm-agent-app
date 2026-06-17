"use client";

import { ProductDocsManager } from "@/components/shared/ProductDocsManager";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/lib/store/onboarding";

export function StepUploadDocs() {
  const { setStep, startIndexing } = useOnboardingStore();

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-6">
      <ProductDocsManager variant="onboarding" />

      <p className="text-xs text-muted-foreground">
        You can add more docs anytime from Settings → Preferences.
      </p>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(3)}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={startIndexing}>
            Skip for now
          </Button>
          <Button onClick={startIndexing}>Start Indexing</Button>
        </div>
      </div>
    </div>
  );
}
