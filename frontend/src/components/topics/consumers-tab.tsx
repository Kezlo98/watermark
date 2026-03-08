import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import type { ConsumerGroup, ConsumerGroupState } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetTopicConsumers } from "@/lib/wails-client";

const STATE_MAP: Record<ConsumerGroupState, "healthy" | "rebalancing" | "dead" | "empty"> = {
  Stable: "healthy",
  Rebalancing: "rebalancing",
  Dead: "dead",
  Empty: "empty",
  Unknown: "empty",
};

const columns: ColumnDef<ConsumerGroup, unknown>[] = [
  {
    accessorKey: "groupId",
    header: "Group ID",
    cell: ({ row }) => (
      <Link
        to="/consumers/$groupId"
        params={{ groupId: row.original.groupId }}
        className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.groupId}
      </Link>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => (
      <StatusBadge
        status={STATE_MAP[row.original.state as ConsumerGroupState]}
        label={row.original.state}
      />
    ),
  },
  { accessorKey: "members", header: "Members" },
  {
    accessorKey: "totalLag",
    header: "Total Lag",
    cell: ({ row }) => (
      <span className={cn("font-mono", row.original.totalLag > 0 && "text-semantic-red font-bold")}>
        {formatNumber(row.original.totalLag)}
      </span>
    ),
  },
];

interface ConsumersTabProps {
  topicName: string;
}

export function ConsumersTab({ topicName }: ConsumersTabProps) {
  const { data: consumers = [] } = useKafkaQuery(
    ["topic-consumers", topicName],
    () => GetTopicConsumers(topicName),
  );

  return (
    <DataTable
      data={consumers}
      columns={columns}
    />
  );
}
