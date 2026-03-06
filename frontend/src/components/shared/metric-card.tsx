import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("glass-panel p-5", className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            "flex items-center justify-center size-9 rounded-lg",
            "bg-primary/10"
          )}
        >
          <Icon className={cn("size-4", iconColor)} />
        </div>
      </div>
      <div className="font-mono text-2xl font-bold text-white">{value}</div>
      {trend && (
        <div
          className={cn(
            "mt-1 text-xs font-medium",
            trend.positive ? "text-status-healthy" : "text-semantic-red"
          )}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </div>
      )}
    </div>
  );
}
