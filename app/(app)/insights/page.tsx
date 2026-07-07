"use client";

import { Suspense } from "react";
import InsightsContent from "./InsightsContent";
import { Skeleton } from "@/components/ui/skeleton";

export default function InsightsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-12 w-full" /></div>}>
      <InsightsContent />
    </Suspense>
  );
}
