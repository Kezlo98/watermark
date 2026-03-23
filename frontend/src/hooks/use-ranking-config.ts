import { usePersistedRankingConfig } from "./use-persisted-ranking-config";

/** Persists ranking config to localStorage keyed by cluster ID. */
export function useRankingConfig(clusterID: string | null) {
  return usePersistedRankingConfig("ranking-config-", clusterID);
}
