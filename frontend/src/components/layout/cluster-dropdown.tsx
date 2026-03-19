import { ChevronDown, Power, Settings, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings";
import { useQuery } from "@tanstack/react-query";
import { GetClusters } from "@/lib/wails-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function ClusterDropdown() {
  const {
    activeClusterId,
    connectionStatus,
    connectionError,
    connectToCluster,
    disconnectCluster,
    openSettings,
  } = useSettingsStore();

  /* Cluster profiles are global config — not scoped by active cluster */
  const { data: clusters = [] } = useQuery({
    queryKey: ["clusters"],
    queryFn: GetClusters,
    refetchInterval: false,
    staleTime: Infinity,
  });

  const activeCluster = clusters.find((c) => c.id === activeClusterId);

  const handleSelectCluster = async (id: string) => {
    if (id === activeClusterId && connectionStatus === "connected") return;
    try {
      await connectToCluster(id);
    } catch {
      // error is stored in zustand state, will show in UI
    }
  };

  const handleDisconnect = async () => {
    await disconnectCluster();
  };

  const statusDot = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-status-healthy animate-pulse";
      case "connecting":
        return "bg-primary animate-pulse";
      case "error":
        return "bg-semantic-red";
      default:
        return "bg-slate-500";
    }
  };

  const statusLabel = () => {
    if (!activeCluster) return "No Cluster";
    switch (connectionStatus) {
      case "connected":
        return activeCluster.name;
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection Failed";
      default:
        return activeCluster.name;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
            connectionStatus === "connected"
              ? "bg-status-healthy/5 border-status-healthy/20 hover:border-status-healthy/40"
              : connectionStatus === "error"
                ? "bg-semantic-red/5 border-semantic-red/20 hover:border-semantic-red/40"
                : "bg-white/5 border-white/10 hover:border-white/20"
          )}
        >
          {connectionStatus === "connecting" ? (
            <Loader2 className="size-3 text-primary animate-spin" />
          ) : (
            <span className={cn("size-2 rounded-full", statusDot())} />
          )}
          <span className={cn(
            "text-sm font-medium max-w-[140px] truncate",
            activeCluster ? (COLOR_TEXT[activeCluster.color] ?? "text-white") : "text-white"
          )}>
            {statusLabel()}
          </span>
          <ChevronDown className="size-3 text-slate-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72" align="start" sideOffset={8}>
        <DropdownMenuLabel>Clusters</DropdownMenuLabel>

        {/* Cluster list */}
        {clusters.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-slate-400 mb-2">No clusters configured</p>
            <button
              onClick={openSettings}
              className="text-xs text-primary hover:underline"
            >
              Add a cluster →
            </button>
          </div>
        ) : (
          clusters.map((cluster) => {
            const isActive = cluster.id === activeClusterId;
            const isThisConnected = isActive && connectionStatus === "connected";

            return (
              <DropdownMenuItem
                key={cluster.id}
                onSelect={() => handleSelectCluster(cluster.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
                  isThisConnected && "bg-status-healthy/10"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    isThisConnected
                      ? "bg-status-healthy animate-pulse"
                      : (COLOR_DOTS[cluster.color] ?? "bg-slate-500")
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    COLOR_TEXT[cluster.color] ?? "text-white"
                  )}>{cluster.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {cluster.bootstrapServers}
                  </p>
                </div>
                {isThisConnected && (
                  <span className="text-[10px] font-mono text-status-healthy shrink-0">
                    ● Live
                  </span>
                )}
              </DropdownMenuItem>
            );
          })
        )}

        {/* Connection error */}
        {connectionStatus === "error" && connectionError && (
          <div className="mx-1 mb-1 px-3 py-2 rounded-lg bg-semantic-red/10 text-semantic-red text-[10px] font-mono">
            {connectionError}
          </div>
        )}

        <DropdownMenuSeparator />

        {/* Footer actions */}
        <div className="flex gap-1">
          {connectionStatus === "connected" && (
            <DropdownMenuItem
              onSelect={handleDisconnect}
              className="flex-1 justify-center text-semantic-red focus:text-semantic-red"
            >
              <Power className="size-3" />
              Disconnect
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={openSettings}
            className="flex-1 justify-center"
          >
            <Settings className="size-3" />
            Manage
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={openSettings}
            className="justify-center text-primary focus:text-primary"
          >
            <Plus className="size-3" />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
