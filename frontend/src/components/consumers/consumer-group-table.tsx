import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import type { ConsumerGroup, ConsumerGroupState } from "@/types/kafka";

const STATE_MAP: Record<ConsumerGroupState, "healthy" | "rebalancing" | "dead" | "empty"> = {
  Stable: "healthy",
  Rebalancing: "rebalancing",
  Dead: "dead",
  Empty: "empty",
  Unknown: "empty",
};

const MOCK_GROUPS: ConsumerGroup[] = [
  { groupId: "email-sender-service", state: "Stable", members: 2, totalLag: 1402 },
  { groupId: "analytics-pipeline", state: "Stable", members: 4, totalLag: 0 },
  { groupId: "audit-logger", state: "Rebalancing", members: 1, totalLag: 250 },
  { groupId: "payment-processor", state: "Stable", members: 3, totalLag: 0 },
  { groupId: "old-consumer", state: "Dead", members: 0, totalLag: 5200 },
  { groupId: "test-group", state: "Empty", members: 0, totalLag: 0 },
];

interface ConsumerGroupTableProps {
  onGroupClick: (groupId: string) => void;
  searchFilter: string;
}

const columns: ColumnDef<ConsumerGroup, unknown>[] = [
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
    accessorKey: "totalLag",
    header: "Total Lag",
    cell: ({ row }) => (
      <span className={cn("font-mono", row.original.totalLag > 0 && "text-semantic-red font-bold")}>
        {formatNumber(row.original.totalLag)}
      </span>
    ),
  },
];

export function ConsumerGroupTable({ onGroupClick, searchFilter }: ConsumerGroupTableProps) {
  return (
    <DataTable
      data={MOCK_GROUPS}
      columns={columns}
      onRowClick={(row) => onGroupClick(row.groupId)}
      globalFilter={searchFilter}
    />
  );
}
