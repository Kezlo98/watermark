/**
 * TanStack Query wrappers for Wails backend calls.
 * Currently uses mock data — will be wired to Wails bindings later.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

/**
 * Generic hook for Kafka resource queries with automatic polling.
 * Wraps TanStack Query with sensible defaults for Wails backend calls.
 */
export function useKafkaQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: Partial<UseQueryOptions<T>>
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
    refetchInterval: 10_000,
    staleTime: 5_000,
    ...options,
  });
}
