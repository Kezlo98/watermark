import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

interface TopicConsumer {
  groupId: string;
  state: "Stable" | "Rebalancing" | "Dead" | "Empty";
  members: number;
  lag: number;
}

const MOCK_CONSUMERS: TopicConsumer[] = [
  { groupId: "email-sender-service", state: "Stable", members: 2, lag: 1402 },
  { groupId: "analytics-pipeline", state: "Stable", members: 4, lag: 0 },
  { groupId: "audit-logger", state: "Rebalancing", members: 1, lag: 250 },
];

const STATE_MAP = {
  Stable: "healthy",
  Rebalancing: "rebalancing",
  Dead: "dead",
  Empty: "empty",
} as const;

const columns: ColumnDef<TopicConsumer, unknown>[] = [
  {
    accessorKey: "groupId",
    header: "Group ID",
    cell: ({ row }) => <span className="text-white font-medium">{row.original.groupId}</span>,
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => (
      <StatusBadge
        status={STATE_MAP[row.original.state]}
        label={row.original.state}
      />
    ),
  },
  { accessorKey: "members", header: "Members" },
  {
    accessorKey: "lag",
    header: "Total Lag",
    cell: ({ row }) => (
      <span className={cn("font-mono", row.original.lag > 0 && "text-semantic-red font-bold")}>
        {formatNumber(row.original.lag)}
      </span>
    ),
  },
];

interface ConsumersTabProps {
  topicName: string;
}

export function ConsumersTab({ topicName }: ConsumersTabProps) {
  return (
    <DataTable
      data={MOCK_CONSUMERS}
      columns={columns}
    />
  );
}
