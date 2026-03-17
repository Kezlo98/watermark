import { Pencil, Trash2 } from "lucide-react";
import type { TopicTemplate } from "@/types/templates";

interface TemplateListTableProps {
  templates: TopicTemplate[];
  onEdit: (template: TopicTemplate) => void;
  onDelete: (templateId: string) => void;
}

export function TemplateListTable({
  templates,
  onEdit,
  onDelete,
}: TemplateListTableProps) {
  if (templates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-slate-400">
        No templates yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/30">
            <th className="px-4 py-3 text-left font-medium text-slate-300">
              Name
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">
              Pattern
            </th>
            <th className="px-4 py-3 text-center font-medium text-slate-300">
              Partitions
            </th>
            <th className="px-4 py-3 text-center font-medium text-slate-300">
              RF
            </th>
            <th className="px-4 py-3 text-center font-medium text-slate-300">
              Configs
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr
              key={template.id}
              className="border-b border-slate-700/30 transition-colors hover:bg-slate-800/20"
            >
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-slate-200">
                    {template.name}
                  </span>
                  {template.description && (
                    <span className="text-xs text-slate-400">
                      {template.description}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-300">
                {template.pattern || "—"}
              </td>
              <td className="px-4 py-3 text-center text-slate-300">
                {template.partitions}
              </td>
              <td className="px-4 py-3 text-center text-slate-300">
                {template.replicationFactor}
              </td>
              <td className="px-4 py-3 text-center text-slate-400">
                {Object.keys(template.configs || {}).length}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(template)}
                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-primary"
                    title="Edit template"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(template.id)}
                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                    title="Delete template"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
