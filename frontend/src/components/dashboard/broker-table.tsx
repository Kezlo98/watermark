import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { formatBytes, formatNumber } from "@/lib/utils";
import type { Broker } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetBrokers } from "@/lib/wails-client";

const columns: ColumnDef<Broker, unknown>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className={cn("font-mono", row.original.isController && "text-primary font-bold")}>
        {row.original.id}{row.original.isController ? "*" : ""}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: () => <StatusBadge status="healthy" label="Online" />,
  },
  { accessorKey: "host", header: "Host / IP" },
  { accessorKey: "port", header: "Port" },
  {
    accessorKey: "partitions",
    header: "Partitions",
    cell: ({ row }) => formatNumber(row.original.partitions),
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => formatBytes(row.original.size),
  },
];

export function BrokerTable() {
  const { data: brokers = [] } = useKafkaQuery(["brokers"], GetBrokers);

  return (
    <div>
      <h2 className="text-lg font-display font-bold text-white mb-4 uppercase tracking-wider">
        Brokers
      </h2>
      <DataTable
        data={brokers}
        columns={columns}
        highlightRow={(row) =>
          row.isController ? "bg-primary/10 border-l-2 border-primary" : undefined
        }
      />
    </div>
  );
}
