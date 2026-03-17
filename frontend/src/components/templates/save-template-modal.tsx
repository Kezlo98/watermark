import { useState } from "react";
import { X, Bookmark, Plus, Trash2 } from "lucide-react";
import type { TopicConfig } from "@/types/kafka";
import { useTemplates } from "@/hooks/use-templates";

interface ConfigRow {
  key: string;
  value: string;
}

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  /** TopicConfig[] from ConfigurationTab (overridden configs extracted automatically) */
  configs: TopicConfig[];
  partitions: number;
  replicationFactor: number;
  /** Pre-populated config map for edit mode (from Settings panel) */
  initialConfigMap?: Record<string, string>;
  /** Pre-populated metadata for edit mode */
  initialName?: string;
  initialDescription?: string;
  initialPattern?: string;
  /** Template ID when editing an existing template */
  editTemplateId?: string;
}

function suggestPattern(topicName: string): string {
  const parts = topicName.split(".");
  if (parts.length >= 2) return parts[0] + ".*";
  return "";
}

/** Convert TopicConfig[] or Record<string, string> into editable rows */
function buildInitialRows(
  configs: TopicConfig[],
  initialConfigMap?: Record<string, string>,
): ConfigRow[] {
  // Prefer initialConfigMap (edit mode from Settings), fall back to TopicConfig[]
  if (initialConfigMap && Object.keys(initialConfigMap).length > 0) {
    return Object.entries(initialConfigMap).map(([key, value]) => ({
      key,
      value,
    }));
  }

  const overridden = configs.filter((c) => c.isOverridden);
  if (overridden.length > 0) {
    return overridden.map((c) => ({ key: c.name, value: c.value }));
  }

  return [];
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  topicName,
  configs,
  partitions: initialPartitions,
  replicationFactor: initialRF,
  initialConfigMap,
  initialName = "",
  initialDescription = "",
  initialPattern,
  editTemplateId,
}: SaveTemplateModalProps) {
  const { save, update } = useTemplates();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [pattern, setPattern] = useState(
    () => initialPattern ?? suggestPattern(topicName),
  );
  const [partitions, setPartitions] = useState(initialPartitions);
  const [replicationFactor, setReplicationFactor] = useState(initialRF);
  const [configRows, setConfigRows] = useState<ConfigRow[]>(() =>
    buildInitialRows(configs, initialConfigMap),
  );

  if (!isOpen) return null;

  const isEditMode = !!editTemplateId;
  const isPending = save.isPending || update.isPending;

  const handleAddRow = () => {
    setConfigRows([...configRows, { key: "", value: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    setConfigRows(configRows.filter((_, i) => i !== index));
  };

  const handleRowChange = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setConfigRows(
      configRows.map((row, i) =>
        i === index ? { ...row, [field]: val } : row,
      ),
    );
  };

  const resetAndClose = () => {
    onClose();
    setName("");
    setDescription("");
    setPattern(suggestPattern(topicName));
    setConfigRows([]);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    // Build config map from editable rows (skip empty keys)
    const configMap: Record<string, string> = {};
    configRows.forEach((row) => {
      const k = row.key.trim();
      if (k) configMap[k] = row.value;
    });

    const tmpl = {
      id: editTemplateId ?? "",
      name: name.trim(),
      description: description.trim(),
      pattern: pattern.trim(),
      partitions,
      replicationFactor,
      configs: configMap,
      createdAt: "",
      updatedAt: "",
    };

    if (isEditMode) {
      update.mutate(
        { id: editTemplateId, tmpl },
        { onSuccess: resetAndClose },
      );
    } else {
      save.mutate(tmpl, { onSuccess: resetAndClose });
    }
  };

  const hasDuplicateKeys =
    new Set(configRows.map((r) => r.key.trim()).filter(Boolean)).size !==
    configRows.filter((r) => r.key.trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {isEditMode ? "Edit Template" : "Save as Template"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="space-y-5 p-6 overflow-y-auto flex-1">
          {/* Template Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Template Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Payment Topics"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this template"
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Pattern */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Auto-Match Pattern
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g., payment.* (optional)"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-mono text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Use * for any characters, ? for single character. Leave blank to
              disable auto-match.
            </p>
          </div>

          {/* Partitions + RF */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Partitions
              </label>
              <select
                value={partitions}
                onChange={(e) => setPartitions(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                {[1, 3, 6, 12, 24, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Replication Factor
              </label>
              <select
                value={replicationFactor}
                onChange={(e) => setReplicationFactor(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Editable Configs */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                Overridden Configs
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 rounded-md bg-slate-700/50 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <Plus className="size-3" />
                Add Config
              </button>
            </div>

            {configRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/30 px-4 py-6 text-center text-sm text-slate-500">
                No configs added. Click "Add Config" to add key-value pairs.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-1">
                  <span className="text-xs font-medium text-slate-500">
                    Key
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Value
                  </span>
                  <span />
                </div>

                {configRows.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={row.key}
                      onChange={(e) =>
                        handleRowChange(index, "key", e.target.value)
                      }
                      placeholder="retention.ms"
                      className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-white placeholder:text-slate-600 focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) =>
                        handleRowChange(index, "value", e.target.value)
                      }
                      placeholder="604800000"
                      className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-white placeholder:text-slate-600 focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Remove config"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {hasDuplicateKeys && (
              <p className="mt-1.5 text-xs text-yellow-400">
                ⚠ Duplicate config keys detected — only the last value will be
                used.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bookmark className="size-4" />
            {isPending
              ? "Saving..."
              : isEditMode
                ? "Update Template"
                : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
