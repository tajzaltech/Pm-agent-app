"use client";

import { ArrowRight, Headphones, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/lib/store/onboarding";
import type { WorkspaceRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: {
  id: WorkspaceRole;
  title: string;
  description: string;
  highlights: string[];
  Icon: typeof UserCog;
}[] = [
  {
    id: "pm",
    title: "Product Manager",
    description: "Own triage, prioritization, and delivery handoff to engineering.",
    highlights: ["Full triage actions", "Insights & delivery analytics", "Automation rules"],
    Icon: UserCog,
  },
  {
    id: "cs_agent",
    title: "Customer Service Agent",
    description: "Handle customer conversations and escalate serious issues to triage.",
    highlights: ["PM Agent Chat first", "Simple Q&A inline", "Escalate to PM review"],
    Icon: Headphones,
  },
];

export function StepSelectRole() {
  const { workspaceRole, setWorkspaceRole, setStep } = useOnboardingStore();

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-8 pb-6 pt-8 text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">How will you use PM Agent?</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We&apos;ll tailor your workspace defaults, landing page, and chat behavior to your role.
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map(({ id, title, description, highlights, Icon }) => {
            const selected = workspaceRole === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setWorkspaceRole(id)}
                className={cn(
                  "rounded-xl border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-sm",
                  selected && "border-primary ring-2 ring-primary/15 shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {highlights.map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end border-t bg-slate-50/50 px-6 py-4">
        <Button onClick={() => setStep(2)} disabled={!workspaceRole} className="min-w-28 gap-2">
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
