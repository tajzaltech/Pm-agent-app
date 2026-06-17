import { cn } from "@/lib/utils";
import { SOURCE_CONFIG } from "@/lib/constants";

interface Props {
  source: string;
  className?: string;
}

export function SourceBadge({ source, className }: Props) {
  const config = SOURCE_CONFIG[source] ?? { label: source, color: "text-muted-foreground" };
  return (
    <span className={cn("text-xs font-medium", config.color, className)}>
      {config.label}
    </span>
  );
}
