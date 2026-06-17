"use client";

import { useState } from "react";
import { Check, GitBranch, Loader2, ShieldCheck } from "lucide-react";

import { BitbucketLogo, GitHubLogo } from "@/components/shared/BrandLogos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { cn } from "@/lib/utils";

const REPO_PROVIDERS = [
  { id: "github", name: "GitHub", Logo: GitHubLogo, desc: "GitHub.com and Enterprise" },
  { id: "bitbucket", name: "Bitbucket", Logo: BitbucketLogo, desc: "Bitbucket Cloud and Data Center" },
];

export function StepConnectRepo() {
  const {
    repoProvider,
    repoProviderStatus,
    selectedRepos,
    availableRepos,
    connectRepo,
    toggleRepo,
    setStep,
  } = useOnboardingStore();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    if (repoProvider === id && repoProviderStatus === "connected") return;
    setConnecting(id);
    await connectRepo(id);
    setConnecting(null);
  };

  const SelectedProviderLogo = REPO_PROVIDERS.find((provider) => provider.id === repoProvider)?.Logo ?? GitBranch;

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-8 pb-6 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Where does your code live?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect your repository so the agent can map tickets to code.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REPO_PROVIDERS.map(({ id, name, Logo, desc }) => {
            const isConnected = repoProvider === id && repoProviderStatus === "connected";
            const isConnecting = connecting === id;
            const isDisabled = !isConnected && !isConnecting && repoProvider !== null && repoProvider !== id;

            return (
              <button
                key={id}
                disabled={isConnecting || isDisabled}
                onClick={() => handleConnect(id)}
                className={cn(
                  "group relative flex items-center gap-4 rounded-2xl border-2 bg-white p-5 text-left transition-all duration-150",
                  isConnected
                    ? "border-primary bg-primary/[0.03] shadow-sm"
                    : isConnecting
                      ? "border-muted-foreground/20 bg-muted/20 cursor-wait"
                      : isDisabled
                        ? "border-border bg-muted/10 opacity-40 cursor-not-allowed"
                        : "border-border hover:border-primary/40 hover:shadow-sm"
                )}
              >
                {isConnected && (
                  <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary shadow-sm">
                    <Check className="size-3 text-white" strokeWidth={2.5} />
                  </span>
                )}

                <div className="relative flex size-14 shrink-0 items-center justify-center">
                  <Logo className="size-12 transition-transform duration-150 group-hover:scale-105" />
                  {isConnecting && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/85">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn("text-base font-semibold", isConnected ? "text-primary" : "text-foreground")}>
                    {name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {repoProviderStatus === "connected" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Select repositories to index</p>
              <span className="text-xs text-muted-foreground">{selectedRepos.length} selected</span>
            </div>
            <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
              {availableRepos.map((repo) => (
                <label
                  key={repo}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:bg-muted/20"
                >
                  <Checkbox checked={selectedRepos.includes(repo)} onCheckedChange={() => toggleRepo(repo)} />
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <SelectedProviderLogo className="size-4 shrink-0" />
                    <span className="truncate font-mono text-sm">{repo}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-500" />
              <p className="text-xs leading-relaxed text-blue-700">
                We index the structure, functions, routes, and models.{" "}
                <strong>We do not store your source code</strong> - we create a semantic map only.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-4">
        <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">
          Back
        </Button>
        <Button
          onClick={() => setStep(3)}
          disabled={repoProviderStatus !== "connected" || selectedRepos.length === 0}
          className="min-w-28 gap-2"
        >
          Continue
          <span className="text-xs opacity-60">-&gt;</span>
        </Button>
      </div>
    </div>
  );
}
