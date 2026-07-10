"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Lightning,
  Plus,
  Trash,
  Eye,
  Robot,
  ArrowsClockwise,
  Gauge,
  ShieldCheck,
  Scales,
  RocketLaunch,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAutomationStore, PRESET_LABELS } from "@/lib/store/automation";
import { useTicketStore } from "@/lib/store/tickets";
import { logAudit } from "@/lib/store/audit";
import type { AutoAcceptRule, AutomationPreset } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESET_ICONS: Record<string, typeof ShieldCheck> = {
  conservative: ShieldCheck,
  balanced: Scales,
  aggressive: RocketLaunch,
};

export default function AutomationPage({ embedded = false }: { embedded?: boolean }) {
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
    addRule({
      id: `rule_${Date.now()}`,
      classification: "question",
      scope: "S",
      enabled: false,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className={cn("max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-6", embedded && "pt-3")}>

        {/* Presets */}
        <section className="space-y-3">
          <div>
            <h2 className="text-[13px] font-semibold">Workflow Presets</h2>
            <p className="text-[11px] text-muted-foreground">Choose how aggressively the agent auto-processes tickets</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(PRESET_LABELS) as AutomationPreset[]).map((p) => {
              const isActive = preset === p;
              const Icon = PRESET_ICONS[p] ?? Lightning;
              return (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all hover:shadow-sm",
                    isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "bg-card hover:border-primary/20"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "flex size-7 items-center justify-center rounded-lg",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon size={15} weight={isActive ? "fill" : "regular"} />
                    </div>
                    <p className={cn("text-[13px] font-semibold", isActive && "text-primary")}>
                      {PRESET_LABELS[p].label}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {PRESET_LABELS[p].description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Agent behavior */}
        <section className="rounded-xl border bg-card divide-y">
          <div className="px-4 py-3">
            <h2 className="text-[13px] font-semibold flex items-center gap-2">
              <Robot size={15} weight="duotone" className="text-primary" />
              Agent Behavior
            </h2>
          </div>
          {[
            { label: "Auto-classify tickets", desc: "Automatically assign classification and priority", value: autoClassify, onChange: setAutoClassify },
            { label: "Scope estimation", desc: "Estimate effort and affected files", value: scopeEstimation, onChange: setScopeEstimation },
            { label: "Auto-dispatch to dev", desc: "Send accepted tickets directly to dev agents", value: autoDispatch, onChange: setAutoDispatch },
          ].map(({ label, desc, value, onChange }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[13px] font-medium">{label}</p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={value} onCheckedChange={onChange} />
            </div>
          ))}
        </section>

        {/* Rules */}
        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <h2 className="text-[13px] font-semibold flex items-center gap-2">
                <Gauge size={15} weight="duotone" className="text-primary" />
                Auto-Accept Rules
              </h2>
              <p className="text-[11px] text-muted-foreground">Tickets matching these rules skip manual review</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={addNewRule}>
              <Plus size={12} /> Add rule
            </Button>
          </div>

          <div className="divide-y">
            {autoAcceptRules.length === 0 && (
              <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                No rules configured. Add one to auto-accept tickets by type and scope.
              </p>
            )}
            {autoAcceptRules.map((rule) => (
              <div key={rule.id} className="flex flex-wrap items-center gap-2.5 px-4 py-3">
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                <div className="flex items-center gap-1.5 text-[12px]">
                  <span className="text-muted-foreground">If</span>
                  <span className="rounded-md border bg-muted/40 px-2 py-0.5 font-medium">
                    {rule.classification === "any" ? "any type" : rule.classification}
                  </span>
                  <span className="text-muted-foreground">+</span>
                  <span className="rounded-md border bg-muted/40 px-2 py-0.5 font-medium">
                    {rule.scope === "any" ? "any scope" : `scope ${rule.scope}`}
                  </span>
                  <span className="text-muted-foreground">then auto-accept</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={previewRuleId === rule.id ? "default" : "ghost"}
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={() => setPreviewRuleId(previewRuleId === rule.id ? null : rule.id)}
                  >
                    <Eye size={11} /> Preview
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 text-muted-foreground hover:text-red-500"
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {previewRuleId && (
            <div className="border-t bg-muted/10 px-4 py-3 space-y-1.5">
              <p className="text-[11px] font-semibold flex items-center gap-1.5">
                <Eye size={12} /> Preview — matching pending tickets
              </p>
              {previewMatches.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No pending tickets match this rule.</p>
              ) : (
                previewMatches.map((t) => (
                  <p key={t.id} className="text-[11px] truncate text-muted-foreground">
                    {t.draftTitle}
                  </p>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
