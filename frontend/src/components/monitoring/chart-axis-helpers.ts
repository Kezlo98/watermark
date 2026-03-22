/**
 * Shared chart axis helpers — tick generation, formatting, lag display.
 * Ensures each time window shows sensible, evenly-spaced X-axis labels.
 */

import type { TimeWindow } from "./chart-entity-types";

/**
 * Desired tick interval per time window.
 * Each window maps to an approximate gap (in ms) between displayed ticks.
 */
const TICK_INTERVAL_MS: Record<TimeWindow, number> = {
  "1h": 5 * 60_000,        // every 5 min
  "12h": 3600_000,         // every 1 hour
  "1d": 2 * 3600_000,      // every 2 hours
  "7d": 12 * 3600_000,     // every 12 hours
  "15d": 24 * 3600_000,    // every 1 day
  "30d": 24 * 3600_000,    // every 1 day
};

/**
 * Generate evenly-spaced tick values from the data array.
 * Uses the actual timestamps in the data, picks ones closest to the ideal interval.
 */
export function generateTicks(
  data: Record<string, unknown>[],
  timeWindow: TimeWindow,
): string[] {
  if (data.length === 0) return [];

  const interval = TICK_INTERVAL_MS[timeWindow] ?? TICK_INTERVAL_MS["1h"];
  const timestamps = data.map((d) => String(d.timestamp));
  const times = timestamps.map((t) => new Date(t).getTime());

  const first = times[0];
  const last = times[times.length - 1];

  // Generate ideal tick positions at even intervals
  const ticks: string[] = [];
  let target = first;

  while (target <= last) {
    // Find the data point closest to this target
    let bestIdx = 0;
    let bestDist = Math.abs(times[0] - target);
    for (let i = 1; i < times.length; i++) {
      const dist = Math.abs(times[i] - target);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    ticks.push(timestamps[bestIdx]);
    target += interval;
  }

  // Deduplicate (two targets might snap to same data point)
  return [...new Set(ticks)];
}

/** Format timestamp for X-axis display based on time window. */
export function formatTimestamp(ts: string, timeWindow: string): string {
  const date = new Date(ts);
  switch (timeWindow) {
    case "1h":
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    case "12h":
    case "1d":
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    case "7d":
      return date.toLocaleDateString([], { weekday: "short", day: "numeric" });
    case "15d":
    case "30d":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    default:
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

/** Format lag value for Y-axis display. */
export function formatLag(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
