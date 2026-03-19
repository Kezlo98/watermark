import { CheckCircle, Server, Layers, HardDrive } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn, formatBytes, formatNumber } from "@/lib/utils";
import type { Broker } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetDashboardData } from "@/lib/wails-client";

/**
 * Dashboard data hook — single backend call for both health + brokers.
 * Eliminates duplicate Metadata + LogDirs round-trips.
 */
function useDashboardData() {
  return useKafkaQuery(
    ["dashboard"],
    GetDashboardData,
    { staleTime: 30_000, refetchInterval: 30_000 },
  );
}

/* ====== Metric Cards ====== */
export function DashboardMetricCards() {
  const { data } = useDashboardData();
  const health = data?.health;

  const metrics = [
    {
      label: "Cluster Status",
      value: health ? `${health.brokersOnline}/${health.brokersTotal} Online` : "—",
      icon: CheckCircle,
      iconColor: "text-status-healthy",
      trend: health?.status === "healthy" ? { value: "All Healthy", positive: true } : undefined,
    },
    {
      label: "Brokers",
      value: health?.brokersOnline.toString() ?? "—",
      icon: Server,
      iconColor: "text-primary",
    },
    {
      label: "Topics",
      value: health?.topicCount.toString() ?? "—",
      icon: Layers,
      iconColor: "text-semantic-cyan",
    },
    {
      label: "Total Size",
      value: health ? formatBytes(health.totalSize) : "—",
      icon: HardDrive,
      iconColor: "text-semantic-orange",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}

/* ====== Broker Table ====== */
const brokerColumns: ColumnDef<Broker, unknown>[] = [
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
  {
    accessorKey: "host",
    header: "Host / IP",
    cell: ({ row }) => (
      <span className="block max-w-[280px] truncate" title={row.original.host}>
        {row.original.host}
      </span>
    ),
  },
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
  const { data } = useDashboardData();
  const brokers = data?.brokers ?? [];

  return (
    <div>
      <h2 className="text-lg font-display font-bold text-white mb-4 uppercase tracking-wider">
        Brokers
      </h2>
      <DataTable
        data={brokers}
        columns={brokerColumns}
        highlightRow={(row) =>
          row.isController ? "bg-primary/10 border-l-2 border-primary" : undefined
        }
      />
    </div>
  );
}
