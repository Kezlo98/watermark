import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface OwnershipBadgesProps {
  producers: string[];
  consumers: string[];
  maxVisible?: number;
  onEdit?: () => void;
}

export function OwnershipBadges({
  producers,
  consumers,
  maxVisible = 2,
  onEdit,
}: OwnershipBadgesProps) {
  const hasAny = producers.length > 0 || consumers.length > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1",
        onEdit && "cursor-pointer group"
      )}
      onClick={(e) => {
        if (onEdit) {
          e.stopPropagation();
          onEdit();
        }
      }}
    >
      {/* Producer badges */}
      {producers.slice(0, maxVisible).map((name) => (
        <span
          key={`p-${name}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded border bg-purple-500/15 text-purple-300 border-purple-500/30 whitespace-nowrap"
        >
          <span className="size-1.5 rounded-full bg-purple-400" />
          {name}
        </span>
      ))}
      {producers.length > maxVisible && (
        <span className="text-[10px] font-mono text-purple-400/70">
          +{producers.length - maxVisible}
        </span>
      )}

      {/* Consumer badges */}
      {consumers.slice(0, maxVisible).map((name) => (
        <span
          key={`c-${name}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded border bg-blue-500/15 text-blue-300 border-blue-500/30 whitespace-nowrap"
        >
          <span className="size-1.5 rounded-full bg-blue-400" />
          {name}
        </span>
      ))}
      {consumers.length > maxVisible && (
        <span className="text-[10px] font-mono text-blue-400/70">
          +{consumers.length - maxVisible}
        </span>
      )}

      {/* Edit hint */}
      {onEdit && !hasAny && (
        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors italic">
          + tag
        </span>
      )}
      {onEdit && hasAny && (
        <Pencil className="size-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
      )}
    </div>
  );
}
