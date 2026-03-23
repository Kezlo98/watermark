import { usePersistedRankingConfig } from "./use-persisted-ranking-config";

/** Persists group lag config to localStorage keyed by cluster ID. */
export function useGroupLagConfig(clusterID: string | null) {
  return usePersistedRankingConfig("group-lag-config-", clusterID);
}
