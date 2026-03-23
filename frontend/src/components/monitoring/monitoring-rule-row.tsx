import { useState } from "react";
import { globMatch } from "@/lib/glob-match";
import type { AlertRule } from "@/types/lag-alerts";

interface MonitoringRuleRowProps {
  rule: AlertRule;
  groups: string[];
  onUpdate: (r: AlertRule) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function MonitoringRuleRow({
  rule,
  groups,
  onUpdate,
  onDelete,
  disabled,
}: MonitoringRuleRowProps) {
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
