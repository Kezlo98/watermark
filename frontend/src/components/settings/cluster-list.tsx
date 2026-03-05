import { useState } from "react";
import { Plus, Pencil, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClusterForm } from "./cluster-form";

interface ClusterProfile {
  id: string;
  name: string;
  color: "red" | "orange" | "green" | "purple";
  readOnly: boolean;
}

const MOCK_CLUSTERS: ClusterProfile[] = [
  { id: "1", name: "Local Docker", color: "green", readOnly: false },
  { id: "2", name: "Staging AWS", color: "orange", readOnly: false },
  { id: "3", name: "Production", color: "red", readOnly: true },
];

const COLOR_DOTS: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  purple: "bg-primary",
};

export function ClusterList() {
  const [editingClusterId, setEditingClusterId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
          🌐 Cluster Connections
        </h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
          <Plus className="size-3" />
          Add
        </button>
      </div>

      {/* Cluster profiles */}
      <div className="space-y-2">
        {MOCK_CLUSTERS.map((cluster) => (
          <div
            key={cluster.id}
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-lg border transition-colors",
              editingClusterId === cluster.id
                ? "border-primary/30 bg-primary/5"
                : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn("size-2.5 rounded-full", COLOR_DOTS[cluster.color])} />
              <span className="text-sm font-medium text-white">{cluster.name}</span>
              {cluster.readOnly && (
                <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 bg-white/5 rounded border border-white/10">
                  Read-Only
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditingClusterId(editingClusterId === cluster.id ? null : cluster.id)}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              >
                <Pencil className="size-3.5" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors">
                <Copy className="size-3.5" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-semantic-red rounded hover:bg-semantic-red/10 transition-colors">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {editingClusterId && (
        <ClusterForm
          clusterId={editingClusterId}
          clusterName={MOCK_CLUSTERS.find((c) => c.id === editingClusterId)?.name ?? ""}
          onClose={() => setEditingClusterId(null)}
        />
      )}
    </div>
  );
}
