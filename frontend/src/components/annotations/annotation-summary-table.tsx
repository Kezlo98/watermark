import { Pencil, Trash2 } from "lucide-react";
import type { TopicAnnotation } from "@/types/annotations";
import { OwnershipBadges } from "./ownership-badges";

interface AnnotationSummaryTableProps {
  annotations: Record<string, TopicAnnotation>;
  onEdit?: (topicName: string) => void;
  onRemove?: (topicName: string) => void;
}

export function AnnotationSummaryTable({
  annotations,
  onEdit,
  onRemove,
}: AnnotationSummaryTableProps) {
  const entries = Object.entries(annotations).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  if (entries.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic py-3">
        No annotations for this cluster
      </p>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[hsl(var(--surface-secondary))]">
          <tr className="text-left text-slate-400 uppercase tracking-wider text-[10px]">
            <th className="px-3 py-2">Topic</th>
            <th className="px-3 py-2">Producers</th>
            <th className="px-3 py-2">Consumers</th>
            <th className="px-3 py-2 text-right w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([topic, ann]) => (
            <tr
              key={topic}
              className="border-t border-white/5 hover:bg-white/[0.03] transition-colors"
            >
              <td className="px-3 py-2 font-mono text-white truncate max-w-[200px]">
                {topic}
              </td>
              <td className="px-3 py-2">
                <OwnershipBadges
                  producers={ann.producers ?? []}
                  consumers={[]}
                  maxVisible={3}
                />
              </td>
              <td className="px-3 py-2">
                <OwnershipBadges
                  producers={[]}
                  consumers={ann.consumers ?? []}
                  maxVisible={3}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit?.(topic)}
                    className="p-1 rounded text-slate-400 hover:text-primary hover:bg-white/5 transition-colors"
                    title="Edit annotation"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove?.(topic)}
                    className="p-1 rounded text-slate-400 hover:text-semantic-red hover:bg-white/5 transition-colors"
                    title="Remove annotation"
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
