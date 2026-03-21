import { useState, useEffect } from "react";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { Activity, Trophy, History, BarChart3, Settings } from "lucide-react";
import { LagMonitorTab } from "./lag-monitor-tab";
import { LagRankingTab } from "./lag-ranking-tab";
import { AlertHistoryTab } from "./alert-history-tab";
import { LagChartsTab } from "./lag-charts-tab";
import { AlertsConfigTab } from "./alerts-config-tab";
import { useSettingsStore } from "@/store/settings";
import { useLagAlertsStore } from "@/store/lag-alerts";

const ALERT_TABS = [
  { id: "monitor", label: "Monitor", icon: Activity },
  { id: "history", label: "History", icon: History },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "config", label: "Config", icon: Settings },
];

export function AlertsPage() {
  const [activeTab, setActiveTab] = useState("monitor");
  const { activeClusterId } = useSettingsStore();
  const { loadConfig } = useLagAlertsStore();

  useEffect(() => {
    if (activeClusterId) {
      loadConfig(activeClusterId);
    }
  }, [activeClusterId, loadConfig]);

  return (
    <div className="h-[calc(100vh-128px)] flex flex-col">
      <h1 className="text-3xl font-mono font-bold uppercase tracking-wider mb-4 shrink-0">
        Alerts
      </h1>

      <TabNavigation
        tabs={ALERT_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="horizontal"
      />

      <div className="mt-6 flex-1 min-h-0">
        {activeTab === "monitor" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full min-h-0">
            <div className="flex flex-col gap-4 h-full min-h-0">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 shrink-0">
                <Activity className="size-4 text-emerald-400" />
                Consumer Lag Ranking
              </h2>
              <LagMonitorTab />
            </div>
            <div className="flex flex-col gap-4 h-full min-h-0">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 shrink-0">
                <Trophy className="size-4 text-amber-400" />
                Topic Lag Ranking
              </h2>
              <LagRankingTab />
            </div>
          </div>
        )}
        {activeTab === "history" && <AlertHistoryTab />}
        {activeTab === "charts" && <LagChartsTab />}
        {activeTab === "config" && <AlertsConfigTab />}
      </div>
    </div>
  );
}

