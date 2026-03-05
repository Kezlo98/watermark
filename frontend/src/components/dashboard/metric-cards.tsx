import { CheckCircle, Server, Layers, HardDrive } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";

const DASHBOARD_METRICS = [
  {
    label: "Cluster Status",
    value: "3/3 Online",
    icon: CheckCircle,
    iconColor: "text-status-healthy",
    trend: { value: "All Healthy", positive: true },
  },
  {
    label: "Brokers",
    value: "3",
    icon: Server,
    iconColor: "text-primary",
  },
  {
    label: "Topics",
    value: "142",
    icon: Layers,
    iconColor: "text-semantic-cyan",
    trend: { value: "+3 this week", positive: true },
  },
  {
    label: "Total Size",
    value: "1.2 TB",
    icon: HardDrive,
    iconColor: "text-semantic-orange",
  },
];

export function DashboardMetricCards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {DASHBOARD_METRICS.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}
