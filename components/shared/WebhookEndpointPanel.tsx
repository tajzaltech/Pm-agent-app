"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getIngestWebhookUrl, getSourceWebhookUrl } from "@/lib/config";
import { getSession } from "@/lib/api-client/session";
import { api, messageFromUnknown } from "@/lib/api-client";
import { useTicketStore } from "@/lib/store/tickets";

interface WebhookEndpointPanelProps {
  title: string;
  description?: string;
  steps?: string[];
  icon?: React.ReactNode;
  provider?: string;
}

export function WebhookEndpointPanel({ title, description, steps, icon, provider = "webhook" }: WebhookEndpointPanelProps) {
  const [copied, setCopied] = useState<"url" | "secret" | null>(null);
  const [secret, setSecret] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const workspaceId = getSession().workspaceId;
  const url = useMemo(() => {
    if (!workspaceId) return "";
    return provider === "webhook" ? getIngestWebhookUrl(workspaceId) : getSourceWebhookUrl(provider, workspaceId);
  }, [workspaceId, provider]);

  useEffect(() => {
    void api.getIngestSettings().then((s) => setSecret(s.secret)).catch(() => undefined);
  }, []);

  const copy = async (value: string, kind: "url" | "secret") => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendTest = async () => {
    setSending(true);
    try {
      const ticket = await api.ingestTicket({
        subject: "Checkout retry creates duplicate charges",
        body: "A customer reports that retrying a failed payment creates a second charge. They expect a single payment intent.",
        customerName: "Test customer",
        customerEmail: "customer@example.com",
        provider,
      });
      useTicketStore.setState((s) => ({
        tickets: [ticket, ...s.tickets.filter((t) => t.id !== ticket.id)],
      }));
      toast.success("Test ticket landed in Pipeline");
    } catch {
      toast.error("Could not ingest a test ticket. Is the API running?");
    }
    setSending(false);
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const result = await api.syncSource(provider);
      toast.success(`Imported ${result.imported} ticket${result.imported === 1 ? "" : "s"} (${result.skipped} skipped)`);
    } catch (error) {
      toast.error(messageFromUnknown(error, "Could not sync this source"));
    }
    setSyncing(false);
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border bg-white px-3 py-2.5 font-mono text-xs text-slate-600 shadow-sm">
          {url || "Sign in to get your ingest URL"}
        </code>
        <Button size="sm" variant="outline" className="h-9 shrink-0 gap-1.5 bg-white" onClick={() => void copy(url, "url")} disabled={!url}>
          <Copy className="size-3.5" />
          {copied === "url" ? "Copied" : "Copy"}
        </Button>
      </div>
      {secret ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border bg-white px-3 py-2.5 font-mono text-xs text-slate-600 shadow-sm">
            X-Pm-Agent-Secret: {secret}
          </code>
          <Button size="sm" variant="outline" className="h-9 shrink-0 gap-1.5 bg-white" onClick={() => void copy(secret, "secret")}>
            {copied === "secret" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            Secret
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {provider !== "webhook" && (
          <Button size="sm" variant="outline" onClick={() => void syncNow()} disabled={syncing}>
            {syncing ? "Syncing…" : "Sync recent tickets"}
          </Button>
        )}
        <Button size="sm" onClick={() => void sendTest()} disabled={sending}>
          {sending ? "Sending…" : "Send a test ticket"}
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
