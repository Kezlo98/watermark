import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import type { Partition } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetTopicPartitions } from "@/lib/wails-client";

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
  const { data: partitions = [] } = useKafkaQuery(
    ["topic-partitions", topicName],
    () => GetTopicPartitions(topicName),
  );

  return (
    <DataTable
      data={partitions}
      columns={columns}
      highlightRow={(row) =>
        isIsrMismatch(row) ? "bg-semantic-red/10" : undefined
      }
    />
  );
}
