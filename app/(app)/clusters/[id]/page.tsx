"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MOCK_CLUSTERS } from "@/lib/mock/clusters";
import { useTicketStore } from "@/lib/store/tickets";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCheck, X, ChevronRight, Quote } from "lucide-react";

export default function ClusterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accept, reject } = useTicketStore();

  const cluster = MOCK_CLUSTERS.find((c) => c.id === id);
  if (!cluster) {
    return (
      <div className="p-6">
        <Button variant="ghost" className="gap-1.5 mb-4" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <p className="text-muted-foreground">Cluster not found.</p>
      </div>
    );
  }

  const handleBatchAccept = () => {
    cluster.tickets.forEach((t) => accept(t.ticketId));
    toast.success(`All ${cluster.tickets.length} tickets in cluster accepted`);
    router.push("/clusters");
  };

  const handleBatchReject = () => {
    cluster.tickets.forEach((t) => reject(t.ticketId));
    toast.error(`All ${cluster.tickets.length} tickets in cluster rejected`);
    router.push("/clusters");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" className="gap-1.5 -ml-2" onClick={() => router.push("/clusters")}>
        <ArrowLeft className="size-4" /> Clusters
      </Button>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ScopeBadge scope={cluster.combinedScope} />
          <h1 className="text-2xl font-bold tracking-tight">{cluster.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{cluster.description}</p>
        <p className="text-xs font-mono bg-muted/60 inline-block px-2 py-1 rounded">{cluster.affectedCodeArea}</p>
      </div>

      {/* Representative quotes */}
      <div className="bg-white rounded-xl border p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Customer Quotes</p>
        {cluster.representativeQuotes.map((q, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground italic">
            <Quote className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/40" />
            <span>&ldquo;{q}&rdquo;</span>
          </div>
        ))}
      </div>

      {/* Batch actions */}
      <div className="flex items-center gap-2">
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handleBatchAccept}>
          <CheckCheck className="size-4" /> Accept all {cluster.tickets.length} tickets
        </Button>
        <Button variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={handleBatchReject}>
          <X className="size-4" /> Reject all
        </Button>
      </div>

      {/* Ticket list */}
      <div>
        <p className="text-sm font-semibold mb-3">Tickets in this cluster</p>
        <div className="bg-white rounded-xl border divide-y overflow-hidden">
          {cluster.tickets.map((t) => (
            <Link
              key={t.ticketId}
              href={`/queue/${t.ticketId}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
            >
              <ClassificationBadge classification={t.classification} size="sm" />
              <ScopeBadge scope={t.scope} />
              <span className="text-sm flex-1">{t.title}</span>
              <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
