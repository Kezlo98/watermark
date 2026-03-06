import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import type { ConsumerGroupOffset } from "@/types/kafka";

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

interface OffsetsLagTableProps {
  offsets: ConsumerGroupOffset[];
}

export function OffsetsLagTable({ offsets }: OffsetsLagTableProps) {
  return (
    <div>
      <h3 className="text-sm font-display font-bold text-white mb-3 uppercase tracking-wider">
        Offsets & Lag
      </h3>
      <DataTable data={offsets} columns={columns} />
    </div>
  );
}
