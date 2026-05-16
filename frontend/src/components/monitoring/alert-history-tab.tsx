import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { useLagAlertsStore } from "@/store/lag-alerts";
import { useSettingsStore } from "@/store/settings";
import { cn } from "@/lib/utils";

type FilterMode = "all" | "unread";

/** Returns a human-readable relative time string. */
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

/** Alert history tab — full alert event list with grouping and filtering. */
export function AlertHistoryTab() {
  const navigate = useNavigate();
  const { alerts, markAllRead, clearAll } = useLagAlertsStore();
  const { activeClusterId } = useSettingsStore();
  const [filter, setFilter] = useState<FilterMode>("all");

  const filtered = alerts.filter((a) => {
    if (filter === "unread") return !a.read;
    return true;
  });

  // Group by rulePattern
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, a) => {
    const key = a.rulePattern || a.matchedRule || "Unknown Rule";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const handleGroupClick = (groupId: string) => {
    navigate({ to: "/consumers/$groupId", params: { groupId } });
  };

  return (
    <div className="space-y-4">
      {/* Header with filter + actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "unread"] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={cn(
                "px-3 py-1 text-xs rounded border transition-colors capitalize",
                filter === mode
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-secondary text-muted-foreground border-border hover:border-border-hover",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {alerts.length > 0 && activeClusterId && (
            <>
              <button
                onClick={() => markAllRead(activeClusterId)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
              <button
                onClick={() => clearAll(activeClusterId)}
                className="text-xs text-semantic-red hover:text-red-300 transition-colors"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {filter === "all"
            ? "No alerts yet. Configure rules in the Config tab."
            : `No ${filter} alerts.`}
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          {Object.entries(grouped).map(([pattern, groupAlerts]) => (
            <div key={pattern} className="border-b border-border last:border-0">
              <div className="px-4 py-2 text-xs text-muted-foreground font-medium bg-secondary">
                Rule: {pattern}
              </div>
              {groupAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => handleGroupClick(alert.groupId)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left"
                >
                  <span className="mt-0.5 shrink-0">
                    {alert.resolved
                      ? <CheckCircle2 className="size-3.5 text-emerald-400 mt-0.5" />
                      : alert.level === "critical"
                        ? <Circle className="size-3 fill-red-500 text-red-500 mt-1" />
                        : <Circle className="size-3 fill-yellow-500 text-yellow-500 mt-1" />
                    }
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          !alert.read && !alert.resolved ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {alert.groupId}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {relativeTime(alert.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Lag: {alert.lag.toLocaleString()} / threshold:{" "}
                      {alert.threshold.toLocaleString()}
                      {alert.resolved && alert.resolvedAt && (
                        <span className="ml-2 text-emerald-400">
                          · Resolved {relativeTime(alert.resolvedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
