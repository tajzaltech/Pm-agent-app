import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  heading: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, heading, description, ctaLabel, onCta, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-20 px-6", className)}>
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted border mb-5">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{heading}</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      {ctaLabel && onCta && (
        <Button size="sm" variant="outline" onClick={onCta} className="mt-5">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
