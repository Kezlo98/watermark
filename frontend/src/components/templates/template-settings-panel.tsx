import { useState } from "react";
import { Plus, Download, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/settings";
import { useTemplates } from "@/hooks/use-templates";
import type { TopicTemplate } from "@/types/templates";
import { GetClusters, ExportTemplatesToFile, ImportTemplatesFromFile } from "@/lib/wails-client";
import { TemplateListTable } from "./template-list-table";
import { SaveTemplateModal } from "./save-template-modal";

export function TemplateSettingsPanel() {
  const activeClusterId = useSettingsStore((s) => s.activeClusterId);
  const [viewingClusterId, setViewingClusterId] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [editingTemplate, setEditingTemplate] = useState<TopicTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const effectiveClusterId = viewingClusterId ?? activeClusterId;
  const { templateList, delete: deleteMutation } = useTemplates(effectiveClusterId ?? undefined);

  // Fetch all clusters for dropdown
  const { data: clusters = [] } = useQuery({
    queryKey: ["clusters"],
    queryFn: GetClusters,
    staleTime: 60_000,
  });

  const clusterName = clusters.find((c) => c.id === effectiveClusterId)?.name ?? "cluster";

  const handleExport = async () => {
    if (!effectiveClusterId) return;
    try {
      await ExportTemplatesToFile(effectiveClusterId);
      toast.success("Templates exported successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleImport = async () => {
    if (!effectiveClusterId) return;
    try {
      await ImportTemplatesFromFile(effectiveClusterId, importMode === "merge");
      toast.success("Templates imported successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  };

  const handleDelete = (templateId: string) => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    deleteMutation.mutate(templateId, {
      onSuccess: () => toast.success("Template deleted"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Topic Templates</h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage reusable topic configurations with auto-match patterns
        </p>
      </div>

      {/* Cluster Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Viewing Cluster
          </label>
          <select
            value={effectiveClusterId ?? ""}
            onChange={(e) => setViewingClusterId(e.target.value || null)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.id === activeClusterId ? "(active)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Import/Export Controls */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={importMode === "merge"}
              onChange={() => setImportMode("merge")}
              className="text-primary"
            />
            <span className="text-slate-300">Merge</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
              className="text-primary"
            />
            <span className="text-slate-300">Replace</span>
          </label>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExport}
            disabled={templateList.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-3.5" />
            Export
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-700"
          >
            <Upload className="size-3.5" />
            Import
          </button>
        </div>
      </div>

      {/* Template Count */}
      <div className="text-sm text-slate-400">
        <span className="font-medium text-primary">{templateList.length}</span> templates
        in <span className="font-medium">{clusterName}</span>
      </div>

      {/* Template List */}
      <TemplateListTable
        templates={templateList}
        onEdit={(template) => setEditingTemplate(template)}
        onDelete={handleDelete}
      />

      {/* Create Modal (empty form) */}
      <SaveTemplateModal
        key="create"
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        topicName=""
        configs={[]}
        partitions={6}
        replicationFactor={3}
      />

      {/* Edit Modal (pre-filled form) */}
      {editingTemplate && (
        <SaveTemplateModal
          key={`edit-${editingTemplate.id}`}
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          topicName=""
          configs={[]}
          partitions={editingTemplate.partitions}
          replicationFactor={editingTemplate.replicationFactor}
          initialConfigMap={editingTemplate.configs}
          initialName={editingTemplate.name}
          initialDescription={editingTemplate.description ?? ""}
          initialPattern={editingTemplate.pattern ?? ""}
          editTemplateId={editingTemplate.id}
        />
      )}
    </div>
  );
}
