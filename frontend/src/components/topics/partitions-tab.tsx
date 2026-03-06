import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import type { Partition } from "@/types/kafka";

const MOCK_PARTITIONS: Partition[] = [
  { id: 0, leader: 1, replicas: [1, 2, 3], isr: [1, 2, 3], lowWatermark: 0, highWatermark: 45902 },
  { id: 1, leader: 2, replicas: [2, 3, 1], isr: [2, 3, 1], lowWatermark: 0, highWatermark: 30000 },
  { id: 2, leader: 3, replicas: [3, 1, 2], isr: [3, 1], lowWatermark: 0, highWatermark: 28500 },
  { id: 3, leader: 1, replicas: [1, 2, 3], isr: [1, 2, 3], lowWatermark: 0, highWatermark: 12000 },
  { id: 4, leader: 2, replicas: [2, 3, 1], isr: [2, 3, 1], lowWatermark: 0, highWatermark: 9800 },
  { id: 5, leader: 3, replicas: [3, 1, 2], isr: [3, 1, 2], lowWatermark: 0, highWatermark: 15200 },
];

const isIsrMismatch = (p: Partition) => p.isr.length !== p.replicas.length;

const columns: ColumnDef<Partition, unknown>[] = [
  { accessorKey: "id", header: "Partition" },
  { accessorKey: "leader", header: "Leader Broker" },
  {
    accessorKey: "replicas",
    header: "Replicas",
    cell: ({ row }) => row.original.replicas.join(", "),
  },
  {
    accessorKey: "isr",
    header: "ISR",
    cell: ({ row }) => (
      <span className={cn(isIsrMismatch(row.original) && "text-semantic-red font-bold")}>
        {row.original.isr.join(", ")}
      </span>
    ),
  },
  {
    accessorKey: "lowWatermark",
    header: "Low Watermark",
    cell: ({ row }) => formatNumber(row.original.lowWatermark),
  },
  {
    accessorKey: "highWatermark",
    header: "High Watermark",
    cell: ({ row }) => formatNumber(row.original.highWatermark),
  },
];

interface PartitionsTabProps {
  topicName: string;
}

export function PartitionsTab({ topicName }: PartitionsTabProps) {
  return (
    <DataTable
      data={MOCK_PARTITIONS}
      columns={columns}
      highlightRow={(row) =>
        isIsrMismatch(row) ? "bg-semantic-red/10" : undefined
      }
    />
  );
}
