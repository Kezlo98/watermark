import { Icon } from "@/components/ui/icon";
import type { Tone } from "@/components/ui/icon";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ConsumerGroupState } from "@/types/kafka";

const STATE_MAP = {
  Stable: "healthy",
  Rebalancing: "rebalancing",
  Dead: "dead",
  Empty: "empty",
  Unknown: "empty",
} as const;

const STATE_TONE_MAP: Record<keyof typeof STATE_MAP, Tone> = {
  Stable: "success",
  Rebalancing: "warning",
  Dead: "danger",
  Empty: "muted",
  Unknown: "muted",
};

interface GroupDetailHeaderProps {
  groupId: string;
  state: ConsumerGroupState;
  coordinator: number;
  totalLag: number;
}

export function GroupDetailHeader({ groupId, state, coordinator, totalLag }: GroupDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <StatusBadge
          status={STATE_MAP[state]}
          label={state}
        />
        {totalLag > 0 && (
          <span className="text-sm font-mono text-semantic-red font-bold">
            <Icon name="alert-triangle" tone="danger" className="size-3.5 inline-block mr-1" />Total Lag: {totalLag.toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <MetricCard
          label="State"
          value={state}
          icon="server"
          tone={STATE_TONE_MAP[state]}
        />
        <MetricCard
          label="Coordinator"
          value={`Broker ${coordinator}`}
          icon="server"
          tone="brand"
        />
      </div>
    </div>
  );
}
