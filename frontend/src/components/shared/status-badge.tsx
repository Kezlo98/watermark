import { cn } from "@/lib/utils";

type StatusVariant = "healthy" | "rebalancing" | "dead" | "empty";

interface StatusBadgeProps {
  status: StatusVariant;
  label: string;
  className?: string;
  pulse?: boolean;
}

const VARIANT_STYLES: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  healthy: {
    bg: "bg-status-healthy/10",
    text: "text-status-healthy",
    dot: "bg-status-healthy",
  },
  rebalancing: {
    bg: "bg-status-rebalancing/10",
    text: "text-status-rebalancing",
    dot: "bg-status-rebalancing",
  },
  dead: {
    bg: "bg-status-dead/10",
    text: "text-status-dead",
    dot: "bg-status-dead",
  },
  empty: {
    bg: "bg-status-empty/10",
    text: "text-status-empty",
    dot: "bg-status-empty",
  },
};

export function StatusBadge({ status, label, className, pulse = true }: StatusBadgeProps) {
  const styles = VARIANT_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
        styles.bg,
        styles.text,
        `border-${status === "healthy" ? "status-healthy" : status === "rebalancing" ? "status-rebalancing" : status === "dead" ? "status-dead" : "status-empty"}/20`,
        className
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          styles.dot,
          pulse && "animate-pulse"
        )}
      />
      {label}
    </span>
  );
}
