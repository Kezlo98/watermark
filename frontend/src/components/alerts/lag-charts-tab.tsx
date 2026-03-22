/**
 * Charts tab — multi-entity interactive time-series lag charts.
 * Supports up to 5 overlaid entities with persistence, color picker, and visibility toggles.
 */

import { useMemo, useEffect } from "react";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { useMultiLagTimeSeries } from "@/hooks/use-multi-lag-time-series";
import { useChartPreferences } from "@/hooks/use-chart-preferences";
import { useLagAlertsStore } from "@/store/lag-alerts";
import { useSettingsStore } from "@/store/settings";
import {
  GetAllGroupsLagDetail,
  GetConsumerGroups,
} from "@/lib/wails-client";
import { ChartControls } from "./chart-controls";
import { ChartAreaRenderer } from "./chart-area-renderer";
import { ChartLineRenderer } from "./chart-line-renderer";
import { ChartBarRenderer } from "./chart-bar-renderer";
import { ChartFooterLegend } from "./chart-footer-legend";
import { BarChart3 } from "lucide-react";
import type { TopicLagSummary } from "@/types/lag-alerts";

/** Charts tab — interactive time-series lag charts. */
export function LagChartsTab() {
  const { alertConfig } = useLagAlertsStore();
  const recordingEnabled = alertConfig?.recordingEnabled ?? false;
  const pollInterval = (alertConfig?.pollIntervalSec ?? 30) * 1000;
  const clusterId = useSettingsStore((s) => s.activeClusterId);

  // Persistent chart preferences (entities stored per mode)
  const {
    prefs,
    entities,
    updatePrefs,
    addEntity,
    removeEntity,
    toggleVisibility,
    swapColor,
    setMode,
    validateEntities,
  } = useChartPreferences(clusterId);

  // Fetch entity lists for selector dropdown
  const { data: topicLags } = useKafkaQuery<TopicLagSummary[]>(
    ["all-groups-lag-detail"],
    GetAllGroupsLagDetail as () => Promise<TopicLagSummary[]>,
    { refetchInterval: 30_000 },
  );
  const { data: consumerGroups } = useKafkaQuery(
    ["consumer-groups"],
    GetConsumerGroups,
    { refetchInterval: 30_000 },
  );

  const availableEntities = useMemo(() => {
    if (prefs.mode === "topic") {
      return (topicLags ?? []).map((t) => t.topic).sort();
    }
    return (consumerGroups ?? []).map((g) => g.groupId).sort();
  }, [prefs.mode, topicLags, consumerGroups]);

  // Validate persisted entities against current available list
  useEffect(() => {
    if (availableEntities.length > 0) {
      validateEntities(availableEntities);
    }
  }, [availableEntities, validateEntities]);

  // Multi-entity time-series data
  const { data: mergedData, isLoading } = useMultiLagTimeSeries({
    mode: prefs.mode,
    entities,
    window: prefs.timeWindow,
    refreshInterval: pollInterval,
    enabled: recordingEnabled && entities.length > 0,
  });

  // Visible entities for chart rendering
  const visibleEntities = useMemo(
    () =>
      entities
        .map((e, i) => ({ ...e, originalIndex: i }))
        .filter((e) => e.visible),
    [entities],
  );

  // Empty states
  if (alertConfig === null) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading configuration...
        </div>
      </div>
    );
  }

  if (!recordingEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <BarChart3 className="size-12 text-slate-600" />
        <div className="text-center space-y-1">
          <p className="text-sm text-slate-400">Chart recording is disabled.</p>
          <p className="text-xs text-slate-500">
            Enable recording in the <span className="text-primary">Config</span> tab to start
            capturing lag data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChartControls
        mode={prefs.mode}
        onModeChange={setMode}
        entities={availableEntities}
        selectedEntities={entities}
        onAddEntity={addEntity}
        timeWindow={prefs.timeWindow}
        onTimeWindowChange={(w) => updatePrefs({ timeWindow: w })}
        chartType={prefs.chartType}
        onChartTypeChange={(t) => updatePrefs({ chartType: t })}
      />

      {entities.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Add a {prefs.mode} to start charting.
        </div>
      ) : (
        <>
          {isLoading && mergedData.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Recording started — waiting for data...
            </div>
          ) : mergedData.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              No lag data available for the selected {prefs.mode === "topic" ? "topics" : "groups"} in this time window.
            </div>
          ) : prefs.chartType === "area" ? (
            <ChartAreaRenderer
              data={mergedData}
              entities={visibleEntities}
              allEntities={entities}
              timeWindow={prefs.timeWindow}
            />
          ) : prefs.chartType === "line" ? (
            <ChartLineRenderer
              data={mergedData}
              entities={visibleEntities}
              allEntities={entities}
              timeWindow={prefs.timeWindow}
            />
          ) : (
            <ChartBarRenderer
              data={mergedData}
              entities={visibleEntities}
              allEntities={entities}
              timeWindow={prefs.timeWindow}
            />
          )}
          <ChartFooterLegend
            entities={entities}
            onToggleVisibility={toggleVisibility}
            onRemove={removeEntity}
            onSwapColor={swapColor}
          />
        </>
      )}
    </div>
  );
}
