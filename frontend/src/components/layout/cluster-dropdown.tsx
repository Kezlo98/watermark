import { useState, useRef, useEffect } from "react";
import { ChevronDown, Power, Settings, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings";
import { useQuery } from "@tanstack/react-query";
import { GetClusters } from "@/lib/wails-client";

const COLOR_DOTS: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  purple: "bg-primary",
};

export function ClusterDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  const handleSelectCluster = async (id: string) => {
    setOpen(false);
    if (id === activeClusterId && connectionStatus === "connected") return;
    try {
      await connectToCluster(id);
    } catch {
      // error is stored in zustand state, will show in UI
    }
  };

  const handleDisconnect = async () => {
    setOpen(false);
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
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
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
        <span className="text-sm font-medium text-white max-w-[140px] truncate">
          {statusLabel()}
        </span>
        <ChevronDown className={cn("size-3 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 glass-panel border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Cluster list */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {clusters.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-400 mb-2">No clusters configured</p>
                <button
                  onClick={() => { setOpen(false); openSettings(); }}
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
                  <button
                    key={cluster.id}
                    onClick={() => handleSelectCluster(cluster.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      isThisConnected
                        ? "bg-status-healthy/10"
                        : "hover:bg-white/5"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full shrink-0",
                        isThisConnected
                          ? "bg-status-healthy animate-pulse"
                          : COLOR_DOTS[cluster.color] ?? "bg-primary"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{cluster.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {cluster.bootstrapServers}
                      </p>
                    </div>
                    {isThisConnected && (
                      <span className="text-[10px] font-mono text-status-healthy shrink-0">
                        ● Live
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Connection error */}
          {connectionStatus === "error" && connectionError && (
            <div className="mx-2 mb-2 px-3 py-2 rounded-lg bg-semantic-red/10 text-semantic-red text-[10px] font-mono">
              {connectionError}
            </div>
          )}

          {/* Footer actions */}
          <div className="border-t border-white/5 p-2 flex gap-1">
            {connectionStatus === "connected" && (
              <button
                onClick={handleDisconnect}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-semantic-red hover:bg-semantic-red/10 rounded-lg transition-colors"
              >
                <Power className="size-3" />
                Disconnect
              </button>
            )}
            <button
              onClick={() => { setOpen(false); openSettings(); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Settings className="size-3" />
              Manage
            </button>
            <button
              onClick={() => { setOpen(false); openSettings(); }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Plus className="size-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
