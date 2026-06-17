import { cn } from "@/lib/utils";
import { SCOPE_CONFIG } from "@/lib/constants";
import type { Scope } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  scope: Scope;
  className?: string;
}

export function ScopeBadge({ scope, className }: Props) {
  const config = SCOPE_CONFIG[scope];
  return (
    <Tooltip>
      <TooltipTrigger>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full border font-bold text-xs w-6 h-6 cursor-default",
            config.bgColor,
            config.color,
            config.borderColor,
            className
          )}
        >
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
