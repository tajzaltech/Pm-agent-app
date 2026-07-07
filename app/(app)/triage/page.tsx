"use client";

import { Suspense } from "react";
import { TriageWorkspace } from "@/components/triage/TriageWorkspace";
import { Skeleton } from "@/components/ui/skeleton";

export default function TriagePage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-12 w-full" /></div>}>
      <TriageWorkspace />
    </Suspense>
  );
}
