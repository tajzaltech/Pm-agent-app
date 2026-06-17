"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { INGEST_WEBHOOK_URL } from "@/lib/constants";

interface WebhookEndpointPanelProps {
  title: string;
  description?: string;
  steps?: string[];
  icon?: React.ReactNode;
}

export function WebhookEndpointPanel({ title, description, steps, icon }: WebhookEndpointPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(INGEST_WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg border bg-white px-3 py-2.5 font-mono text-xs text-slate-600 shadow-sm">
          {INGEST_WEBHOOK_URL}
        </code>
        <Button size="sm" variant="outline" className="h-9 shrink-0 gap-1.5 bg-white" onClick={copyUrl}>
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {steps && steps.length > 0 && (
        <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
