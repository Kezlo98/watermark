/**
 * TanStack Query wrappers for Wails backend calls.
 * Defaults tuned for Kafka metadata that changes infrequently.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

/**
 * Generic hook for Kafka resource queries with automatic polling.
 * Wraps TanStack Query with sensible defaults for Wails backend calls.
 *
 * Defaults: 30s staleTime + 30s refetchInterval.
 * The Go backend has a 15s cache for expensive calls (LogDirs, Metadata),
 * so polling faster than 15s adds no value.
 */
export function useKafkaQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
    refetchInterval: 30_000,
    staleTime: 30_000,
    ...options,
  });
}
