import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { Trophy } from "lucide-react";
import { useRankingConfig } from "@/hooks/use-ranking-config";
import { useSettingsStore } from "@/store/settings";
import { GetAllGroupsLagDetail } from "@/lib/wails-client";
import { globMatch } from "@/lib/glob-match";
import { RankingConfigPanel } from "./ranking-config-panel";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

  const { data: topicLags } = useKafkaQuery<TopicLagSummary[]>(
    ["all-groups-lag-detail"],
    GetAllGroupsLagDetail as () => Promise<TopicLagSummary[]>,
    { refetchInterval: false },
  );

  const filtered = useMemo(() => {
    if (!topicLags) return [];
    return topicLags
      .filter((t) => shouldShowTopic(t.topic, t.totalLag, config))
      .sort((a, b) => b.totalLag - a.totalLag);
  }, [topicLags, config]);

  return (
    <div className="flex flex-col gap-3 h-[256px]">
      <div className="flex justify-between items-center text-xs shrink-0">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="size-4 text-amber-400" />
          Topic Lag Ranking
        </h2>
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white rounded border border-transparent hover:border-white/10 hover:bg-white/5 transition-all outline-none",
                showFilters && "bg-white/5 border-white/10 text-white"
              )}
            >
              <Filter className="size-3" />
              Filter Config
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[400px] p-0 border-white/10 bg-[#0c0c0c]">
            <RankingConfigPanel config={config} onUpdate={updateConfig} />
          </PopoverContent>
        </Popover>
      </div>

      {!topicLags ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm glass-panel py-8">
          Connect to a cluster to view topic lag ranking.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm glass-panel py-8">
          No topics match current filters.
        </div>
      ) : (
        <div className="glass-panel flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-3 py-2 text-center font-medium w-12">#</th>
                <th className="px-3 py-2 text-left font-medium">Topic</th>
                <th className="px-3 py-2 text-right font-medium">Total Lag</th>
                <th className="px-3 py-2 text-right font-medium">Groups</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 5).map((t, idx) => (
                <tr
                  key={t.topic}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors"
                >
                  <td className="px-3 py-2 text-center text-slate-500 font-mono text-xs">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 font-mono text-white truncate max-w-[300px]" title={t.topic}>
                    {t.topic}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
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
                  <td className="px-3 py-2 text-right text-slate-400 font-mono">
                    {t.groups}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-2 text-xs text-slate-500 border-t border-white/5 shrink-0 bg-black/20">
            Showing top {Math.min(filtered.length, 5)} of {topicLags?.length ?? 0} topics
          </div>
        </div>
      )}
    </div>
  );
}
