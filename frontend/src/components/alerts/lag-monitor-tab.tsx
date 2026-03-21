import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Filter } from "lucide-react";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetConsumerGroups } from "@/lib/wails-client";
import { cn } from "@/lib/utils";
import { globMatch } from "@/lib/glob-match";
import { useSettingsStore } from "@/store/settings";
import { useGroupLagConfig } from "@/hooks/use-group-lag-config";
import { RankingConfigPanel } from "./ranking-config-panel";

const STATE_STYLES: Record<string, string> = {
  Stable: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  Rebalancing: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Empty: "bg-slate-400/10 text-slate-400 border-slate-400/20",
  Dead: "bg-red-400/10 text-red-400 border-red-400/20",
  Unknown: "bg-slate-400/10 text-slate-400 border-slate-400/20",
};

function shouldShowGroup(
  groupId: string,
  lag: number,
  config: { minLag: number; excludeGlobs: string[]; includeExact: string[] },
): boolean {
  if (lag < config.minLag) return false;
  if (config.includeExact.includes(groupId)) return true;
  for (const glob of config.excludeGlobs) {
    if (globMatch(groupId, glob)) return false;
  }
  return true;
}

/** Monitor tab — real-time consumer group lag table with auto-refresh. */
export function LagMonitorTab() {
  const navigate = useNavigate();
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const { config, updateConfig } = useGroupLagConfig(clusterId);
  const [showFilters, setShowFilters] = useState(false);

  const { data: groups, isSuccess } = useKafkaQuery(
    ["consumer-groups"],
    GetConsumerGroups,
    { refetchInterval: 10_000 },
  );

  const filtered = useMemo(() => {
    if (!groups) return [];
    return groups
      .filter((g) => shouldShowGroup(g.groupId, g.totalLag, config))
      .sort((a, b) => b.totalLag - a.totalLag);
  }, [groups, config]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex justify-between items-center text-xs shrink-0">
        <p className="text-slate-500">
          Showing {filtered.length} of {groups?.length ?? 0} groups
        </p>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white rounded border border-transparent hover:border-white/10 hover:bg-white/5 transition-all",
            showFilters && "bg-white/5 border-white/10 text-white"
          )}
        >
          <Filter className="size-3" />
          {showFilters ? "Hide Filters" : "Filter Config"}
        </button>
      </div>

      {showFilters && <RankingConfigPanel config={config} onUpdate={updateConfig} />}

      {!isSuccess ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          Connect to a cluster to view consumer group lag.
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No consumer groups match current filters.
        </div>
      ) : (
        <div className="glass-panel overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-center font-medium w-12">#</th>
                  <th className="px-4 py-3 text-left font-medium">Group ID</th>
                  <th className="px-4 py-3 text-left font-medium">State</th>
                  <th className="px-4 py-3 text-right font-medium">Members</th>
                  <th className="px-4 py-3 text-right font-medium">Total Lag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, idx) => (
                  <tr
                    key={g.groupId}
                    onClick={() =>
                      navigate({
                        to: "/consumers/$groupId",
                        params: { groupId: g.groupId },
                      })
                    }
                    className="border-b border-white/5 cursor-pointer hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-slate-500 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-white truncate max-w-[300px]">
                      {g.groupId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-xs font-medium rounded border",
                          STATE_STYLES[g.state] ?? STATE_STYLES.Unknown,
                        )}
                      >
                        {g.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 font-mono">
                      {g.members}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span
                        className={cn(
                          g.totalLag > 10000
                            ? "text-semantic-red"
                            : g.totalLag > 1000
                              ? "text-amber-400"
                              : "text-slate-300",
                        )}
                      >
                        {g.totalLag.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-slate-500 border-t border-white/5 shrink-0 bg-black/20">
            Showing {filtered.length} of {groups?.length ?? 0} groups
          </div>
        </div>
      )}
    </div>
  );
}
