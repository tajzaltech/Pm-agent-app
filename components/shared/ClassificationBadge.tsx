import { cn } from "@/lib/utils";
import { CLASSIFICATION_CONFIG } from "@/lib/constants";
import type { Classification } from "@/lib/types";
import { Bug, Sparkles, CircleHelp, TriangleAlert } from "lucide-react";

const ICONS = {
  bug: Bug,
  feature_request: Sparkles,
  question: CircleHelp,
  churn_signal: TriangleAlert,
} as const;

interface Props {
  classification: Classification;
  size?: "sm" | "md";
  className?: string;
}

export function ClassificationBadge({ classification, size = "md", className }: Props) {
  const config = CLASSIFICATION_CONFIG[classification];
  const Icon = ICONS[classification];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        config.bgColor,
        config.color,
        config.borderColor,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        className
      )}
    >
      <Icon className={size === "sm" ? "size-2.5" : "size-3"} />
      {config.label}
    </span>
  );
}
