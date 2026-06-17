"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

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
import { useOnboardingStore } from "@/lib/store/onboarding";
import { cn } from "@/lib/utils";

const SOURCES = [
  { id: "freshdesk", name: "Freshdesk", Logo: FreshdeskLogo, desc: "Ticket and helpdesk" },
  { id: "zendesk", name: "Zendesk", Logo: ZendeskLogo, desc: "Support platform" },
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
  const { ticketSource, ticketSourceStatus, connectTicketSource, setStep } = useOnboardingStore();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    if (ticketSource === id && ticketSourceStatus === "connected") return;
    setConnecting(id);
    await connectTicketSource(id);
    setConnecting(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-8 pb-6 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Where do your customer tickets live?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect your ticket source so PM Agent can analyze new tickets automatically.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCES.map(({ id, name, Logo, desc }) => {
            const isConnected = ticketSource === id && ticketSourceStatus === "connected";
            const isConnecting = connecting === id;
            const isDisabled = !isConnected && !isConnecting && ticketSource !== null && ticketSource !== id;

            return (
              <button
                key={id}
                disabled={isConnecting || isDisabled}
                onClick={() => handleConnect(id)}
                className={cn(
                  "group relative min-h-40 rounded-2xl border-2 bg-white p-5 text-center transition-all duration-150",
                  "flex flex-col items-center justify-center gap-4",
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

                <div className="relative flex size-14 items-center justify-center">
                  <Logo className="size-12 transition-transform duration-150 group-hover:scale-105" />
                  {isConnecting && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/85">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </span>
                  )}
                </div>

                <div>
                  <p className={cn("text-base font-semibold leading-tight", isConnected ? "text-primary" : "text-foreground")}>
                    {name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {ticketSource === "freshdesk" && ticketSourceStatus === "connected" && (
          <WebhookEndpointPanel
            title="Configure Freshdesk webhook"
            description="After OAuth, add this webhook to Freshdesk so new tickets are sent to PM Agent automatically."
            steps={FRESHDESK_WEBHOOK_STEPS}
            icon={<FreshdeskLogo className="size-5" />}
          />
        )}

        {ticketSource === "webhook" && ticketSourceStatus === "connected" && (
          <WebhookEndpointPanel
            title="Your webhook endpoint"
            description="Send ticket payloads to this URL from any system that supports outbound webhooks."
            icon={<WebhookLogo className="size-5" />}
          />
        )}

        {ticketSourceStatus === "error" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            Connection failed.
            <button className="ml-0.5 font-medium underline" onClick={() => ticketSource && handleConnect(ticketSource)}>
              Try again
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-4">
        <p className="text-xs text-muted-foreground">
          {ticketSourceStatus === "connected"
            ? `${SOURCES.find((source) => source.id === ticketSource)?.name} connected`
            : "Select a ticket source to continue"}
        </p>
        <Button onClick={() => setStep(2)} disabled={ticketSourceStatus !== "connected"} className="min-w-28 gap-2">
          Continue
          <span className="text-xs opacity-60">-&gt;</span>
        </Button>
      </div>
    </div>
  );
}
