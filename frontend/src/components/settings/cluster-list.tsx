import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ClusterForm } from "./cluster-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetClusters, DeleteClusterProfile, DuplicateCluster } from "@/lib/wails-client";
import { useSettingsStore } from "@/store/settings";

const COLOR_DOTS: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  purple: "bg-primary",
};

/** Lighter shades for text readability on dark backgrounds */
const COLOR_TEXT: Record<string, string> = {
  red: "text-red-400",
  orange: "text-orange-400",
  green: "text-green-400",
  purple: "text-violet-400",
};

export function ClusterList() {
  const [editingClusterId, setEditingClusterId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { activeClusterId, connectionStatus, connectToCluster, disconnectCluster } =
    useSettingsStore();

  /* Cluster profiles are global config — not scoped by active cluster */
  const { data: clusters = [] } = useQuery({
    queryKey: ["clusters"],
    queryFn: GetClusters,
    refetchInterval: false,
    staleTime: Infinity,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["clusters"] });

  const handleDelete = async (id: string) => {
    // Disconnect if deleting active cluster
    if (id === activeClusterId) {
      await disconnectCluster();
    }
    await DeleteClusterProfile(id);
    invalidate();
  };

  const handleDuplicate = async (id: string) => {
    await DuplicateCluster(id);
    invalidate();
  };

  const handleConnect = async (id: string) => {
    if (activeClusterId === id && connectionStatus === "connected") {
      await disconnectCluster();
    } else {
      await connectToCluster(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-display font-bold text-foreground uppercase tracking-wider">
          <Icon name="globe" className="size-4" tone="brand" />Cluster Connections
        </h3>
        <button
          onClick={() => setEditingClusterId("new")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <Icon name="plus" className="size-3" tone="brand" />
          Add
        </button>
      </div>

      {/* Empty state */}
      {clusters.length === 0 && !editingClusterId && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Icon name="power" className="size-6" tone="brand" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No clusters configured</p>
          <p className="text-xs text-muted-foreground mb-4">Add a Kafka cluster to get started</p>
          <button
            onClick={() => setEditingClusterId("new")}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            <Icon name="plus" className="size-3.5" />
            Add Your First Cluster
          </button>
        </div>
      )}

      {/* Cluster profiles */}
      <div className="space-y-2">
        {clusters.map((cluster) => {
          const isActive = activeClusterId === cluster.id;
          const isConnected = isActive && connectionStatus === "connected";
          const isConnecting = isActive && connectionStatus === "connecting";

          return (
            <div
              key={cluster.id}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-lg border transition-colors",
                editingClusterId === cluster.id
                  ? "border-primary/30 bg-primary/5"
                  : isConnected
                    ? "border-status-healthy/30 bg-status-healthy/5"
                    : "border-border bg-secondary hover:bg-accent"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Connection status dot */}
                <span
                  className={cn(
                    "size-2.5 rounded-full transition-colors",
                    isConnected
                      ? "bg-status-healthy animate-pulse"
                      : isConnecting
                        ? "bg-primary animate-pulse"
                        : "bg-muted-foreground"
                  )}
                />
                <span className={cn(
                    "text-sm font-medium",
                    COLOR_TEXT[cluster.color] ?? "text-foreground"
                  )}>{cluster.name}</span>
                {cluster.readOnly && (
                  <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 bg-secondary rounded border border-border">
                    Read-Only
                  </span>
                )}
                {isConnected && (
                  <span className="text-[10px] font-mono text-status-healthy px-1.5 py-0.5 bg-status-healthy/10 rounded border border-status-healthy/20">
                    Connected
                  </span>
                )}
                {isConnecting && (
                  <span className="text-[10px] font-mono text-primary px-1.5 py-0.5 bg-primary/10 rounded border border-primary/20">
                    Connecting...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Connect/Disconnect toggle */}
                <button
                  onClick={() => handleConnect(cluster.id)}
                  disabled={isConnecting}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    isConnected
                      ? "text-status-healthy hover:text-red-400 hover:bg-red-500/10"
                      : "text-muted-foreground hover:text-status-healthy hover:bg-status-healthy/10"
                  )}
                  title={isConnected ? "Disconnect" : "Connect"}
                >
                  <Icon name="power" className="size-3.5" />
                </button>
                <button
                  onClick={() => setEditingClusterId(editingClusterId === cluster.id ? null : cluster.id)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors"
                >
                  <Icon name="pencil" className="size-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicate(cluster.id)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors"
                >
                  <Icon name="copy" className="size-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cluster.id)}
                  className="p-1.5 text-muted-foreground hover:text-semantic-red rounded hover:bg-semantic-red/10 transition-colors"
                >
                  <Icon name="trash" className="size-3.5" tone="danger" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New cluster form */}
      {editingClusterId === "new" && (
        <ClusterForm
          clusterId="new"
          clusterName=""
          onClose={() => { setEditingClusterId(null); invalidate(); }}
        />
      )}

      {/* Edit form for existing clusters */}
      {editingClusterId && editingClusterId !== "new" && (
        <ClusterForm
          clusterId={editingClusterId}
          clusterName={clusters.find((c) => c.id === editingClusterId)?.name ?? ""}
          onClose={() => { setEditingClusterId(null); invalidate(); }}
        />
      )}
    </div>
  );
}
