"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Lightning,
  Plus,
  Trash,
  Eye,
  Robot,
  Gauge,
  ShieldCheck,
  Scales,
  RocketLaunch,
  CaretDown,
  Check,
  PaperPlaneTilt,
  EnvelopeSimple,
  Warning,
  Tag,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAutomationStore, PRESET_LABELS } from "@/lib/store/automation";
import { useTicketStore } from "@/lib/store/tickets";
import { logAudit } from "@/lib/store/audit";
import type { AutoAcceptRule, AutomationPreset, Classification, Scope } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESET_ICONS: Record<string, typeof ShieldCheck> = {
  conservative: ShieldCheck,
  balanced: Scales,
  aggressive: RocketLaunch,
};

const CLASSIFICATION_OPTIONS: { value: Classification | "any"; label: string }[] = [
  { value: "any", label: "Any type" },
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature request" },
  { value: "question", label: "Question" },
  { value: "churn_signal", label: "Churn signal" },
];

const SCOPE_OPTIONS: { value: Scope | "any"; label: string }[] = [
  { value: "any", label: "Any scope" },
  { value: "S", label: "Small (S)" },
  { value: "M", label: "Medium (M)" },
  { value: "L", label: "Large (L)" },
];

const ACTION_OPTIONS: { value: string; label: string; icon: typeof PaperPlaneTilt; color: string }[] = [
  { value: "auto_accept", label: "Auto-accept & route to dev", icon: PaperPlaneTilt, color: "text-emerald-600" },
  { value: "auto_reply", label: "Auto-draft customer reply", icon: EnvelopeSimple, color: "text-blue-600" },
  { value: "escalate", label: "Escalate to PM", icon: Warning, color: "text-amber-600" },
  { value: "tag", label: "Tag & keep in pipeline", icon: Tag, color: "text-violet-600" },
];

const RULE_TEMPLATES: Omit<AutoAcceptRule, "id">[] = [
  { classification: "question", scope: "S", enabled: true, action: "auto_reply", label: "Auto-reply to simple questions" },
  { classification: "bug", scope: "S", enabled: true, action: "auto_accept", label: "Fast-track small bugs to dev" },
  { classification: "bug", scope: "L", enabled: true, action: "escalate", label: "Escalate large bugs to PM" },
  { classification: "feature_request", scope: "any", enabled: true, action: "tag", label: "Tag all feature requests" },
  { classification: "churn_signal", scope: "any", enabled: true, action: "escalate", label: "Escalate churn signals immediately" },
  { classification: "question", scope: "M", enabled: false, action: "auto_reply", label: "Draft replies for medium questions" },
];

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
  const [showTemplates, setShowTemplates] = useState(false);

  const previewMatches = previewRuleId
    ? previewRule(autoAcceptRules.find((r) => r.id === previewRuleId)!, tickets)
    : [];

  const applyPreset = (p: AutomationPreset) => {
    setPreset(p);
    logAudit("preset_applied", `Applied ${PRESET_LABELS[p].label} automation preset`, { actor: "You" });
    toast.success(`${PRESET_LABELS[p].label} preset applied`);
  };

  const addFromTemplate = (template: Omit<AutoAcceptRule, "id">) => {
    addRule({
      ...template,
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    });
    setShowTemplates(false);
    toast.success("Rule added");
  };

  const addBlankRule = () => {
    addRule({
      id: `rule_${Date.now()}`,
      classification: "any",
      scope: "any",
      enabled: true,
      action: "auto_accept",
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
                Automation Rules
              </h2>
              <p className="text-[11px] text-muted-foreground">Define what happens when tickets match specific criteria</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] gap-1"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <Plus size={12} /> Add rule <CaretDown size={10} />
                </Button>

                {showTemplates && (
                  <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-72 rounded-xl border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Rule templates
                    </p>
                    {RULE_TEMPLATES.map((template, i) => {
                      const actionMeta = ACTION_OPTIONS.find((a) => a.value === template.action) ?? ACTION_OPTIONS[0];
                      const ActionIcon = actionMeta.icon;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addFromTemplate(template)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60"
                        >
                          <ActionIcon size={14} className={actionMeta.color} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium">{template.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {template.classification === "any" ? "Any type" : template.classification}
                              {" · "}
                              {template.scope === "any" ? "Any scope" : `Scope ${template.scope}`}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    <div className="border-t mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => { addBlankRule(); setShowTemplates(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60"
                      >
                        <Plus size={14} className="text-muted-foreground" />
                        <p className="text-[12px] font-medium text-muted-foreground">Blank rule</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y">
            {autoAcceptRules.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Gauge size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-[13px] font-medium text-muted-foreground">No rules configured</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  Add rules to automate how tickets are processed based on type and scope
                </p>
              </div>
            )}
            {autoAcceptRules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                isPreview={previewRuleId === rule.id}
                onToggle={() => toggleRule(rule.id)}
                onPreview={() => setPreviewRuleId(previewRuleId === rule.id ? null : rule.id)}
                onRemove={() => { removeRule(rule.id); toast("Rule removed"); }}
                onUpdate={(updates) => {
                  useAutomationStore.getState().setRules(
                    autoAcceptRules.map((r) => (r.id === rule.id ? { ...r, ...updates } : r))
                  );
                }}
              />
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
                  <div key={t.id} className="flex items-center gap-2 py-1">
                    <Check size={10} weight="bold" className="text-emerald-500 shrink-0" />
                    <p className="text-[11px] truncate text-muted-foreground">{t.draftTitle}</p>
                    <span className="ml-auto shrink-0 rounded-md bg-muted/50 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                      {t.classification} · {t.scope}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─── Rule row with inline config ─── */

function RuleRow({
  rule,
  isPreview,
  onToggle,
  onPreview,
  onRemove,
  onUpdate,
}: {
  rule: AutoAcceptRule;
  isPreview: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<AutoAcceptRule>) => void;
}) {
  const actionMeta = ACTION_OPTIONS.find((a) => a.value === (rule.action ?? "auto_accept")) ?? ACTION_OPTIONS[0];
  const ActionIcon = actionMeta.icon;

  return (
    <div className={cn("px-4 py-3 transition-colors", !rule.enabled && "opacity-50")}>
      {rule.label && (
        <p className="text-[11px] font-medium text-muted-foreground mb-2">{rule.label}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Switch checked={rule.enabled} onCheckedChange={onToggle} />

        <span className="text-[12px] text-muted-foreground font-medium">When</span>

        <InlineSelect
          value={rule.classification}
          options={CLASSIFICATION_OPTIONS}
          onChange={(v) => onUpdate({ classification: v as Classification | "any" })}
        />

        <span className="text-[12px] text-muted-foreground">+</span>

        <InlineSelect
          value={rule.scope}
          options={SCOPE_OPTIONS}
          onChange={(v) => onUpdate({ scope: v as Scope | "any" })}
        />

        <span className="text-[12px] text-muted-foreground font-medium">then</span>

        <InlineSelect
          value={rule.action ?? "auto_accept"}
          options={ACTION_OPTIONS.map((a) => ({ value: a.value, label: a.label }))}
          onChange={(v) => onUpdate({ action: v as AutoAcceptRule["action"] })}
          icon={<ActionIcon size={12} className={actionMeta.color} />}
        />

        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant={isPreview ? "default" : "ghost"}
            className="h-6 px-2 text-[10px] gap-1"
            onClick={onPreview}
          >
            <Eye size={11} /> Preview
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6 text-muted-foreground hover:text-red-500"
            onClick={onRemove}
          >
            <Trash size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline select dropdown ─── */

function InlineSelect({
  value,
  options,
  onChange,
  icon,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-[12px] font-medium transition-colors hover:border-primary/30 hover:bg-muted/30"
      >
        {icon}
        {selected?.label ?? value}
        <CaretDown size={10} className="text-muted-foreground/50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[160px] rounded-xl border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] transition-colors hover:bg-muted/60",
                  opt.value === value && "bg-primary/8 font-medium text-primary"
                )}
              >
                {opt.label}
                {opt.value === value && <Check size={12} weight="bold" className="text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
