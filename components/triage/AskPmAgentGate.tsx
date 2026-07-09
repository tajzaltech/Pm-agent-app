"use client";

import { Bot, Code2, MessageSquare } from "lucide-react";

import { AskPmAgentButton } from "@/components/triage/AskPmAgentButton";
import { TriageFlowStrip } from "@/components/triage/TriageFlowStrip";
import type { Ticket } from "@/lib/types";

export function AskPmAgentGate({ ticket }: { ticket: Ticket }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-violet-500/5 p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative space-y-6">
        <TriageFlowStrip activeStep={2} />

        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Bot className="size-7" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Ask PM Agent first</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The draft ticket, GitHub code search, AI reasoning, and Accept/Reject actions unlock
            <strong className="text-foreground"> after </strong>
            PM Agent reviews this query with you.
          </p>
        </div>

        <div className="mx-auto grid max-w-md gap-2 sm:grid-cols-3">
          {[
            { icon: MessageSquare, title: "Explain query", sub: "Plain language summary" },
            { icon: Code2, title: "Search GitHub", sub: "Find code & root cause" },
            { icon: Bot, title: "Recommend action", sub: "Accept, reject, or ignore" },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="rounded-xl bg-background/80 px-3 py-3 text-center shadow-sm">
              <Icon className="mx-auto mb-1.5 size-4 text-primary" />
              <p className="text-xs font-semibold">{title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-xs">
          <AskPmAgentButton ticket={ticket} variant="row" className="py-3 text-sm shadow-md shadow-primary/20" />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Opens PM Agent Chat → then return here to decide
          </p>
        </div>
      </div>
    </div>
  );
}
