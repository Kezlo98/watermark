/**
 * Interactive footer legend below chart.
 * Each entity = chip with color picker, visibility toggle, remove button.
 * Untracked entities show a ⚠ warning icon with tooltip.
 */

import { cn } from "@/lib/utils";
import { X, AlertTriangle } from "lucide-react";
import type { ChartEntity } from "./chart-entity-types";
import { ChartColorPicker } from "./chart-color-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        "group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono transition-opacity",
        !entity.visible && "opacity-40",
        entity.tracked
          ? "bg-primary/5 border border-primary/10"
          : "bg-white/5",
      )}
    >
      <ChartColorPicker
        currentIndex={entity.colorIndex}
        entities={allEntities}
        onSelect={(i) => onSwapColor(entity.name, i)}
      />

      {/* Warning icon for untracked entities */}
      {!entity.tracked && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="size-3 text-amber-400 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-xs">
              <p>
                Data collection only while on chart.
                Configure tracked entities in Settings to record persistently.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

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
