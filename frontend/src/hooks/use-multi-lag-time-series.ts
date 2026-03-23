/**
 * Parallel time-series fetching for multiple chart entities.
 * Uses TanStack useQueries for idiomatic dynamic parallel queries.
 *
 * Charts have their own auto-refresh (tied to backend pollIntervalSec)
 * to ensure continuous data accumulation for visualization.
 */

import { useQueries } from "@tanstack/react-query";
import { GetTopicTimeSeries, GetGroupTimeSeries } from "@/lib/wails-client";
import { useSettingsStore } from "@/store/settings";
import type { ChartEntity, ViewMode } from "@/components/monitoring/chart-entity-types";
import { mergeTimeSeries, type RawDataPoint } from "@/components/monitoring/chart-data-merger";

interface UseMultiTimeSeriesOptions {
  mode: ViewMode;
  entities: ChartEntity[];
  window: string;
  refreshInterval: number;
  enabled: boolean;
}

export function useMultiLagTimeSeries({
  mode,
  entities,
  window: timeWindow,
  refreshInterval,
  enabled,
}: UseMultiTimeSeriesOptions) {
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);
  const isConnected = connectionStatus === "connected" && !!clusterId;

  const queries = useQueries({
    queries: entities.map((entity) => ({
      queryKey: [clusterId, "lag-timeseries", mode, entity.name, timeWindow],
      queryFn: () =>
        mode === "topic"
          ? GetTopicTimeSeries(entity.name, timeWindow)
          : GetGroupTimeSeries(entity.name, timeWindow),
      enabled: isConnected && enabled && !!entity.name,
      refetchInterval: enabled ? refreshInterval : false,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const dataSets = queries.map(
    (q) => q.data as RawDataPoint[] | undefined,
  );
  const mergedData = mergeTimeSeries(entities, dataSets);

  return { data: mergedData, isLoading, isFetching };
}
