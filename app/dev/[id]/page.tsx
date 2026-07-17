"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Zap,
  CheckCircle2,
  Code2,
  Copy,
  Check,
  GitBranch,
  ExternalLink,
  Terminal,
  FileCode2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// In a real app this would fetch from the server.
// For now we use mock data matching the mock tickets.
const MOCK_SPEC = {
  id: "ticket-001",
  externalId: "JIR-347",
  tool: "Jira",
  branchName: "fix/ticket-001",
  assigneeName: "Ali Khan",
  title: "Login fails when 2FA is enabled for enterprise users",
  description:
    "Enterprise users with two-factor authentication enabled are receiving a 401 Unauthorized error during the login flow. This happens specifically after the OTP verification step when the session cookie is set. Regular users are unaffected.",
  scope: "M",
  classification: "bug",
  suggestedApproach:
    "Check the session middleware in `src/auth/middleware.ts`. The `setSessionCookie()` call is likely missing the `secure` flag for enterprise subdomains. Also verify the OTP validation flow in `src/api/auth/verify-otp.ts` — the `userId` binding may be dropping the enterprise tenant ID.",
  acceptanceCriteria: [
    "Enterprise users with 2FA can log in successfully",
    "OTP verification passes and session is persisted",
    "No regression for standard login flow",
    "Unit tests updated for auth middleware",
  ],
  codeRefs: [
    { filePath: "src/auth/middleware.ts", functionName: "setSessionCookie", lineStart: 142, lineEnd: 158 },
    { filePath: "src/api/auth/verify-otp.ts", functionName: "verifyOtp", lineStart: 67, lineEnd: 89 },
    { filePath: "src/services/enterprise.ts", functionName: "getTenantId", lineStart: 23 },
  ],
  sourceTicketId: "FD-8821",
  customer: "Acme Corp",
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function DevSpecPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const spec = { ...MOCK_SPEC, id };

  const cloneCmd = `git checkout -b ${spec.branchName}`;
  const claudeCmd = `claude "Implement this ticket: ${spec.title}. Branch: ${spec.branchName}. See spec at ${typeof window !== "undefined" ? window.location.href : ""}"`;
  const vscodeCmd = `code --goto ${spec.codeRefs[0]?.filePath ?? "."}`;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #FAFAFE 0%, #F4F2FC 100%)" }}>
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
              <Zap className="size-3.5 text-white" />
            </span>
            <span className="text-sm font-semibold">PM Agent</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Assigned to</span>
            <span className="font-semibold text-foreground">{spec.assigneeName}</span>
            <span>·</span>
            <span className="font-mono bg-muted/60 px-2 py-0.5 rounded">{spec.externalId}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Title + status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono">{spec.externalId}</Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 capitalize">{spec.classification.replace("_", " ")}</Badge>
            <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">Scope {spec.scope}</Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle2 className="size-3" /> Approved by PM
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{spec.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{spec.description}</p>
        </div>

        {/* Open in IDE — main CTA */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
            <Terminal className="size-4 text-primary" />
            <p className="text-sm font-semibold">Open in your IDE</p>
          </div>
          <div className="p-5 space-y-3">
            {/* VS Code */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <FileCode2 className="size-5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">VS Code</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{vscodeCmd}</p>
              </div>
              <CopyBtn text={vscodeCmd} />
              <a
                href={`vscode://file/${spec.codeRefs[0]?.filePath ?? ""}`}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Open <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Cursor */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <Sparkles className="size-5 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Cursor</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{`cursor ${spec.codeRefs[0]?.filePath ?? "."}`}</p>
              </div>
              <CopyBtn text={`cursor ${spec.codeRefs[0]?.filePath ?? "."}`} />
              <a
                href={`cursor://file/${spec.codeRefs[0]?.filePath ?? ""}`}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
              >
                Open <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Claude Code */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <Zap className="size-5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Claude Code</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{claudeCmd}</p>
              </div>
              <CopyBtn text={claudeCmd} />
              <a
                href={`claude-code://task?spec=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                Open <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Git branch */}
            <div className="flex items-center gap-3 rounded-xl border bg-emerald-50 border-emerald-200 px-4 py-3">
              <GitBranch className="size-4 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Start on branch</p>
                <p className="text-sm font-mono font-semibold text-emerald-700">{spec.branchName}</p>
              </div>
              <CopyBtn text={cloneCmd} />
              <span className="font-mono text-xs bg-white border border-emerald-200 rounded-lg px-2 py-1 text-emerald-700">{cloneCmd}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Acceptance criteria */}
          <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" /> Acceptance Criteria
            </p>
            <ul className="space-y-2">
              {spec.acceptanceCriteria.map((ac, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="size-3.5 mt-0.5 shrink-0 text-primary/60" />
                  {ac}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested approach */}
          <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-violet-500" /> Suggested Approach
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{spec.suggestedApproach}</p>
          </div>
        </div>

        {/* Code refs */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Code2 className="size-4 text-blue-500" /> Relevant Files
          </p>
          <div className="space-y-2">
            {spec.codeRefs.map((ref, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-2.5">
                <FileCode2 className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium">{ref.filePath}</p>
                  <p className="text-xs text-muted-foreground">
                    {ref.functionName && <span className="mr-2">fn: {ref.functionName}</span>}
                    {ref.lineStart && <span>L{ref.lineStart}{ref.lineEnd ? `–${ref.lineEnd}` : ""}</span>}
                  </p>
                </div>
                <CopyBtn text={ref.filePath} />
                <a
                  href={`vscode://file/${ref.filePath}:${ref.lineStart ?? 1}`}
                  className={cn(
                    "text-[11px] font-medium text-blue-600 hover:underline"
                  )}
                >
                  Open ↗
                </a>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Source ticket {spec.sourceTicketId} · {spec.customer} · Approved via PM Agent
        </p>
      </div>
    </div>
  );
}
