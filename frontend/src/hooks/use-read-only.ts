import { useSettingsStore } from "@/store/settings";
import { useQuery } from "@tanstack/react-query";
import { GetClusters } from "@/lib/wails-client";

/**
 * Returns true when the active cluster has read-only mode enabled.
 * Checks the cluster profile config — backend also enforces this independently.
 */
export function useReadOnly(): boolean {
  const activeClusterId = useSettingsStore((s) => s.activeClusterId);

  const { data: clusters = [] } = useQuery({
    queryKey: ["clusters"],
    queryFn: GetClusters,
    refetchInterval: false,
    staleTime: Infinity,
  });

  if (!activeClusterId) return false;
  const active = clusters.find((c) => c.id === activeClusterId);
  return active?.readOnly ?? false;
}
