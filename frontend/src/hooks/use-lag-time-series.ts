import { useQuery } from "@tanstack/react-query";
import { GetTopicTimeSeries, GetGroupTimeSeries } from "@/lib/wails-client";
import { useSettingsStore } from "@/store/settings";

interface UseTimeSeries {
  mode: "topic" | "group";
  name: string;
  window: string;
  refreshInterval: number; // ms
  enabled: boolean;
}

export function useLagTimeSeries({
  mode,
  name,
  window,
  refreshInterval,
  enabled,
}: UseTimeSeries) {
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const connectionStatus = useSettingsStore((s) => s.connectionStatus);
  const isConnected = connectionStatus === "connected" && !!clusterId;

  return useQuery({
    queryKey: [clusterId, "lag-timeseries", mode, name, window],
    queryFn: () =>
      mode === "topic"
        ? GetTopicTimeSeries(name, window)
        : GetGroupTimeSeries(name, window),
    refetchInterval: enabled ? refreshInterval : false,
    enabled: isConnected && enabled && !!name,
  });
}
