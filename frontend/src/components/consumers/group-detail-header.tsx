import { Server } from "lucide-react";
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
            Total Lag: ⚠️ {totalLag.toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <MetricCard
          label="State"
          value={state}
          icon={Server}
          iconColor={`text-${STATE_MAP[state] === "healthy" ? "status-healthy" : STATE_MAP[state] === "rebalancing" ? "status-rebalancing" : "status-dead"}`}
        />
        <MetricCard
          label="Coordinator"
          value={`Broker ${coordinator}`}
          icon={Server}
          iconColor="text-primary"
        />
      </div>
    </div>
  );
}
