"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Plus, Settings2, Trash2, X, Zap } from "lucide-react";

import { ProductDocsManager } from "@/components/shared/ProductDocsManager";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutomationStore, PRESET_LABELS } from "@/lib/store/automation";
import { useTicketStore } from "@/lib/store/tickets";
import { logAudit } from "@/lib/store/audit";
import type { AutoAcceptRule, AutomationPreset, Classification, Scope } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDispatchStore, AGENT_LABELS } from "@/lib/store/dispatch";
import { useDeliveryStore, TOOL_LABELS } from "@/lib/store/delivery";

export default function AutomationPage() {
  const {
    preset,
    autoClassify,
    scopeEstimation,
    autoDispatch,
    autoAcceptRules,
    setPreset,
    setAutoClassify,
    setScopeEstimation,
    setAutoDispatch,
    addRule,
    removeRule,
    toggleRule,
    previewRule,
  } = useAutomationStore();
  const { tickets } = useTicketStore();
  const dispatchConfig = useDispatchStore((s) => s.config);
  const deliveryConfig = useDeliveryStore((s) => s.config);
  const [previewRuleId, setPreviewRuleId] = useState<string | null>(null);

  const previewMatches = previewRuleId
    ? previewRule(autoAcceptRules.find((r) => r.id === previewRuleId)!, tickets)
    : [];

  const applyPreset = (p: AutomationPreset) => {
    setPreset(p);
    logAudit("preset_applied", `Applied ${PRESET_LABELS[p].label} automation preset`, { actor: "You" });
    toast.success(`${PRESET_LABELS[p].label} preset applied`);
  };

  const addNewRule = () => {
    const rule: AutoAcceptRule = {
      id: `rule_${Date.now()}`,
      classification: "question",
      scope: "S",
      enabled: false,
    };
    addRule(rule);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center shrink-0">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Automation Studio</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Presets, rules, delivery & agents</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-8">
        {/* Presets */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Automation Presets</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(PRESET_LABELS) as AutomationPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all hover:border-primary/40",
                  preset === p ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "bg-white"
                )}
              >
                <p className="text-sm font-semibold">{PRESET_LABELS[p].label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{PRESET_LABELS[p].description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Toggles */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold">Agent behavior</h2>
          {[
            { label: "Auto-classify tickets", value: autoClassify, onChange: setAutoClassify },
            { label: "Scope estimation", value: scopeEstimation, onChange: setScopeEstimation },
            { label: "Auto-dispatch to dev agent", value: autoDispatch, onChange: setAutoDispatch },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <Switch checked={value} onCheckedChange={onChange} />
            </div>
          ))}
        </section>

        {/* Rule builder */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Auto-Accept Rules</h2>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addNewRule}>
              <Plus className="size-3.5" /> Add rule
            </Button>
          </div>
          <div className="space-y-2">
            {autoAcceptRules.map((rule) => (
              <RuleBlock
                key={rule.id}
                rule={rule}
                onToggle={() => toggleRule(rule.id)}
                onRemove={() => removeRule(rule.id)}
                onPreview={() => setPreviewRuleId(previewRuleId === rule.id ? null : rule.id)}
                isPreviewing={previewRuleId === rule.id}
              />
            ))}
          </div>
          {previewRuleId && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1"><Eye className="size-3.5" /> Preview — last 20 matching tickets</p>
              {previewMatches.length === 0 ? (
                <p className="text-xs text-muted-foreground">No pending tickets would match this rule.</p>
              ) : (
                previewMatches.map((t) => (
                  <p key={t.id} className="text-xs truncate">{t.draftTitle}</p>
                ))
              )}
            </div>
          )}
        </section>

        {/* Sub-pages */}
        <Tabs defaultValue="delivery" className="space-y-4">
          <TabsList className="h-9 flex-wrap">
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="agents">Dev Agents</TabsTrigger>
            <TabsTrigger value="docs">Product Docs</TabsTrigger>
          </TabsList>
          <TabsContent value="delivery" className="rounded-xl border bg-white p-5 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2"><Settings2 className="size-4" /> Delivery configuration</p>
            <p className="text-xs text-muted-foreground">
              Default tool: <strong>{TOOL_LABELS[deliveryConfig.defaultTool]}</strong> · Auto-deliver: {deliveryConfig.autoDeliver ? "On" : "Off"}
            </p>
            <Link href="/pipeline"><Button variant="outline" size="sm" className="h-8 text-xs mt-2">View Pipeline Tracker →</Button></Link>
          </TabsContent>
          <TabsContent value="agents" className="rounded-xl border bg-white p-5 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2"><Zap className="size-4" /> Dev agent dispatch</p>
            <p className="text-xs text-muted-foreground">
              Agent: <strong>{AGENT_LABELS[dispatchConfig.agentType]}</strong> · Enabled: {dispatchConfig.enabled ? "Yes" : "No"}
            </p>
          </TabsContent>
          <TabsContent value="docs" className="rounded-xl border bg-white p-5">
            <ProductDocsManager variant="settings" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RuleBlock({
  rule,
  onToggle,
  onRemove,
  onPreview,
  isPreviewing,
}: {
  rule: AutoAcceptRule;
  onToggle: () => void;
  onRemove: () => void;
  onPreview: () => void;
  isPreviewing: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/20 text-sm">
      <Switch checked={rule.enabled} onCheckedChange={onToggle} />
      <span className="text-muted-foreground text-xs">If</span>
      <span className="font-medium">{rule.classification === "any" ? "any type" : rule.classification}</span>
      <span className="text-muted-foreground text-xs">+</span>
      <span className="font-medium">{rule.scope === "any" ? "any scope" : rule.scope}</span>
      <span className="text-muted-foreground text-xs">→ auto-accept</span>
      <div className="ml-auto flex gap-1">
        <Button size="sm" variant={isPreviewing ? "default" : "outline"} className="h-7 text-xs" onClick={onPreview}>
          <Eye className="size-3" /> Preview
        </Button>
        <Button size="icon" variant="ghost" className="size-7" onClick={onRemove}><Trash2 className="size-3.5" /></Button>
      </div>
    </div>
  );
}
