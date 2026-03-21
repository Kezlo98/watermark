import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { useRankingConfig } from "@/hooks/use-ranking-config";
import { useSettingsStore } from "@/store/settings";
import { GetAllGroupsLagDetail } from "@/lib/wails-client";
import { globMatch } from "@/lib/glob-match";
import { RankingConfigPanel } from "./ranking-config-panel";
import { cn } from "@/lib/utils";
import type { TopicLagSummary } from "@/types/lag-alerts";

function shouldShowTopic(
  topic: string,
  lag: number,
  config: { minLag: number; excludeGlobs: string[]; includeExact: string[] },
): boolean {
  if (lag < config.minLag) return false;
  if (config.includeExact.includes(topic)) return true;
  for (const glob of config.excludeGlobs) {
    if (globMatch(topic, glob)) return false;
  }
  return true;
}

/** Ranking tab — topic lag leaderboard with filter config. */
export function LagRankingTab() {
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const { config, updateConfig } = useRankingConfig(clusterId);
  const [showFilters, setShowFilters] = useState(false);

  const { data: topicLags, isSuccess } = useKafkaQuery<TopicLagSummary[]>(
    ["all-groups-lag-detail"],
    GetAllGroupsLagDetail as () => Promise<TopicLagSummary[]>,
    { refetchInterval: 15_000 },
  );

  const filtered = useMemo(() => {
    if (!topicLags) return [];
    return topicLags
      .filter((t) => shouldShowTopic(t.topic, t.totalLag, config))
      .sort((a, b) => b.totalLag - a.totalLag);
  }, [topicLags, config]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex justify-between items-center text-xs shrink-0">
        <p className="text-slate-500">
          Showing {filtered.length} of {topicLags?.length ?? 0} topics
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
          Connect to a cluster to view topic lag ranking.
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No topics match current filters.
        </div>
      ) : (
        <div className="glass-panel flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-center font-medium w-12">#</th>
                <th className="px-4 py-3 text-left font-medium">Topic</th>
                <th className="px-4 py-3 text-right font-medium">Total Lag</th>
                <th className="px-4 py-3 text-right font-medium">Groups</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr
                  key={t.topic}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3 text-center text-slate-500 font-mono text-xs">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-white truncate max-w-[300px]">
                    {t.topic}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span
                      className={cn(
                        t.totalLag > 10000
                          ? "text-semantic-red"
                          : t.totalLag > 1000
                            ? "text-amber-400"
                            : "text-slate-300",
                      )}
                    >
                      {t.totalLag.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono">
                    {t.groups}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-2 text-xs text-slate-500 border-t border-white/5 shrink-0 bg-black/20">
            Showing {filtered.length} of {topicLags?.length ?? 0} topics
          </div>
        </div>
      )}
    </div>
  );
}
