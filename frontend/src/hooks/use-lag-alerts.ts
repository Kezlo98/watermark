import { useEffect } from "react";
import { toast } from "sonner";
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";
import { useLagAlertsStore } from "@/store/lag-alerts";
import type { LagAlertPayload } from "@/types/lag-alerts";

/**
 * Subscribes to "lag:alert" Wails events from the Go poll loop.
 * Must be mounted at AppShell level so alerts work on any page.
 */
export function useLagAlerts(clusterID: string | null) {
  const { addAlerts, markResolved, loadAlerts, reset } = useLagAlertsStore();

  // Load initial alerts when cluster connects
  useEffect(() => {
    if (!clusterID) {
      reset();
      return;
    }
    loadAlerts(clusterID);
  }, [clusterID, loadAlerts, reset]);

  // Subscribe to real-time lag:alert events from Go backend
  useEffect(() => {
    if (!clusterID) return;

    const handler = (payload: LagAlertPayload) => {
      if (!payload?.alerts?.length) return;

      if (payload.type === "breach") {
        addAlerts(payload.alerts);
        // Show toast for each new breach alert
        for (const alert of payload.alerts) {
          const icon = alert.level === "critical" ? "🔴" : "🟡";
          toast.warning(`${icon} Lag alert: ${alert.groupId}`, {
            description: `Lag ${alert.lag.toLocaleString()} ≥ threshold ${alert.threshold.toLocaleString()}`,
            duration: 5000,
          });
        }
      } else if (payload.type === "recovery") {
        markResolved(payload.alerts.map((a) => a.id));
      }
    };

    EventsOn("lag:alert", handler);
    return () => {
      EventsOff("lag:alert");
    };
  }, [clusterID, addAlerts, markResolved]);
}
