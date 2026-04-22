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
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No templates yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-card/30">
            <th className="px-4 py-3 text-left font-medium text-foreground">
              Name
            </th>
            <th className="px-4 py-3 text-left font-medium text-foreground">
              Pattern
            </th>
            <th className="px-4 py-3 text-center font-medium text-foreground">
              Partitions
            </th>
            <th className="px-4 py-3 text-center font-medium text-foreground">
              RF
            </th>
            <th className="px-4 py-3 text-center font-medium text-foreground">
              Configs
            </th>
            <th className="px-4 py-3 text-right font-medium text-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr
              key={template.id}
              className="border-b border-border/30 transition-colors hover:bg-card/20"
            >
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">
                    {template.name}
                  </span>
                  {template.description && (
                    <span className="text-xs text-muted-foreground">
                      {template.description}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-foreground">
                {template.pattern || "—"}
              </td>
              <td className="px-4 py-3 text-center text-foreground">
                {template.partitions}
              </td>
              <td className="px-4 py-3 text-center text-foreground">
                {template.replicationFactor}
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground">
                {Object.keys(template.configs || {}).length}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(template)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                    title="Edit template"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(template.id)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
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
