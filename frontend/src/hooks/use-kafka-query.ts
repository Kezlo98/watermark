/**
 * TanStack Query wrappers for Wails backend calls.
 * Defaults tuned for Kafka metadata that changes infrequently.
 *
 * All query keys are automatically scoped by the active cluster ID,
 * so switching clusters serves isolated cached data per cluster.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settings";

/**
 * Generic hook for Kafka resource queries with automatic polling.
 * Wraps TanStack Query with sensible defaults for Wails backend calls.
 *
 * - Prepends activeClusterId to queryKey for per-cluster cache isolation.
 * - Disabled when not connected to prevent queries during connecting state.
 * - Defaults: 30s staleTime + 30s refetchInterval.
 * - The Go backend has a 15s cache for expensive calls (LogDirs, Metadata),
 *   so polling faster than 15s adds no value.
 */
export function useKafkaQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: Partial<UseQueryOptions<T>>
) {
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);

  // Connection gate — callers can further restrict but NOT bypass
  const isConnected = connectionStatus === "connected" && !!clusterId;
  const callerEnabled = options?.enabled ?? true;

  return useQuery<T>({
    queryKey: clusterId ? [clusterId, ...key] : key,
    queryFn: fetcher,
    refetchInterval: 30_000,
    staleTime: 30_000,
    ...options,
    enabled: isConnected && callerEnabled,
  });
}

/**
 * Build a cluster-scoped query key for use outside of hooks
 * (e.g. in prefetchQuery, invalidateQueries).
 */
export function clusterQueryKey(clusterId: string | null, key: string[]): string[] {
  return clusterId ? [clusterId, ...key] : key;
}
