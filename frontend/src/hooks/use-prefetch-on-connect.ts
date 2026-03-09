/**
 * Background prefetch hook — populates React Query cache
 * with topics, consumer groups, and schema subjects immediately
 * after a cluster connection is established.
 *
 * Also handles per-cluster cache invalidation:
 * - If the cluster cache is older than 30 minutes, removes stale data
 *   before prefetching fresh data.
 * - If cache is fresh (< 30 min), serves from cache instantly — no refetch.
 *
 * This ensures the ⌘K command palette has data to search
 * without requiring the user to visit each page first.
 *
 * Uses `prefetchQuery` which is fire-and-forget: errors are
 * silently ignored, and the cache is populated when ready.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore, type ConnectionStatus } from "@/store/settings";
import { clusterQueryKey } from "@/hooks/use-kafka-query";
import { GetTopics, GetConsumerGroups, GetSubjects } from "@/lib/wails-client";

export function usePrefetchOnConnect() {
  const queryClient = useQueryClient();
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);
  const activeClusterId = useSettingsStore((s) => s.activeClusterId);
  const isClusterCacheExpired = useSettingsStore((s) => s.isClusterCacheExpired);
  const touchClusterTimestamp = useSettingsStore((s) => s.touchClusterTimestamp);
  const prevStatus = useRef<ConnectionStatus>("disconnected");

  useEffect(() => {
    const wasConnecting =
      prevStatus.current === "connecting" || prevStatus.current === "disconnected";
    const justConnected = connectionStatus === "connected" && wasConnecting;

    prevStatus.current = connectionStatus;

    if (!justConnected || !activeClusterId) return;

    // Check if this cluster's cache is expired (> 30 min)
    if (isClusterCacheExpired(activeClusterId)) {
      // Nuke stale cached data for this cluster
      queryClient.removeQueries({ queryKey: [activeClusterId] });
      touchClusterTimestamp(activeClusterId);
    }

    /* Fire-and-forget prefetches — errors are silently swallowed */
    queryClient.prefetchQuery({
      queryKey: clusterQueryKey(activeClusterId, ["topics"]),
      queryFn: GetTopics,
      staleTime: 30_000,
    });

    queryClient.prefetchQuery({
      queryKey: clusterQueryKey(activeClusterId, ["consumer-groups"]),
      queryFn: GetConsumerGroups,
      staleTime: 30_000,
    });

    queryClient.prefetchQuery({
      queryKey: clusterQueryKey(activeClusterId, ["schema-subjects"]),
      queryFn: GetSubjects,
      staleTime: 30_000,
    });
  }, [connectionStatus, activeClusterId, queryClient, isClusterCacheExpired, touchClusterTimestamp]);
}
