/**
 * Charts tab — multi-entity interactive time-series lag charts.
 * Supports up to 5 overlaid entities with persistence, color picker, visibility toggles.
 * Auto-adds untracked entities to persistent config on selection.
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
  SaveAlertConfig,
  RestartMonitoring,
} from "@/lib/wails-client";
import { globMatch } from "@/lib/glob-match";
import { ChartControls } from "./chart-controls";
import { ChartAreaRenderer } from "./chart-area-renderer";
import { ChartLineRenderer } from "./chart-line-renderer";
import { ChartBarRenderer } from "./chart-bar-renderer";
import { ChartFooterLegend } from "./chart-footer-legend";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";
import type { TopicLagSummary } from "@/types/lag-alerts";
import type { TimeWindow, ChartType } from "./chart-entity-types";

/** Charts tab — interactive time-series lag charts. */
export function LagChartsTab() {
  const { alertConfig, loadConfig } = useLagAlertsStore();
  const recordingEnabled = alertConfig?.recordingEnabled ?? false;
  const pollInterval = (alertConfig?.pollIntervalSec ?? 30) * 1000;
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);

  // Tracked patterns from config
  const trackedPatterns = useMemo(() => {
    if (!alertConfig) return { topics: [] as string[], groups: [] as string[] };
    return {
      topics: alertConfig.trackedTopics ?? [],
      groups: alertConfig.trackedGroups ?? [],
    };
  }, [alertConfig]);

  // Excluded patterns from config
  const excludedPatterns = useMemo(() => {
    if (!alertConfig) return { topics: [] as string[], groups: [] as string[] };
    return {
      topics: alertConfig.excludedTopics ?? [],
      groups: alertConfig.excludedGroups ?? [],
    };
  }, [alertConfig]);

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

  // Current mode tracked/excluded patterns
  const currentTrackedPatterns = prefs.mode === "topic"
    ? trackedPatterns.topics
    : trackedPatterns.groups;
  const currentExcludedPatterns = prefs.mode === "topic"
    ? excludedPatterns.topics
    : excludedPatterns.groups;

  // Fetch entity lists for selector dropdown
  const { data: topicLags } = useKafkaQuery<TopicLagSummary[]>(
    ["all-groups-lag-detail"],
    GetAllGroupsLagDetail as () => Promise<TopicLagSummary[]>,
    { refetchInterval: false },
  );
  const { data: consumerGroups } = useKafkaQuery(
    ["consumer-groups"],
    GetConsumerGroups,
    { refetchInterval: false },
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

  // Enrich entities with tracked status
  const enrichedEntities = useMemo(() => {
    return entities.map((e) => ({
      ...e,
      tracked: currentTrackedPatterns.some((p: string) => globMatch(e.name, p)),
    }));
  }, [entities, currentTrackedPatterns]);

  // Auto-add untracked entities to persistent config on selection
  const handleAddEntity = async (name: string) => {
    // Check if entity matches an exclude pattern
    const isExcluded = currentExcludedPatterns.some((p: string) => globMatch(name, p));
    if (isExcluded) {
      toast.warning(`"${name}" matches an exclude pattern. Remove the exclusion in Settings first.`);
      return;
    }

    addEntity(name); // Add to chart (localStorage preferences)

    // Auto-add to tracked config if not already tracked
    const isTracked = currentTrackedPatterns.some((p: string) => globMatch(name, p));
    if (!isTracked && alertConfig && clusterId) {
      const updatedTopics = prefs.mode === "topic"
        ? [...(alertConfig.trackedTopics ?? []), name]
        : (alertConfig.trackedTopics ?? []);
      const updatedGroups = prefs.mode === "group"
        ? [...(alertConfig.trackedGroups ?? []), name]
        : (alertConfig.trackedGroups ?? []);

      try {
        await SaveAlertConfig(clusterId, {
          ...alertConfig,
          trackedTopics: updatedTopics,
          trackedGroups: updatedGroups,
        } as any);
        await loadConfig(clusterId);
        await RestartMonitoring(clusterId);
        toast.info(`"${name}" added to tracking list.`, { duration: 3000 });
      } catch {
        toast.error(`Failed to add "${name}" to tracking list.`);
      }
    }
  };

  // Multi-entity time-series data (own auto-refresh for continuous accumulation)
  const { data: mergedData, isLoading, isFetching: chartFetching } = useMultiLagTimeSeries({
    mode: prefs.mode,
    entities: enrichedEntities,
    window: prefs.timeWindow,
    refreshInterval: pollInterval,
    enabled: recordingEnabled && enrichedEntities.length > 0,
  });

  // Visible entities for chart rendering
  const visibleEntities = useMemo(
    () =>
      enrichedEntities
        .map((e, i) => ({ ...e, originalIndex: i }))
        .filter((e) => e.visible),
    [enrichedEntities],
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
            Enable recording in the <span className="text-primary">Settings</span> to start
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
        selectedEntities={enrichedEntities}
        onAddEntity={handleAddEntity}
        timeWindow={prefs.timeWindow}
        onTimeWindowChange={(w: TimeWindow) => updatePrefs({ timeWindow: w })}
        chartType={prefs.chartType}
        onChartTypeChange={(t: ChartType) => updatePrefs({ chartType: t })}
        trackedPatterns={currentTrackedPatterns}
        excludedPatterns={currentExcludedPatterns}
      />

      {enrichedEntities.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Select a {prefs.mode} above to start charting.
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
              allEntities={enrichedEntities}
              timeWindow={prefs.timeWindow}
            />
          ) : prefs.chartType === "line" ? (
            <ChartLineRenderer
              data={mergedData}
              entities={visibleEntities}
              allEntities={enrichedEntities}
              timeWindow={prefs.timeWindow}
            />
          ) : (
            <ChartBarRenderer
              data={mergedData}
              entities={visibleEntities}
              allEntities={enrichedEntities}
              timeWindow={prefs.timeWindow}
            />
          )}
          <ChartFooterLegend
            entities={enrichedEntities}
            onToggleVisibility={toggleVisibility}
            onRemove={removeEntity}
            onSwapColor={swapColor}
          />
        </>
      )}
    </div>
  );
}
