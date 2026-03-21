import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settings";

/**
 * Countdown timer that invalidates all cluster-scoped queries on refresh.
 *
 * When `enabled` is false, the countdown pauses and no auto-invalidation occurs.
 * Manual `refresh()` still works regardless of enabled state.
 */
export function useRefreshCountdown(intervalMs: number, enabled: boolean) {
  const queryClient = useQueryClient();
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const intervalSec = Math.round(intervalMs / 1000);
  const [secondsLeft, setSecondsLeft] = useState(intervalSec);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset countdown when interval changes
  useEffect(() => {
    setSecondsLeft(intervalSec);
  }, [intervalSec]);

  // Tick every 1s when enabled
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return intervalSec; // auto-reset on zero
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalSec, enabled]);

  // Invalidate all cluster queries
  const invalidateAll = useCallback(() => {
    if (clusterId) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === clusterId;
        },
      });
    }
  }, [queryClient, clusterId]);

  // Manual refresh — always works
  const refresh = useCallback(() => {
    invalidateAll();
    setSecondsLeft(intervalSec);
  }, [invalidateAll, intervalSec]);

  return { secondsLeft, refresh };
}
