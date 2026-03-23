import { useState, useCallback } from "react";
import type { RankingConfig } from "@/types/ranking-config";
import { DEFAULT_RANKING_CONFIG } from "@/types/ranking-config";

/** Generic hook that persists RankingConfig to localStorage by key prefix + cluster ID. */
export function usePersistedRankingConfig(storageKeyPrefix: string, clusterID: string | null) {
  const [config, setConfig] = useState<RankingConfig>(() => {
    if (!clusterID) return DEFAULT_RANKING_CONFIG;
    try {
      const raw = localStorage.getItem(storageKeyPrefix + clusterID);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          minLag: parsed.minLag ?? DEFAULT_RANKING_CONFIG.minLag,
          excludeGlobs: Array.isArray(parsed.excludeGlobs) ? parsed.excludeGlobs : DEFAULT_RANKING_CONFIG.excludeGlobs,
          includeExact: Array.isArray(parsed.includeExact) ? parsed.includeExact : DEFAULT_RANKING_CONFIG.includeExact,
        };
      }
      return DEFAULT_RANKING_CONFIG;
    } catch {
      return DEFAULT_RANKING_CONFIG;
    }
  });

  const updateConfig = useCallback(
    (updates: Partial<RankingConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...updates };
        if (clusterID) {
          localStorage.setItem(
            storageKeyPrefix + clusterID,
            JSON.stringify(next),
          );
        }
        return next;
      });
    },
    [clusterID, storageKeyPrefix],
  );

  return { config, updateConfig };
}
