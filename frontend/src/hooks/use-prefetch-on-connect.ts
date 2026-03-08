/**
 * Background prefetch hook — populates React Query cache
 * with topics, consumer groups, and schema subjects immediately
 * after a cluster connection is established.
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
import { GetTopics, GetConsumerGroups, GetSubjects } from "@/lib/wails-client";

export function usePrefetchOnConnect() {
  const queryClient = useQueryClient();
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);
  const prevStatus = useRef<ConnectionStatus>("disconnected");

  useEffect(() => {
    const wasConnecting =
      prevStatus.current === "connecting" || prevStatus.current === "disconnected";
    const justConnected = connectionStatus === "connected" && wasConnecting;

    prevStatus.current = connectionStatus;

    if (!justConnected) return;

    /* Fire-and-forget prefetches — errors are silently swallowed */
    queryClient.prefetchQuery({
      queryKey: ["topics"],
      queryFn: GetTopics,
      staleTime: 30_000,
    });

    queryClient.prefetchQuery({
      queryKey: ["consumer-groups"],
      queryFn: GetConsumerGroups,
      staleTime: 30_000,
    });

    queryClient.prefetchQuery({
      queryKey: ["schema-subjects"],
      queryFn: GetSubjects,
      staleTime: 30_000,
    });
  }, [connectionStatus, queryClient]);
}
