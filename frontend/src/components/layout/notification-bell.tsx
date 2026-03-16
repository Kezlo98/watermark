import { Bell } from "lucide-react";
import { useLagAlertsStore } from "@/store/lag-alerts";
import { cn } from "@/lib/utils";

/**
 * Bell icon with unread badge. Toggles the notification panel on click.
 * Pulses when there are unread critical alerts.
 */
export function NotificationBell() {
  const { unreadCount, alerts, togglePanel } = useLagAlertsStore();

  const hasCritical = alerts.some(
    (a) => !a.resolved && !a.read && a.level === "critical"
  );

  return (
    <button
      onClick={togglePanel}
      className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell
        className={cn(
          "size-4",
          hasCritical && "text-semantic-red animate-pulse"
        )}
      />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-semantic-red text-white text-[9px] font-bold leading-none">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
