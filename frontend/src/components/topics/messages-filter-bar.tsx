import { RefreshCw, Timer, TimerOff, Radio, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StartPosition, MessageFormat } from "@/types/kafka";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FETCH_LIMIT_OPTIONS = [50, 100, 200, 500] as const;

interface MessagesFilterBarProps {
  startPosition: StartPosition;
  onStartPositionChange: (pos: StartPosition) => void;
  customOffset: number;
  onCustomOffsetChange: (offset: number) => void;
  fromDate: string;
  onFromDateChange: (date: string) => void;
  format: MessageFormat;
  onFormatChange: (fmt: MessageFormat) => void;
  fetchLimit: number;
  onFetchLimitChange: (limit: number) => void;
  bodyFilter: string;
  onBodyFilterChange: (filter: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
  autoRefresh: boolean;
  onAutoRefreshToggle: () => void;
  countdown: number;
  onStartLiveTail: () => void;
  messageCount: number;
  selectMode: boolean;
  onSelectModeToggle: () => void;
  selectedCount: number;
}

export function MessagesFilterBar({
  startPosition,
  onStartPositionChange,
  customOffset,
  onCustomOffsetChange,
  fromDate,
  onFromDateChange,
  format,
  onFormatChange,
  fetchLimit,
  onFetchLimitChange,
  bodyFilter,
  onBodyFilterChange,
  onRefresh,
  isFetching,
  autoRefresh,
  onAutoRefreshToggle,
  countdown,
  onStartLiveTail,
  messageCount,
  selectMode,
  onSelectModeToggle,
  selectedCount,
}: MessagesFilterBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Start position */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">Start:</span>
        <Select value={startPosition} onValueChange={(v) => onStartPositionChange(v as StartPosition)}>
          <SelectTrigger className="h-8 w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Latest">Latest</SelectItem>
            <SelectItem value="Earliest">Earliest</SelectItem>
            <SelectItem value="CustomOffset">Custom Offset</SelectItem>
            <SelectItem value="FromDate">From Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom offset input */}
      {startPosition === "CustomOffset" && (
        <input
          type="number"
          min={0}
          value={customOffset}
          onChange={(e) => onCustomOffsetChange(Math.max(0, Number(e.target.value)))}
          placeholder="Offset"
          className="h-8 w-28 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      )}

      {/* From date input */}
      {startPosition === "FromDate" && (
        <input
          type="datetime-local"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      )}

      {/* Format */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">Format:</span>
        <Select value={format} onValueChange={(v) => onFormatChange(v as MessageFormat)}>
          <SelectTrigger className="h-8 w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["Auto", "String", "JSON", "Avro", "Protobuf", "Hex"] as MessageFormat[]).map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fetch limit */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">Limit:</span>
        <Select value={String(fetchLimit)} onValueChange={(v) => onFetchLimitChange(Number(v))}>
          <SelectTrigger className="h-8 w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FETCH_LIMIT_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Body contains filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">Contains:</span>
        <input
          type="text"
          value={bodyFilter}
          onChange={(e) => onBodyFilterChange(e.target.value)}
          placeholder="key or value…"
          className="h-8 w-36 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10" />

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={isFetching}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
          "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20",
          isFetching && "opacity-60 cursor-wait",
        )}
      >
        <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
        {isFetching ? "Fetching…" : "Refresh"}
      </button>

      {/* Auto-refresh toggle */}
      <button
        onClick={onAutoRefreshToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
          autoRefresh
            ? "text-status-healthy bg-status-healthy/10 border-status-healthy/20"
            : "text-slate-400 bg-white/5 border-white/10 hover:bg-white/10",
        )}
      >
        {autoRefresh ? <TimerOff className="size-3.5" /> : <Timer className="size-3.5" />}
        {autoRefresh ? (
          <>
            Stop
            <span className="tabular-nums font-mono text-xs opacity-75">({countdown}s)</span>
          </>
        ) : (
          "Auto (10s)"
        )}
      </button>

      {/* Select mode toggle */}
      <button
        onClick={onSelectModeToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
          selectMode
            ? "text-primary bg-primary/10 border-primary/20"
            : "text-slate-400 bg-white/5 border-white/10 hover:bg-white/10",
        )}
      >
        <CheckSquare className="size-3.5" />
        Select{selectedCount > 0 && ` (${selectedCount})`}
      </button>

      {/* Live Tail */}
      <button
        onClick={onStartLiveTail}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
      >
        <Radio className="size-3.5" />
        Live Tail
      </button>

      {/* Message count */}
      <span className="ml-auto text-xs font-mono text-slate-500">
        {messageCount} messages shown
      </span>
    </div>
  );
}
