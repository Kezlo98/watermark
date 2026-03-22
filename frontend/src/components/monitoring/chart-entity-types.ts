/**
 * Shared types and constants for multi-entity lag charts.
 * Used by chart controls, renderers, footer legend, and persistence hook.
 */

// Re-exported from chart-controls for shared access
export type ChartType = "area" | "line" | "bar";
export type TimeWindow = "1h" | "12h" | "1d" | "7d" | "15d" | "30d";
export type ViewMode = "topic" | "group";

export const TIME_WINDOWS: readonly TimeWindow[] = [
  "1h",
  "12h",
  "1d",
  "7d",
  "15d",
  "30d",
] as const;

export const CHART_TYPES = [
  { id: "area" as const, label: "Area" },
  { id: "line" as const, label: "Line" },
  { id: "bar" as const, label: "Bar" },
] as const;

/** A single entity displayed on the chart (topic or consumer group). */
export interface ChartEntity {
  name: string;
  colorIndex: number; // 0–4, maps into CHART_COLORS
  visible: boolean;
  tracked: boolean;   // true if in config tracked list (persistent recording)
}

/** Shape of localStorage-persisted chart preferences. */
export interface ChartPreferences {
  mode: ViewMode;
  /** @deprecated — migrated to topicEntities/groupEntities. Kept for migration only. */
  entities?: ChartEntity[];
  topicEntities: ChartEntity[];
  groupEntities: ChartEntity[];
  timeWindow: TimeWindow;
  chartType: ChartType;
}

/** Curated 5-color palette for dark background. */
export const CHART_COLORS = [
  "#8B5CF6", // Violet (app accent)
  "#06B6D4", // Cyan
  "#F59E0B", // Amber
  "#F43F5E", // Rose
  "#10B981", // Emerald
] as const;

export const MAX_CHART_ENTITIES = 5;
