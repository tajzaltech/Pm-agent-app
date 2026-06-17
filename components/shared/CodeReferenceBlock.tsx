"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CodeRef } from "@/lib/types";

interface Props {
  codeRef: CodeRef;
  className?: string;
}

export function CodeReferenceBlock({ codeRef, className }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(codeRef.filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors group"
        onClick={() => codeRef.snippet && setExpanded(!expanded)}
      >
        {codeRef.snippet ? (
          expanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <div className="size-3.5" />
        )}

        <span className="font-mono text-xs text-foreground/80 truncate flex-1">
          {codeRef.filePath}
        </span>

        {codeRef.functionName && (
          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            {codeRef.functionName}
            {codeRef.lineStart && `:${codeRef.lineStart}`}
          </span>
        )}

        <Button
          size="icon"
          variant="ghost"
          className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
        </Button>
      </div>

      {expanded && codeRef.snippet && (
        <div className="border-t">
          <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto bg-[#f8f9fc] text-[#1e2030]">
            <code>{codeRef.snippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
