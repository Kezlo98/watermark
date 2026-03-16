import { useState } from "react";
import { useSettingsStore } from "@/store/settings";
import { useLagAlertsStore } from "@/store/lag-alerts";
import { AddRule, DeleteRule, RestartMonitoring } from "@/lib/wails-client";
import type { AlertRule } from "@/types/lag-alerts";

interface SetAlertPopoverProps {
  groupId: string;
}

/**
 * Inline popover for quickly setting a lag alert rule for a specific consumer group.
 * Creates an exact-match rule (not a glob pattern).
 */
export function SetAlertPopover({ groupId }: SetAlertPopoverProps) {
  const [open, setOpen] = useState(false);
  const [warningLag, setWarningLag] = useState("");
  const [criticalLag, setCriticalLag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { activeClusterId } = useSettingsStore();
  const { alertConfig, loadConfig } = useLagAlertsStore();

  // Find existing exact-match rule for this group
  const existingRule = alertConfig?.rules.find(
    (r) => r.groupPattern === groupId
  );

  const handleOpen = () => {
    if (existingRule) {
      setWarningLag(String(existingRule.warningLag));
      setCriticalLag(String(existingRule.criticalLag));
    }
    setOpen(true);
    setError("");
  };

  const handleSave = async () => {
    if (!activeClusterId) return;
    const w = parseInt(warningLag, 10);
    const c = parseInt(criticalLag, 10);
    if (isNaN(w) || isNaN(c) || w <= 0 || c <= 0) {
      setError("Enter valid positive numbers.");
      return;
    }
    if (w >= c) {
      setError("Warning must be less than critical.");
      return;
    }
    setSaving(true);
    try {
      const rule: AlertRule = {
        id: existingRule?.id ?? crypto.randomUUID(),
        groupPattern: groupId,
        warningLag: w,
        criticalLag: c,
        enabled: true,
      };
      await AddRule(activeClusterId, rule);
      await loadConfig(activeClusterId);
      await RestartMonitoring(activeClusterId);
      setOpen(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!activeClusterId || !existingRule) return;
    setSaving(true);
    try {
      await DeleteRule(activeClusterId, existingRule.id);
      await loadConfig(activeClusterId);
      setOpen(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="px-3 py-1.5 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 hover:text-white hover:border-white/20 transition-colors"
        title="Set lag alert for this group"
      >
        🔔 Set Alert
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-0 top-8 z-50 w-72 glass-panel p-4 shadow-xl space-y-3">
        <div className="text-sm font-semibold text-white">Lag Alert</div>
        <div className="text-xs text-slate-400 truncate font-mono">{groupId}</div>

        <div className="space-y-2">
          <label className="block text-xs text-slate-400">
            Warning lag threshold
            <input
              type="number"
              min={1}
              value={warningLag}
              onChange={(e) => setWarningLag(e.target.value)}
              placeholder="e.g. 1000"
              className="mt-1 w-full px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded text-white placeholder-slate-600 focus:outline-none focus:border-white/30"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Critical lag threshold
            <input
              type="number"
              min={1}
              value={criticalLag}
              onChange={(e) => setCriticalLag(e.target.value)}
              placeholder="e.g. 5000"
              className="mt-1 w-full px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded text-white placeholder-slate-600 focus:outline-none focus:border-white/30"
            />
          </label>
        </div>

        {error && <p className="text-xs text-semantic-red">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-3 py-1.5 text-xs bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {existingRule && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="px-3 py-1.5 text-xs text-semantic-red bg-semantic-red/10 border border-semantic-red/20 rounded hover:bg-semantic-red/20 transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 rounded hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
