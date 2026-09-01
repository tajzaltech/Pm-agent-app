"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";

import { BitbucketLogo, GitHubLogo } from "@/components/shared/BrandLogos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { cn } from "@/lib/utils";

const REPO_PROVIDERS = [
  { id: "github", name: "GitHub", Logo: GitHubLogo, desc: "Index a public or private GitHub repo" },
  { id: "bitbucket", name: "Bitbucket", Logo: BitbucketLogo, desc: "Coming soon — use GitHub for indexing" },
];

export function StepConnectRepo() {
  const { repoProvider, repoProviderStatus, selectedRepos, connectRepo, setStep } = useOnboardingStore();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [fullName, setFullName] = useState(selectedRepos[0] ?? "");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    if (id !== "github") return;
    const repo = fullName.trim();
    if (!repo.includes("/")) {
      setError("Use owner/repo, for example facebook/react");
      return;
    }
    setError(null);
    setConnecting(id);
    try {
      await connectRepo(id, [repo], token.trim() || undefined);
    } catch {
      setError("Could not index that repository. Check the name and token, then retry.");
    }
    setConnecting(null);
  };

  const isConnected = repoProvider === "github" && repoProviderStatus === "connected";

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-8 pb-6 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Where does your code live?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect a GitHub repository so Ask PM can retrieve real files when drafting tickets.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REPO_PROVIDERS.map(({ id, name, Logo, desc }) => {
            const connected = id === "github" && isConnected;
            const isConnecting = connecting === id;
            return (
              <div
                key={id}
                className={cn(
                  "relative flex items-center gap-4 rounded-2xl border-2 bg-white p-5",
                  connected ? "border-primary bg-primary/[0.03]" : "border-border"
                )}
              >
                {connected && (
                  <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary">
                    <Check className="size-3 text-white" strokeWidth={2.5} />
                  </span>
                )}
                <Logo className="size-12 shrink-0" />
                <div>
                  <p className="text-base font-semibold">{name}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                {isConnecting && <Loader2 className="ml-auto size-5 animate-spin text-primary" />}
              </div>
            );
          })}
        </div>

        <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="repo" className="text-xs">
              GitHub repository
            </Label>
            <Input
              id="repo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="owner/repo"
              className="h-9 bg-white font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pat" className="text-xs">
              Personal access token (required for private repos)
            </Label>
            <Input
              id="pat"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_… or ghp_…"
              className="h-9 bg-white font-mono text-sm"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={() => void handleConnect("github")} disabled={!!connecting} className="gap-2">
            {connecting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isConnected ? "Re-index repository" : "Connect and index"}
          </Button>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-500" />
          <p className="text-xs leading-relaxed text-blue-700">
            We fetch source files, embed chunks, and store short snippets for retrieval. Tokens stay on the server
            and are never returned to the browser after save.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-4">
        <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">
          Back
        </Button>
        <Button onClick={() => setStep(3)} disabled={!isConnected} className="min-w-28 gap-2">
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
