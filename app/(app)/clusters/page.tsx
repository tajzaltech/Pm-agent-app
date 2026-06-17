"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MOCK_CLUSTERS } from "@/lib/mock/clusters";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Layers, ChevronRight, CheckCheck, X, Quote, Code2, Clock } from "lucide-react";

export default function ClustersPage() {
  const [clusters, setClusters] = useState(MOCK_CLUSTERS);

  if (clusters.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Clusters</h1>
        <EmptyState
          icon={Layers}
          heading="No clusters detected yet"
          description="PM Agent groups related tickets into clusters as patterns emerge. Come back when more tickets have been processed."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-6 h-14 flex items-center justify-between shrink-0">
        <h1 className="text-base font-semibold tracking-tight">Clusters</h1>
        <Badge variant="secondary" className="text-xs font-medium px-3 py-1">{clusters.length} clusters</Badge>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            {/* Card body */}
            <div className="flex-1 p-4 space-y-3">
              {/* Top meta */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ScopeBadge scope={cluster.combinedScope} />
                  <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
                    <Layers className="size-3" />{cluster.ticketCount}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(cluster.createdAt)}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold leading-snug line-clamp-2">{cluster.title}</h3>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{cluster.description}</p>

              {/* Code area + classifications */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  <Code2 className="size-3" />{cluster.affectedCodeArea}
                </span>
                {cluster.tickets.slice(0, 2).map((t) => (
                  <ClassificationBadge key={t.ticketId} classification={t.classification} size="sm" />
                ))}
              </div>
            </div>

            {/* Card footer */}
            <div className="border-t px-4 py-3 flex items-center gap-1.5">
              <Button
                size="sm"
                className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-[11px] px-2.5 rounded-lg flex-1"
                onClick={() => { toast.success(`Accepted all ${cluster.ticketCount} tickets`); setClusters((prev) => prev.filter((c) => c.id !== cluster.id)); }}
              >
                <CheckCheck className="size-3" /> Accept all
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-red-600 border-red-200 hover:bg-red-50 text-[11px] px-2.5 rounded-lg"
                onClick={() => { toast.error(`Rejected`); setClusters((prev) => prev.filter((c) => c.id !== cluster.id)); }}
              >
                <X className="size-3" /> Reject
              </Button>
              <Link href={`/clusters/${cluster.id}`}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
