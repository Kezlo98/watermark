import { useState, useCallback } from "react";
import type {
  ChartPreferences,
  ChartEntity,
  ViewMode,
} from "@/components/monitoring/chart-entity-types";
import { MAX_CHART_ENTITIES, CHART_COLORS } from "@/components/monitoring/chart-entity-types";

const STORAGE_KEY_PREFIX = "chart-prefs-";

const DEFAULT_PREFS: ChartPreferences = {
  mode: "topic",
  topicEntities: [],
  groupEntities: [],
  timeWindow: "1h",
  chartType: "area",
};

function parseEntities(raw: unknown): ChartEntity[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e: ChartEntity) => ({
    name: String(e.name ?? ""),
    colorIndex: typeof e.colorIndex === "number" ? e.colorIndex : 0,
    visible: e.visible !== false,
    tracked: false, // tracked status is enriched at runtime, not persisted
  }));
}

/** Read from localStorage with migration from old single-entities format. */
function readFromStorage(key: string): ChartPreferences {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    const mode: ViewMode = parsed.mode === "group" ? "group" : "topic";

    // Migration: old format had a single `entities` array
    if (parsed.entities && !parsed.topicEntities && !parsed.groupEntities) {
      const migrated = parseEntities(parsed.entities);
      const prefs: ChartPreferences = {
        mode,
        topicEntities: mode === "topic" ? migrated : [],
        groupEntities: mode === "group" ? migrated : [],
        timeWindow: parsed.timeWindow ?? "1h",
        chartType: parsed.chartType ?? "area",
      };
      // Persist migrated format
      localStorage.setItem(key, JSON.stringify(prefs));
      return prefs;
    }

    return {
      mode,
      topicEntities: parseEntities(parsed.topicEntities),
      groupEntities: parseEntities(parsed.groupEntities),
      timeWindow: parsed.timeWindow ?? "1h",
      chartType: parsed.chartType ?? "area",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Returns the active entity list for the current mode. */
function activeEntities(prefs: ChartPreferences): ChartEntity[] {
  return prefs.mode === "topic" ? prefs.topicEntities : prefs.groupEntities;
}

/** Returns a new prefs object with the active entity list replaced. */
function withEntities(prefs: ChartPreferences, entities: ChartEntity[]): ChartPreferences {
  return prefs.mode === "topic"
    ? { ...prefs, topicEntities: entities }
    : { ...prefs, groupEntities: entities };
}

/** Persists chart preferences to localStorage keyed by cluster ID. */
export function useChartPreferences(clusterID: string | null) {
  const storageKey = clusterID ? STORAGE_KEY_PREFIX + clusterID : null;

  const [prefs, setPrefs] = useState<ChartPreferences>(() => {
    if (!storageKey) return DEFAULT_PREFS;
    return readFromStorage(storageKey);
  });

  const save = useCallback(
    (next: ChartPreferences) => {
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey],
  );

  const updatePrefs = useCallback(
    (partial: Partial<ChartPreferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...partial };
        save(next);
        return next;
      });
    },
    [save],
  );

  /** Switch between topic and group mode — no clearing needed. */
  const setMode = useCallback(
    (mode: ViewMode) => {
      updatePrefs({ mode });
    },
    [updatePrefs],
  );

  /** Add entity with next available color. */
  const addEntity = useCallback(
    (name: string) => {
      setPrefs((prev) => {
        const current = activeEntities(prev);
        if (current.length >= MAX_CHART_ENTITIES) return prev;
        if (current.some((e) => e.name === name)) return prev;
        const usedColors = new Set(current.map((e) => e.colorIndex));
        let colorIndex = 0;
        for (let i = 0; i < CHART_COLORS.length; i++) {
          if (!usedColors.has(i)) { colorIndex = i; break; }
        }
        const next = withEntities(prev, [...current, { name, colorIndex, visible: true, tracked: false }]);
        save(next);
        return next;
      });
    },
    [save],
  );

  /** Remove entity and free its color slot. */
  const removeEntity = useCallback(
    (name: string) => {
      setPrefs((prev) => {
        const next = withEntities(prev, activeEntities(prev).filter((e) => e.name !== name));
        save(next);
        return next;
      });
    },
    [save],
  );

  /** Toggle entity visibility on chart. */
  const toggleVisibility = useCallback(
    (name: string) => {
      setPrefs((prev) => {
        const next = withEntities(
          prev,
          activeEntities(prev).map((e) =>
            e.name === name ? { ...e, visible: !e.visible } : e,
          ),
        );
        save(next);
        return next;
      });
    },
    [save],
  );

  /** Swap color index. If the target color is taken, swap between entities. */
  const swapColor = useCallback(
    (entityName: string, newColorIndex: number) => {
      setPrefs((prev) => {
        const current = activeEntities(prev);
        const next = withEntities(
          prev,
          current.map((e) => {
            if (e.name === entityName) return { ...e, colorIndex: newColorIndex };
            if (e.colorIndex === newColorIndex) {
              const swappedFrom = current.find((x) => x.name === entityName);
              return { ...e, colorIndex: swappedFrom?.colorIndex ?? e.colorIndex };
            }
            return e;
          }),
        );
        save(next);
        return next;
      });
    },
    [save],
  );

  /** Filter out entities no longer in available list (for current mode). */
  const validateEntities = useCallback(
    (availableNames: string[]) => {
      const nameSet = new Set(availableNames);
      setPrefs((prev) => {
        const current = activeEntities(prev);
        const filtered = current.filter((e) => nameSet.has(e.name));
        if (filtered.length === current.length) return prev;
        const next = withEntities(prev, filtered);
        save(next);
        return next;
      });
    },
    [save],
  );

  // Expose the active entities for the current mode as a flat getter
  const entities = activeEntities(prefs);

  return {
    prefs,
    /** Active entities for the current mode (convenience getter) */
    entities,
    updatePrefs,
    addEntity,
    removeEntity,
    toggleVisibility,
    swapColor,
    setMode,
    validateEntities,
  };
}
