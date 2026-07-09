"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_SOURCE_ACCOUNTS } from "@/lib/constants/onboarding-sources";
import { cn } from "@/lib/utils";

type ConnectPhase = "form" | "connecting" | "success";

interface ConnectProviderDialogProps {
  open: boolean;
  providerId: string;
  providerName: string;
  Logo: React.ComponentType<{ className?: string }>;
  onClose: () => void;
  onConnected: (accountLabel: string) => Promise<void>;
}

export function ConnectProviderDialog({
  open,
  providerId,
  providerName,
  Logo,
  onClose,
  onConnected,
}: ConnectProviderDialogProps) {
  const [phase, setPhase] = useState<ConnectPhase>("form");
  const [account, setAccount] = useState(MOCK_SOURCE_ACCOUNTS[providerId] ?? "");

  useEffect(() => {
    if (open) {
      setPhase("form");
      setAccount(MOCK_SOURCE_ACCOUNTS[providerId] ?? "");
    }
  }, [open, providerId]);

  const handleAuthorize = async () => {
    setPhase("connecting");
    await new Promise((r) => setTimeout(r, 1400));
    await onConnected(account.trim() || providerName);
    setPhase("success");
    await new Promise((r) => setTimeout(r, 700));
    onClose();
  };

  const isEmail = providerId === "email";
  const isWebhook = providerId === "webhook";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && phase !== "connecting" && onClose()}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <div className="border-b bg-muted/30 px-6 py-5">
          <DialogHeader className="text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl border bg-white shadow-sm">
                <Logo className="size-8" />
              </div>
              <div>
                <DialogTitle className="text-base">Connect {providerName}</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Demo connection — no real OAuth required
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          {phase === "form" && (
            <>
              {!isWebhook && (
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-xs">
                    {isEmail ? "Support inbox" : "Workspace URL"}
                  </Label>
                  <Input
                    id="account"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder={isEmail ? "support@company.com" : "company.zendesk.com"}
                    className="h-9 text-sm"
                  />
                </div>
              )}
              {isWebhook && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After connecting, copy your PM Agent webhook URL and point any HTTP source at it.
                </p>
              )}
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2.5">
                <Shield className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                <p className="text-xs leading-relaxed text-emerald-800">
                  Read-only access to tickets. PM Agent never modifies your source system.
                </p>
              </div>
            </>
          )}

          {phase === "connecting" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Authorizing with {providerName}…</p>
              <p className="text-xs text-muted-foreground">Syncing ticket fields and webhooks</p>
            </div>
          )}

          {phase === "success" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <p className="text-sm font-semibold">{providerName} connected</p>
              <p className="text-xs text-muted-foreground">{account || providerName}</p>
            </div>
          )}
        </div>

        {phase === "form" && (
          <DialogFooter className="border-t bg-muted/20 px-6 py-4 gap-2 sm:gap-2">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={() => void handleAuthorize()} className={cn("min-w-28")}>
              Authorize
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
