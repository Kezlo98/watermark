import { useState, useCallback } from "react";
import type { RankingConfig } from "@/types/ranking-config";
import { DEFAULT_RANKING_CONFIG } from "@/types/ranking-config";

const STORAGE_KEY_PREFIX = "group-lag-config-";

/** Persists group lag config to localStorage keyed by cluster ID. */
export function useGroupLagConfig(clusterID: string | null) {
  const [config, setConfig] = useState<RankingConfig>(() => {
    if (!clusterID) return DEFAULT_RANKING_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFIX + clusterID);
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
            STORAGE_KEY_PREFIX + clusterID,
            JSON.stringify(next),
          );
        }
        return next;
      });
    },
    [clusterID],
  );

  return { config, updateConfig };
}
