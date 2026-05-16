import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { CompatibilityLevel } from "@/types/kafka";

const LEVEL_STYLES: Record<CompatibilityLevel, { bg: string; text: string }> = {
  BACKWARD: { bg: "bg-status-healthy/10", text: "text-status-healthy" },
  FORWARD: { bg: "bg-blue-500/10", text: "text-blue-400" },
  FULL: { bg: "bg-primary/10", text: "text-primary" },
  NONE: { bg: "bg-muted", text: "text-muted-foreground" },
};

interface CompatibilityBadgeProps {
  level: CompatibilityLevel;
}

export function CompatibilityBadge({ level }: CompatibilityBadgeProps) {
  const styles = LEVEL_STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        styles.bg,
        styles.text,
        "border-current/20"
      )}
    >
      <Icon name="circle" className="size-2 fill-current" /> {level}
    </span>
  );
}
