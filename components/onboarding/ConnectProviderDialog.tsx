"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

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
import { messageFromUnknown } from "@/lib/api-client";
import { SOURCE_FIELDS, SOURCE_HELP, type SourceCredentials, type SourceFieldName } from "@/lib/constants/source-connect";
import { cn } from "@/lib/utils";

interface ConnectProviderDialogProps {
  open: boolean;
  providerId: string;
  providerName: string;
  Logo: React.ComponentType<{ className?: string }>;
  onClose: () => void;
  onConnected: (creds: SourceCredentials) => Promise<void>;
}

const EMPTY: Record<SourceFieldName, string> = {
  domain: "",
  apiKey: "",
  email: "",
  password: "",
  imapHost: "",
  spreadsheetId: "",
  sheetName: "",
  instanceUrl: "",
  clientId: "",
  clientSecret: "",
  securityToken: "",
};

export function ConnectProviderDialog({
  open,
  providerId,
  providerName,
  Logo,
  onClose,
  onConnected,
}: ConnectProviderDialogProps) {
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const fields = SOURCE_FIELDS[providerId] ?? [];
  const isWebhook = providerId === "webhook";

  useEffect(() => {
    if (open) {
      setPending(false);
      setValues({
        ...EMPTY,
        imapHost: providerId === "email" ? "imap.gmail.com" : "",
        sheetName: providerId === "sheets" ? "Sheet1" : "",
        instanceUrl: providerId === "salesforce" ? "https://login.salesforce.com" : "",
      });
    }
  }, [open, providerId]);

  const handleConnect = async () => {
    const missing = fields.find((field) => field.required && !values[field.name].trim());
    if (missing) {
      toast.error(`Enter ${missing.label.toLowerCase()}`);
      return;
    }
    setPending(true);
    try {
      await onConnected({
        domain: values.domain.trim() || undefined,
        apiKey: values.apiKey.trim() || undefined,
        email: values.email.trim() || undefined,
        password: values.password || undefined,
        imapHost: values.imapHost.trim() || undefined,
        spreadsheetId: values.spreadsheetId.trim() || undefined,
        sheetName: values.sheetName.trim() || undefined,
        instanceUrl: values.instanceUrl.trim() || undefined,
        clientId: values.clientId.trim() || undefined,
        clientSecret: values.clientSecret || undefined,
        securityToken: values.securityToken.trim() || undefined,
      });
      onClose();
    } catch (error) {
      toast.error(messageFromUnknown(error, `Could not connect ${providerName}`));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !pending && onClose()}>
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
                  {SOURCE_HELP[providerId] ?? "Connect this source to your workspace."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {pending ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Verifying {providerName}…</p>
              <p className="text-xs text-muted-foreground">Importing recent tickets if credentials work</p>
            </div>
          ) : (
            <>
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="text-xs">
                    {field.label}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type ?? "text"}
                    value={values[field.name]}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    className="h-9 text-sm"
                    autoComplete="off"
                  />
                </div>
              ))}
              {isWebhook && (
                <p className="text-sm text-muted-foreground leading-relaxed">{SOURCE_HELP.webhook}</p>
              )}
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2.5">
                <Shield className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                <p className="text-xs leading-relaxed text-emerald-800">
                  Keys stay on the server. Ask PM only reads tickets; it does not change your source system.
                </p>
              </div>
            </>
          )}
        </div>

        {!pending && (
          <DialogFooter className="border-t bg-muted/20 px-6 py-4 gap-2 sm:gap-2">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={() => void handleConnect()} className={cn("min-w-28")}>
              {isWebhook ? "Create endpoint" : "Connect and import"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
