/**
 * Interactive footer legend below chart.
 * Each entity = chip with color picker, visibility toggle, remove button.
 */

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { ChartEntity } from "./chart-entity-types";
import { ChartColorPicker } from "./chart-color-picker";

interface ChartFooterLegendProps {
  entities: ChartEntity[];
  onToggleVisibility: (name: string) => void;
  onRemove: (name: string) => void;
  onSwapColor: (name: string, colorIndex: number) => void;
}

function ChartEntityChip({
  entity,
  allEntities,
  onToggleVisibility,
  onRemove,
  onSwapColor,
}: {
  entity: ChartEntity;
  allEntities: ChartEntity[];
  onToggleVisibility: (name: string) => void;
  onRemove: (name: string) => void;
  onSwapColor: (name: string, colorIndex: number) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-xs font-mono transition-opacity",
        !entity.visible && "opacity-40",
      )}
    >
      <ChartColorPicker
        currentIndex={entity.colorIndex}
        entities={allEntities}
        onSelect={(i) => onSwapColor(entity.name, i)}
      />
      <button
        onClick={() => onToggleVisibility(entity.name)}
        className="text-slate-300 hover:text-white transition-colors truncate max-w-[150px]"
        title={entity.visible ? "Click to hide" : "Click to show"}
      >
        {entity.name}
      </button>
      <button
        onClick={() => onRemove(entity.name)}
        className="opacity-0 group-hover:opacity-100 ml-1 text-slate-500 hover:text-red-400 transition-all"
        title="Remove"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

export function ChartFooterLegend({
  entities,
  onToggleVisibility,
  onRemove,
  onSwapColor,
}: ChartFooterLegendProps) {
  if (entities.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
      {entities.map((entity) => (
        <ChartEntityChip
          key={entity.name}
          entity={entity}
          allEntities={entities}
          onToggleVisibility={onToggleVisibility}
          onRemove={onRemove}
          onSwapColor={onSwapColor}
        />
      ))}
    </div>
  );
}
