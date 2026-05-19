import { useState, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/settings";
import { useTemplates } from "@/hooks/use-templates";
import type { TopicTemplate } from "@/types/templates";
import { GetClusters, ExportTemplatesToFile, ImportTemplatesFromFile } from "@/lib/wails-client";
import { TemplateListTable } from "./template-list-table";
import { SaveTemplateModal } from "./save-template-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TemplateSettingsPanel() {
  const activeClusterId = useSettingsStore((s) => s.activeClusterId);
  const [viewingClusterId, setViewingClusterId] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [editingTemplate, setEditingTemplate] = useState<TopicTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

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

  const handleDeleteRequest = useCallback((templateId: string) => {
    setDeletingTemplateId(templateId);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingTemplateId) return;
    deleteMutation.mutate(deletingTemplateId, {
      onSuccess: () => toast.success("Template deleted"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
    setDeletingTemplateId(null);
  }, [deletingTemplateId, deleteMutation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Topic Templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage reusable topic configurations with auto-match patterns
        </p>
      </div>

      {/* Cluster Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-foreground">
            Viewing Cluster
          </label>
          <Select
            value={effectiveClusterId ?? ""}
            onValueChange={(v) => setViewingClusterId(v || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select cluster" />
            </SelectTrigger>
            <SelectContent>
              {clusters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.id === activeClusterId ? "(active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Icon name="plus" className="size-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Import/Export Controls */}
      <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-card/30 p-4">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={importMode === "merge"}
              onChange={() => setImportMode("merge")}
              className="text-primary"
            />
            <span className="text-foreground">Merge</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
              className="text-primary"
            />
            <span className="text-foreground">Replace</span>
          </label>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExport}
            disabled={templateList.length === 0}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="download" className="size-3.5" />
            Export
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <Icon name="upload" className="size-3.5" />
            Import
          </button>
        </div>
      </div>

      {/* Template Count */}
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-primary">{templateList.length}</span> templates
        in <span className="font-medium">{clusterName}</span>
      </div>

      {/* Template List */}
      <TemplateListTable
        templates={templateList}
        onEdit={(template) => setEditingTemplate(template)}
        onDelete={handleDeleteRequest}
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

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!deletingTemplateId} onOpenChange={(open) => !open && setDeletingTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
