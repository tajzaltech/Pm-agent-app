"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Check, Loader2, Mail, Unplug, X } from "lucide-react";

import { ConnectProviderDialog } from "@/components/onboarding/ConnectProviderDialog";
import {
  FreshdeskLogo,
  GoogleSheetsLogo,
  JiraLogo,
  SalesforceLogo,
  WebhookLogo,
  ZendeskLogo,
} from "@/components/shared/BrandLogos";
import { WebhookEndpointPanel } from "@/components/shared/WebhookEndpointPanel";
import { Button } from "@/components/ui/button";
import { ISSUE_CATEGORY_OPTIONS } from "@/lib/constants/onboarding-sources";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { cn } from "@/lib/utils";

const SOURCES = [
  { id: "freshdesk", name: "Freshdesk", Logo: FreshdeskLogo, desc: "Ticket and helpdesk" },
  { id: "zendesk", name: "Zendesk", Logo: ZendeskLogo, desc: "Support platform" },
  { id: "email", name: "Email", Logo: Mail, desc: "Forward shared support inbox" },
  { id: "jira_sm", name: "Jira Service Mgmt", Logo: JiraLogo, desc: "IT service desk" },
  { id: "salesforce", name: "Salesforce", Logo: SalesforceLogo, desc: "CRM and service cloud" },
  { id: "sheets", name: "Google Sheets", Logo: GoogleSheetsLogo, desc: "Spreadsheet import" },
  { id: "webhook", name: "Custom Webhook", Logo: WebhookLogo, desc: "Any HTTP source" },
];

const FRESHDESK_WEBHOOK_STEPS = [
  "In Freshdesk, go to Admin → Workflows → Automations → Ticket creation.",
  "Create a rule for new tickets and add a webhook action.",
  "Paste the PM Agent webhook URL below and save the automation.",
  "Create a test ticket to confirm drafts appear in your queue.",
];

export function StepConnectSource() {
  const {
    ticketSources,
    connectTicketSource,
    disconnectTicketSource,
    toggleSourceIssueCategory,
    setStep,
  } = useOnboardingStore();

  const [dialogProvider, setDialogProvider] = useState<string | null>(null);
  const [activeConfig, setActiveConfig] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const connected = ticketSources.filter((s) => s.status === "connected");
  const hasError = ticketSources.some((s) => s.status === "error");
  const configProvider = activeConfig ?? connected[0]?.provider ?? null;
  const configSource = ticketSources.find((s) => s.provider === configProvider);

  const canContinue = useMemo(
    () =>
      connected.length > 0 &&
      connected.every((s) => s.issueCategories.length > 0),
    [connected]
  );

  const openConnect = (id: string) => {
    const existing = ticketSources.find((s) => s.provider === id);
    if (existing?.status === "connected") {
      setActiveConfig(id);
      return;
    }
    setDialogProvider(id);
  };

  const handleDialogConnected = async (accountLabel: string) => {
    if (!dialogProvider) return;
    setConnecting(dialogProvider);
    await connectTicketSource(dialogProvider, accountLabel);
    setActiveConfig(dialogProvider);
    setConnecting(null);
  };

  const dialogMeta = SOURCES.find((s) => s.id === dialogProvider);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-8 pb-6 pt-8">
          <h1 className="text-2xl font-bold tracking-tight">Where do your customer tickets live?</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Connect one or more ticket sources — PM Agent will analyze new tickets automatically.
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES.map(({ id, name, Logo, desc }) => {
              const src = ticketSources.find((s) => s.provider === id);
              const isConnected = src?.status === "connected";
              const isConnecting = connecting === id || src?.status === "connecting";

              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openConnect(id);
                    }
                  }}
                  onClick={() => openConnect(id)}
                  className={cn(
                    "group relative min-h-40 rounded-2xl border-2 bg-white p-5 text-center transition-all duration-150 cursor-pointer",
                    "flex flex-col items-center justify-center gap-4",
                    isConnected
                      ? cn(
                          "border-primary bg-primary/[0.03] shadow-sm",
                          configProvider === id && "ring-2 ring-primary/20"
                        )
                      : isConnecting
                        ? "border-muted-foreground/20 bg-muted/20 cursor-wait"
                        : "border-border hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  {isConnected && (
                    <>
                      <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary shadow-sm">
                        <Check className="size-3 text-white" strokeWidth={2.5} />
                      </span>
                      <button
                        type="button"
                        title="Disconnect"
                        onClick={(e) => {
                          e.stopPropagation();
                          disconnectTicketSource(id);
                          if (activeConfig === id) setActiveConfig(null);
                        }}
                        className="absolute left-3 top-3 flex size-6 items-center justify-center rounded-full border bg-white text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </>
                  )}

                  <div className="relative flex size-14 items-center justify-center">
                    <Logo className="size-12 transition-transform duration-150 group-hover:scale-105" />
                    {isConnecting && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/85">
                        <Loader2 className="size-5 animate-spin text-primary" />
                      </span>
                    )}
                  </div>

                  <div>
                    <p
                      className={cn(
                        "text-base font-semibold leading-tight",
                        isConnected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                    {isConnected && src?.accountLabel && (
                      <p className="mt-1.5 text-[10px] font-medium text-emerald-600 truncate max-w-[12rem] mx-auto">
                        {src.accountLabel}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {connected.some((s) => s.provider === "freshdesk") && (
            <WebhookEndpointPanel
              title="Configure Freshdesk webhook"
              description="Add this webhook in Freshdesk so new tickets sync to PM Agent automatically."
              steps={FRESHDESK_WEBHOOK_STEPS}
              icon={<FreshdeskLogo className="size-5" />}
            />
          )}

          {connected.some((s) => s.provider === "webhook") && (
            <WebhookEndpointPanel
              title="Your webhook endpoint"
              description="Send ticket payloads to this URL from any system that supports outbound webhooks."
              icon={<WebhookLogo className="size-5" />}
            />
          )}

          {connected.length > 0 && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Issue categories per source</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Each connected source can filter different ticket types for triage.
                </p>
              </div>

              {connected.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {connected.map(({ provider }) => {
                    const meta = SOURCES.find((s) => s.id === provider);
                    const active = configProvider === provider;
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setActiveConfig(provider)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        {meta?.Logo && <meta.Logo className="size-3.5" />}
                        {meta?.name ?? provider}
                      </button>
                    );
                  })}
                </div>
              )}

              {configSource && (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold mb-3 flex items-center gap-2">
                    {SOURCES.find((s) => s.id === configSource.provider)?.Logo && (
                      <span className="inline-flex">
                        {(() => {
                          const Logo = SOURCES.find((s) => s.id === configSource.provider)!.Logo;
                          return <Logo className="size-4" />;
                        })()}
                      </span>
                    )}
                    {SOURCES.find((s) => s.id === configSource.provider)?.name} — select categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ISSUE_CATEGORY_OPTIONS.map(({ id, label }) => {
                      const on = configSource.issueCategories.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleSourceIssueCategory(configSource.provider, id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            on
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-white hover:border-primary/40"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              One or more connections failed.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            {connected.length > 0 ? (
              <>
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {connected.length} source{connected.length === 1 ? "" : "s"} connected
                  {connected.length === 1 && connected[0].accountLabel
                    ? ` · ${connected[0].accountLabel}`
                    : ""}
                </span>
              </>
            ) : (
              <>
                <Unplug className="size-3.5 shrink-0" />
                Connect at least one ticket source
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setStep(2)} disabled={!canContinue} className="min-w-28 gap-2">
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {dialogMeta && (
        <ConnectProviderDialog
          open={!!dialogProvider}
          providerId={dialogMeta.id}
          providerName={dialogMeta.name}
          Logo={dialogMeta.Logo}
          onClose={() => setDialogProvider(null)}
          onConnected={handleDialogConnected}
        />
      )}
    </>
  );
}
