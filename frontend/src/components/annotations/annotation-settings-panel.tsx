import { useState } from "react";
import { Download, Upload, FileJson } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetAnnotations,
  GetClusters,
  DeleteAnnotation,
  ExportToFile,
  ExportAllToFile,
  ImportFromFile,
} from "@/lib/wails-client";
import { useSettingsStore } from "@/store/settings";
import { useAnnotations } from "@/hooks/use-annotations";
import { AnnotationSummaryTable } from "./annotation-summary-table";
import { AnnotationJsonViewer } from "./annotation-json-viewer";
import { AnnotationEditorModal } from "./annotation-editor-modal";

/**
 * Annotation management panel for Settings overlay.
 * Supports viewing/exporting/importing annotations for any configured cluster
 * without switching the active connection.
 */
export function AnnotationSettingsPanel() {
  const activeClusterId = useSettingsStore((s) => s.activeClusterId);
  const { invalidate } = useAnnotations();
  const queryClient = useQueryClient();

  const [viewingClusterId, setViewingClusterId] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);

  const effectiveClusterId = viewingClusterId ?? activeClusterId;

  /* Fetch all configured clusters for the dropdown */
  const { data: clusters = [] } = useQuery({
    queryKey: ["clusters"],
    queryFn: GetClusters,
    staleTime: 60_000,
  });

  /* Fetch annotations for the currently-viewed cluster */
  const { data: viewingAnnotations = {} } = useQuery({
    queryKey: ["annotations", effectiveClusterId],
    queryFn: () => GetAnnotations(effectiveClusterId!),
    enabled: !!effectiveClusterId,
  });

  const annotatedCount = Object.keys(viewingAnnotations).length;
  const clusterName =
    clusters.find((c) => c.id === effectiveClusterId)?.name ?? "cluster";

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleExportCurrent = async () => {
    if (!effectiveClusterId) return;
    try {
      setError(null);
      await ExportToFile(effectiveClusterId);
      showSuccess("Exported successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleExportAll = async () => {
    try {
      setError(null);
      await ExportAllToFile();
      showSuccess("Exported successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleImport = async () => {
    if (!effectiveClusterId) return;
    try {
      setError(null);
      await ImportFromFile(effectiveClusterId, importMode === "merge");
      invalidateViewing();
      showSuccess("Import complete!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  const invalidateViewing = () => {
    queryClient.invalidateQueries({ queryKey: ["annotations", effectiveClusterId] });
    invalidate();
  };

  const handleEdit = (topicName: string) => {
    setEditingTopic(topicName);
  };

  const handleRemove = async (topicName: string) => {
    if (!effectiveClusterId) return;
    try {
      setError(null);
      await DeleteAnnotation(effectiveClusterId, topicName);
      invalidateViewing();
      showSuccess(`Removed annotation for ${topicName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileJson className="size-4 text-primary" />
        <h3 className="text-sm font-display font-bold text-white">
          Topic Annotations
        </h3>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Share topic ownership tags with your team.{" "}
        <span className="text-slate-500">
          No credentials are included in exports.
        </span>
      </p>

      {/* Cluster selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400">Cluster:</label>
        <select
          value={effectiveClusterId ?? ""}
          onChange={(e) => setViewingClusterId(e.target.value || null)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        >
          {clusters.length === 0 && (
            <option value="">No clusters configured</option>
          )}
          {clusters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="text-xs font-mono text-slate-400">
          <span className="text-primary">{annotatedCount}</span> annotated
        </span>
      </div>

      {/* Summary table */}
      <AnnotationSummaryTable
        annotations={viewingAnnotations}
        onEdit={handleEdit}
        onRemove={handleRemove}
      />

      {/* JSON Config Viewer */}
      {effectiveClusterId && (
        <AnnotationJsonViewer annotations={viewingAnnotations} />
      )}

      <div className="border-t border-white/5 pt-4" />

      {/* Import section */}
      <div className="space-y-3">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="radio"
              name="import-mode"
              checked={importMode === "merge"}
              onChange={() => setImportMode("merge")}
              className="text-primary focus:ring-primary/50"
            />
            Merge (keep existing)
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="radio"
              name="import-mode"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
              className="text-primary focus:ring-primary/50"
            />
            Replace (overwrite all)
          </label>
        </div>

        <button
          onClick={handleImport}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Upload className="size-3.5" />
          Import into {clusterName}
        </button>
      </div>

      <div className="border-t border-white/5 pt-4" />

      {/* Export buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleExportCurrent}
          disabled={!effectiveClusterId}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          <Download className="size-3.5" />
          Export {clusterName}
        </button>
        <button
          onClick={handleExportAll}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Download className="size-3.5" />
          Export All Clusters
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <p className="text-xs text-semantic-red font-mono">{error}</p>
      )}
      {success && (
        <p className="text-xs text-status-healthy font-mono">{success}</p>
      )}

      {/* Editor modal */}
      {editingTopic && (
        <AnnotationEditorModal
          topicName={editingTopic}
          open={!!editingTopic}
          onClose={() => {
            setEditingTopic(null);
            invalidateViewing();
          }}
        />
      )}
    </div>
  );
}
