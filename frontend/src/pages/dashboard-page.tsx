import { DashboardMetricCards, BrokerTable } from "@/components/dashboard/dashboard-widgets";
import { RefreshButton } from "@/components/shared/refresh-button";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
          Cluster Overview
        </h1>
        <RefreshButton queryKeys={[["dashboard"]]} />
      </div>
      <DashboardMetricCards />
      <BrokerTable />
    </div>
  );
}
