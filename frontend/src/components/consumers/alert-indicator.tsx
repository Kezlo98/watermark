import { Icon } from "@/components/ui/icon";
import type { AlertEvent } from "@/types/lag-alerts";

/**
 * Small inline indicator showing alert level for a consumer group.
 * Reads from the provided alerts list (passed from parent to avoid store coupling).
 */
interface AlertIndicatorProps {
  groupId: string;
  alerts: AlertEvent[];
}

export function AlertIndicator({ groupId, alerts }: AlertIndicatorProps) {
  const active = alerts.find(
    (a) => a.groupId === groupId && !a.resolved
  );

  if (!active) return null;

  return (
    <span
      title={`${active.level === "critical" ? "Critical" : "Warning"} lag alert: ${active.lag.toLocaleString()}`}
      className="cursor-default"
    >
      {active.level === "critical"
        ? <Icon name="circle" className="size-2.5" tone="danger" weight="fill" />
        : <Icon name="circle" className="size-2.5" tone="warning" weight="fill" />
      }
    </span>
  );
}
