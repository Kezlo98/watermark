import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  Check, 
  ChevronsUpDown, 
  AreaChart as AreaIcon, 
  LineChart as LineIcon, 
  BarChart3 as BarIcon 
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

const TIME_WINDOWS = ["1h", "12h", "1d", "7d", "15d", "30d"] as const;
const CHART_TYPES = [
  { id: "area" as const, label: "Area", icon: AreaIcon },
  { id: "line" as const, label: "Line", icon: LineIcon },
  { id: "bar" as const, label: "Bar", icon: BarIcon },
];

export type ChartType = "area" | "line" | "bar";
export type TimeWindow = (typeof TIME_WINDOWS)[number];
export type ViewMode = "topic" | "group";

interface ChartControlsProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  entities: string[];
  selectedEntity: string;
  onEntityChange: (name: string) => void;
  timeWindow: TimeWindow;
  onTimeWindowChange: (w: TimeWindow) => void;
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
}

/** Controls bar above the lag chart — mode toggle, entity selector, time window, chart type. */
export function ChartControls({
  mode,
  onModeChange,
  entities,
  selectedEntity,
  onEntityChange,
  timeWindow,
  onTimeWindowChange,
  chartType,
  onChartTypeChange,
}: ChartControlsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Mode toggle */}
      <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
        {(["topic", "group"] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-md transition-colors capitalize",
              mode === m
                ? "bg-primary/20 text-primary"
                : "text-slate-400 hover:text-white",
            )}
          >
            {m === "topic" ? "Topics" : "Groups"}
          </button>
        ))}
      </div>

      {/* Combobox Entity selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            className="flex items-center justify-between px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white hover:border-white/20 focus:outline-none focus:border-white/30 truncate min-w-[200px] max-w-[300px] font-mono"
          >
            <span className="truncate">
              {selectedEntity ? selectedEntity : `Select ${mode}...`}
            </span>
            <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 border border-white/10 bg-[#0f1115]" align="start">
          <Command className="bg-transparent text-white">
            <div className="flex items-center border-b border-white/10 px-3">
              <Search className="mr-2 size-4 shrink-0 text-slate-400" />
              <CommandPrimitive.Input 
                placeholder={`Search ${mode}...`} 
                className="flex flex-1 h-10 bg-transparent border-0 outline-none focus:ring-0 text-sm placeholder:text-slate-500 text-white"
              />
            </div>
            <CommandList>
              <CommandEmpty className="text-xs text-slate-500 py-6 text-center">No {mode} found.</CommandEmpty>
              <CommandGroup>
                {entities.map((e) => (
                  <CommandItem
                    key={e}
                    value={e}
                    onSelect={() => {
                      onEntityChange(e === selectedEntity ? "" : e);
                      setOpen(false);
                    }}
                    className="text-xs font-mono cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white aria-selected:bg-white/10 aria-selected:text-white"
                  >
                    <Check
                      className={cn(
                        "mr-2 size-3",
                        selectedEntity === e ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                    {e}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Time window */}
      <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
        {TIME_WINDOWS.map((w) => (
          <button
            key={w}
            onClick={() => onTimeWindowChange(w)}
            className={cn(
              "px-2 py-1 text-xs rounded-md transition-colors",
              timeWindow === w
                ? "bg-primary/20 text-primary"
                : "text-slate-400 hover:text-white",
            )}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Chart type */}
      <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
        {CHART_TYPES.map((ct) => {
          const Icon = ct.icon;
          return (
            <button
              key={ct.id}
              onClick={() => onChartTypeChange(ct.id)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors",
                chartType === ct.id
                  ? "bg-primary/20 text-primary"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Icon className="size-3" />
              {ct.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
