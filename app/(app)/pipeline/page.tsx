"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, Filter, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PIPELINE_STAGE_LABELS, usePipelineStore } from "@/lib/store/pipeline";
import type { PipelineCard, PipelineStage } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

const STAGES: PipelineStage[] = ["accepted", "assigned", "dev_working", "pr_open", "merged", "shipped"];

export default function PipelinePage() {
  const { cards, moveCard, advanceCard } = usePipelineStore();
  const [devFilter, setDevFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");

  const developers = useMemo(() => [...new Set(cards.map((c) => c.assigneeName).filter(Boolean))], [cards]);
  const tools = useMemo(() => [...new Set(cards.map((c) => c.destinationTool).filter(Boolean))], [cards]);
  const areas = useMemo(() => [...new Set(cards.map((c) => c.codeArea).filter(Boolean))], [cards]);

  const filtered = cards.filter((c) => {
    if (devFilter !== "all" && c.assigneeName !== devFilter) return false;
    if (toolFilter !== "all" && c.destinationTool !== toolFilter) return false;
    if (areaFilter !== "all" && c.codeArea !== areaFilter) return false;
    return true;
  });

  const onDrop = (cardId: string, stage: PipelineStage) => {
    moveCard(cardId, stage);
    toast.success(`Moved to ${PIPELINE_STAGE_LABELS[stage]}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm px-4 md:px-6 py-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Pipeline Tracker</h1>
            <p className="text-xs text-muted-foreground">Accepted tickets through delivery · {filtered.length} active</p>
          </div>
          <Link href="/triage"><Button variant="outline" size="sm" className="h-8 text-xs">Triage Workspace →</Button></Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={devFilter} onValueChange={(v) => v && setDevFilter(v)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Developer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All developers</SelectItem>
              {developers.map((d) => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={toolFilter} onValueChange={(v) => v && setToolFilter(v)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Tool" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tools</SelectItem>
              {tools.map((t) => <SelectItem key={t} value={t!}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={(v) => v && setAreaFilter(v)}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Code area" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All code areas</SelectItem>
              {areas.map((a) => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 min-w-max h-full pb-4">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              label={PIPELINE_STAGE_LABELS[stage]}
              cards={filtered.filter((c) => c.stage === stage)}
              onDrop={onDrop}
              onAdvance={advanceCard}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PipelineColumn({
  stage,
  label,
  cards,
  onDrop,
  onAdvance,
}: {
  stage: PipelineStage;
  label: string;
  cards: PipelineCard[];
  onDrop: (id: string, stage: PipelineStage) => void;
  onAdvance: (id: string) => void;
}) {
  return (
    <div
      className="w-64 shrink-0 flex flex-col rounded-xl border bg-white/80"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("cardId");
        if (id) onDrop(id, stage);
      }}
    >
      <div className="px-3 py-2.5 border-b flex items-center justify-between">
        <p className="text-xs font-semibold">{label}</p>
        <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 font-medium">{cards.length}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-220px)]">
        {cards.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)}
            className="rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-1">
              <GripVertical className="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-snug line-clamp-2">{card.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">{card.externalId ?? card.ticketId}</p>
                <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
                  {card.assigneeName && <span className="bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">{card.assigneeInitials}</span>}
                  {card.destinationTool && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{card.destinationTool}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">{formatRelativeTime(card.stageEnteredAt)} in stage</p>
              </div>
            </div>
            {stage !== "shipped" && (
              <Button variant="ghost" size="sm" className="h-6 w-full mt-2 text-[10px]" onClick={() => onAdvance(card.id)}>
                Advance <ChevronRight className="size-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
