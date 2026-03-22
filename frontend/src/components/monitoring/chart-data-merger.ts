/**
 * Pure functions for merging multi-entity time-series data
 * into a single Recharts-compatible flat array.
 */

import type { ChartEntity } from "./chart-entity-types";

export interface RawDataPoint {
  timestamp: string;
  lag: number;
}

/** Data key for Recharts — uses numeric index to avoid CSS variable issues with entity names. */
export function entityDataKey(index: number): string {
  return `entity-${index}`;
}

/**
 * Merge N separate per-entity `{timestamp, lag}[]` arrays into a single flat array:
 * `[{ timestamp, "entity-0": lag, "entity-1": lag, ... }]`
 *
 * Uses simple timestamp string match — backend records all entities in the same snapshot.
 */
export function mergeTimeSeries(
  entities: ChartEntity[],
  dataSets: (RawDataPoint[] | undefined)[],
): Record<string, unknown>[] {
  const tsMap = new Map<string, Record<string, unknown>>();

  entities.forEach((_, i) => {
    const data = dataSets[i];
    if (!data) return;
    const key = entityDataKey(i);
    for (const point of data) {
      if (!tsMap.has(point.timestamp)) {
        tsMap.set(point.timestamp, { timestamp: point.timestamp });
      }
      tsMap.get(point.timestamp)![key] = point.lag;
    }
  });

  return Array.from(tsMap.values()).sort((a, b) =>
    String(a.timestamp).localeCompare(String(b.timestamp)),
  );
}
