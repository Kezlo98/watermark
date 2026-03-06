import { CheckCircle, Server, Layers, HardDrive } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetClusterHealth } from "@/lib/wails-client";
import { formatBytes } from "@/lib/utils";

export function DashboardMetricCards() {
  const { data: health } = useKafkaQuery(
    ["cluster-health"],
    GetClusterHealth,
  );

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
