import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import type { ConsumerGroupOffset } from "@/types/kafka";

const MOCK_OFFSETS: ConsumerGroupOffset[] = [
  { topic: "user.signup", partition: 0, currentOffset: 44500, endOffset: 45902, lag: 1402 },
  { topic: "user.signup", partition: 1, currentOffset: 30000, endOffset: 30000, lag: 0 },
];

const columns: ColumnDef<ConsumerGroupOffset, unknown>[] = [
  {
    accessorKey: "topic",
    header: "Topic",
    cell: ({ row }) => <span className="text-white">{row.original.topic}</span>,
  },
  { accessorKey: "partition", header: "Partition" },
  {
    accessorKey: "currentOffset",
    header: "Current Offset",
    cell: ({ row }) => formatNumber(row.original.currentOffset),
  },
  {
    accessorKey: "endOffset",
    header: "End Offset",
    cell: ({ row }) => formatNumber(row.original.endOffset),
  },
  {
    accessorKey: "lag",
    header: "Lag",
    cell: ({ row }) => (
      <span className={cn("font-mono", row.original.lag > 0 && "text-semantic-red font-bold")}>
        {formatNumber(row.original.lag)}
        {row.original.lag > 0 && " ⚠️"}
      </span>
    ),
  },
];

export function OffsetsLagTable() {
  return (
    <div>
      <h3 className="text-sm font-display font-bold text-white mb-3 uppercase tracking-wider">
        Offsets & Lag
      </h3>
      <DataTable data={MOCK_OFFSETS} columns={columns} />
    </div>
  );
}
