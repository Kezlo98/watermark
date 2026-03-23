import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/store/settings";
import { useLagAlertsStore } from "@/store/lag-alerts";
import {
  SaveAlertConfig,
  AddRule,
  UpdateRule,
  DeleteRule,
  RestartMonitoring,
  GetConsumerGroups,
  GetCluster,
} from "@/lib/wails-client";
import { globMatch } from "@/lib/glob-match";
import type { AlertRule, ClusterAlertConfig } from "@/types/lag-alerts";
import { TrackedEntitiesConfig } from "./tracked-entities-config";


/** Monitoring config tab — alerts + tracked entities configuration. */
export function MonitoringConfigTab() {
  const { activeClusterId, connectionStatus } = useSettingsStore();
  const { alertConfig, loadConfig } = useLagAlertsStore();
  const [groups, setGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [clusterName, setClusterName] = useState<string>("");

  const connected = connectionStatus === "connected" && !!activeClusterId;

  useEffect(() => {
    if (!activeClusterId) return;
    loadConfig(activeClusterId);
    GetCluster(activeClusterId)
      .then((c: { name: string }) => setClusterName(c.name || activeClusterId))
      .catch(() => setClusterName(activeClusterId));
    GetConsumerGroups()
      .then((gs) => setGroups(gs.map((g: { groupId: string }) => g.groupId)))
      .catch(() => setGroups([]));
  }, [activeClusterId, loadConfig]);

  const cfg: ClusterAlertConfig = alertConfig ?? {
    enabled: false,
    pollIntervalSec: 30,
    notifyOS: false,
    notificationSound: false,
    recordingEnabled: false,
    rules: [],
    trackedTopics: [],
    trackedGroups: [],
    excludedTopics: [],
    excludedGroups: [],
  };

  const saveConfig = async (updated: ClusterAlertConfig) => {
    if (!activeClusterId) return;
    setSaving(true);
    try {
      await SaveAlertConfig(activeClusterId, updated as any);
      await loadConfig(activeClusterId);
      await RestartMonitoring(activeClusterId);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof ClusterAlertConfig) => {
    saveConfig({ ...cfg, [field]: !cfg[field as keyof typeof cfg] });
  };


  const handleAddRule = async () => {
    if (!activeClusterId) return;
    setSaving(true);
    try {
      const rule: AlertRule = {
        id: crypto.randomUUID(),
        groupPattern: "*",
        warningLag: 1000,
        criticalLag: 5000,
        enabled: true,
      };
      await AddRule(activeClusterId, rule);
      await loadConfig(activeClusterId);
    } catch {
      toast.error("Failed to add rule");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRule = async (rule: AlertRule) => {
    if (!activeClusterId) return;
    setSaving(true);
    try {
      await UpdateRule(activeClusterId, rule);
      await loadConfig(activeClusterId);
    } catch {
      toast.error("Failed to update rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!activeClusterId) return;
    setSaving(true);
    try {
      await DeleteRule(activeClusterId, ruleId);
      await loadConfig(activeClusterId);
    } catch {
      toast.error("Failed to delete rule");
    } finally {
      setSaving(false);
    }
  };

  const handleTrackedUpdate = async (
    trackedTopics: string[],
    trackedGroups: string[],
    excludedTopics: string[],
    excludedGroups: string[],
  ) => {
    await saveConfig({ ...cfg, trackedTopics, trackedGroups, excludedTopics, excludedGroups });
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        Connect to a cluster to configure monitoring.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">
          Monitoring for: <span className="text-primary">{clusterName}</span>
        </h3>
        <p className="text-xs text-slate-500">
          Fully opt-in — no polling until you enable monitoring and add rules.
        </p>
      </div>

      {/* Global toggles */}
      <div className="space-y-3">
        <Toggle
          label="Enable Monitoring"
          description="Start polling consumer group lag"
          checked={cfg.enabled}
          onChange={() => handleToggle("enabled")}
          disabled={saving}
        />
        <Toggle
          label="OS Notifications"
          description="Show system notifications on breach"
          checked={cfg.notifyOS}
          onChange={() => handleToggle("notifyOS")}
          disabled={saving}
        />
        <Toggle
          label="Notification Sound"
          description="Play sound with OS notifications"
          checked={cfg.notificationSound}
          onChange={() => handleToggle("notificationSound")}
          disabled={saving || !cfg.notifyOS}
        />
        <Toggle
          label="Record Lag for Charts"
          description="Enable time-series recording for the Charts tab"
          checked={cfg.recordingEnabled}
          onChange={() => handleToggle("recordingEnabled")}
          disabled={saving || !cfg.enabled}
        />
      </div>

      {/* Poll interval (only when monitoring enabled) */}
      {cfg.enabled && (
        <div>
          <label className="block text-xs text-slate-400 mb-2">Poll Interval</label>
          <div className="flex gap-2">
            {[
              { label: "15s", value: 15 },
              { label: "30s", value: 30 },
              { label: "60s", value: 60 },
              { label: "120s", value: 120 },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => saveConfig({ ...cfg, pollIntervalSec: opt.value })}
                disabled={saving}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  cfg.pollIntervalSec === opt.value
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:border-white/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tracked Entities Config (only shown when recording is enabled) */}
      {cfg.recordingEnabled && (
        <TrackedEntitiesConfig
          trackedTopics={cfg.trackedTopics ?? []}
          trackedGroups={cfg.trackedGroups ?? []}
          excludedTopics={cfg.excludedTopics ?? []}
          excludedGroups={cfg.excludedGroups ?? []}
          onUpdate={handleTrackedUpdate}
          disabled={saving}
        />
      )}

      {/* Rules table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Alert Rules
          </span>
          <button
            onClick={handleAddRule}
            disabled={saving}
            className="px-3 py-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            + Add Rule
          </button>
        </div>

        {cfg.rules.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center border border-white/5 rounded-lg">
            No rules yet. Add a rule to start monitoring.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 text-[10px] text-slate-500 uppercase tracking-wider">
              <span className="w-2 shrink-0" />
              <span className="flex-1">Pattern</span>
              <span className="w-20 text-center text-yellow-400/60">⚠ Warn</span>
              <span className="w-20 text-center text-red-400/60">✖ Crit</span>
              <span className="w-6" />
            </div>
            {cfg.rules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                groups={groups}
                onUpdate={handleUpdateRule}
                onDelete={() => handleDeleteRule(rule.id)}
                disabled={saving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const id = `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <Label htmlFor={id} className="text-sm text-white font-normal cursor-pointer">{label}</Label>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function RuleRow({
  rule,
  groups,
  onUpdate,
  onDelete,
  disabled,
}: {
  rule: AlertRule;
  groups: string[];
  onUpdate: (r: AlertRule) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(rule);
  const [error, setError] = useState("");

  const matched = groups.filter((g) => globMatch(g, local.groupPattern));

  const handleBlur = () => {
    if (local.warningLag <= 0 || local.criticalLag <= 0) {
      setError("Thresholds must be positive.");
      return;
    }
    if (local.warningLag >= local.criticalLag) {
      setError("Warning must be less than critical.");
      return;
    }
    setError("");
    onUpdate(local);
  };

  return (
    <div className="p-3 bg-white/3 border border-white/8 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => { const u = { ...local, enabled: !local.enabled }; setLocal(u); onUpdate(u); }}
          disabled={disabled}
          className={`w-2 h-2 rounded-full shrink-0 ${local.enabled ? "bg-primary" : "bg-white/20"}`}
          title={local.enabled ? "Enabled" : "Disabled"}
        />
        <input
          value={local.groupPattern}
          onChange={(e) => setLocal({ ...local, groupPattern: e.target.value })}
          onBlur={handleBlur}
          placeholder="Group pattern (e.g. payment-*)"
          className="flex-1 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-slate-600 focus:outline-none focus:border-white/30 font-mono"
        />
        <input
          type="number"
          min={1}
          value={local.warningLag}
          onChange={(e) => setLocal({ ...local, warningLag: parseInt(e.target.value) || 0 })}
          onBlur={handleBlur}
          title="Warning lag threshold"
          className="w-20 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-yellow-400 focus:outline-none focus:border-white/30"
        />
        <input
          type="number"
          min={1}
          value={local.criticalLag}
          onChange={(e) => setLocal({ ...local, criticalLag: parseInt(e.target.value) || 0 })}
          onBlur={handleBlur}
          title="Critical lag threshold"
          className="w-20 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-semantic-red focus:outline-none focus:border-white/30"
        />
        <button
          onClick={onDelete}
          disabled={disabled}
          className="p-1 text-slate-500 hover:text-semantic-red transition-colors"
          title="Delete rule"
        >
          ✕
        </button>
      </div>
      {error && <p className="text-xs text-semantic-red">{error}</p>}
      {local.groupPattern && (
        <div className="text-xs text-slate-500">
          {matched.length === 0
            ? "No groups match this pattern"
            : `Matches ${matched.length} group${matched.length !== 1 ? "s" : ""}: ${matched.slice(0, 3).join(", ")}${matched.length > 3 ? ` +${matched.length - 3} more` : ""}`}
        </div>
      )}
    </div>
  );
}
