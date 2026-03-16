import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLagAlertsStore } from "@/store/lag-alerts";
import { useSettingsStore } from "@/store/settings";

/** Returns a human-readable relative time string without external deps. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Dropdown notification panel showing alerts grouped by rule pattern.
 * Closes on click outside or Escape key.
 */
export function NotificationPanel() {
  const { alerts, isNotificationPanelOpen, closePanel, markAllRead } = useLagAlertsStore();
  const { activeClusterId } = useSettingsStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    if (!isNotificationPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isNotificationPanelOpen, closePanel]);

  // Close on Escape
  useEffect(() => {
    if (!isNotificationPanelOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isNotificationPanelOpen, closePanel]);

  if (!isNotificationPanelOpen) return null;

  // Group alerts by rulePattern
  const grouped = alerts.reduce<Record<string, typeof alerts>>((acc, a) => {
    const key = a.rulePattern || a.matchedRule || "Unknown Rule";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const handleGroupClick = (groupId: string) => {
    closePanel();
    navigate({ to: "/consumers/$groupId", params: { groupId } });
  };

  const handleClear = () => {
    if (activeClusterId) markAllRead(activeClusterId);
  };

  return (
    <div
      ref={panelRef}
      className="absolute top-14 right-4 z-50 w-96 max-h-[480px] flex flex-col glass-panel shadow-xl overflow-hidden"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-sm font-semibold text-white">Lag Alerts</span>
        {alerts.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No alerts
          </div>
        ) : (
          Object.entries(grouped).map(([pattern, groupAlerts]) => (
            <div key={pattern} className="border-b border-white/5 last:border-0">
              <div className="px-4 py-2 text-xs text-slate-500 font-medium bg-white/2">
                Rule: {pattern}
              </div>
              {groupAlerts.slice(0, 10).map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => handleGroupClick(alert.groupId)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="mt-0.5 shrink-0">
                    {alert.resolved ? "✅" : alert.level === "critical" ? "🔴" : "🟡"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium truncate ${!alert.read && !alert.resolved ? "text-white" : "text-slate-400"}`}>
                        {alert.groupId}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {relativeTime(alert.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Lag: {alert.lag.toLocaleString()} / threshold: {alert.threshold.toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
