import { useState, useCallback } from "react";

interface AlertRefreshPrefs {
  /** Whether auto-refresh is active. */
  enabled: boolean;
  /** Auto-refresh interval in milliseconds. */
  intervalMs: number;
}

const STORAGE_KEY = "alert-refresh-prefs";

const DEFAULTS: AlertRefreshPrefs = {
  enabled: true,
  intervalMs: 10_000,
};

/** Available interval options for the dropdown picker. */
export const REFRESH_INTERVALS = [
  { label: "5s", value: 5_000 },
  { label: "10s", value: 10_000 },
  { label: "30s", value: 30_000 },
  { label: "1m", value: 60_000 },
  { label: "2m", value: 120_000 },
  { label: "5m", value: 300_000 },
] as const;

function readPrefs(): AlertRefreshPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULTS;
}

function writePrefs(prefs: AlertRefreshPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/** Persisted auto-refresh preferences for the Alerts page. */
export function useAlertRefreshPrefs() {
  const [prefs, setPrefsState] = useState<AlertRefreshPrefs>(readPrefs);

  const setPrefs = useCallback((updater: (p: AlertRefreshPrefs) => AlertRefreshPrefs) => {
    setPrefsState((prev) => {
      const next = updater(prev);
      writePrefs(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    () => setPrefs((p) => ({ ...p, enabled: !p.enabled })),
    [setPrefs],
  );

  const setIntervalMs = useCallback(
    (intervalMs: number) => setPrefs((p) => ({ ...p, intervalMs, enabled: true })),
    [setPrefs],
  );

  return { ...prefs, toggle, setIntervalMs };
}
