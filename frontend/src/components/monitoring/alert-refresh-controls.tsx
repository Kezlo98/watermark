import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Pause, RefreshCw, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { REFRESH_INTERVALS } from "@/hooks/use-alert-refresh-prefs";

const MANUAL_REFRESH_COOLDOWN_SEC = 5;

interface AlertRefreshControlsProps {
  enabled: boolean;
  intervalMs: number;
  secondsLeft: number;
  onToggle: () => void;
  onIntervalChange: (ms: number) => void;
  onRefresh: () => void;
}

/** Format interval ms to human-readable label. */
function formatInterval(ms: number): string {
  return REFRESH_INTERVALS.find((i) => i.value === ms)?.label ?? `${ms / 1000}s`;
}

/**
 * Two-button refresh controls for the Monitoring page header.
 *
 * Button 1: Auto-refresh toggle with interval dropdown.
 *    - Click the play/pause icon to toggle auto-refresh on/off.
 *    - Click the interval label to open a dropdown to choose interval.
 *
 * Button 2: Manual refresh with 5s cooldown.
 */
export function AlertRefreshControls({
  enabled,
  intervalMs,
  secondsLeft,
  onToggle,
  onIntervalChange,
  onRefresh,
}: AlertRefreshControlsProps) {
  const [spinning, setSpinning] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const handleManualRefresh = useCallback(() => {
    if (cooldownLeft > 0) return;
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 600);

    // Start cooldown countdown
    setCooldownLeft(MANUAL_REFRESH_COOLDOWN_SEC);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onRefresh, cooldownLeft]);

  const isCoolingDown = cooldownLeft > 0;

  return (
    <div className="flex items-center gap-1">
      {/* Auto-refresh toggle + interval picker */}
      <div className="flex items-center rounded border border-white/10 bg-white/3 overflow-hidden">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 text-xs transition-colors",
                  enabled
                    ? "text-emerald-400 hover:text-emerald-300"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {enabled ? (
                  <Pause className="size-3" />
                ) : (
                  <Play className="size-3" />
                )}
                {enabled && (
                  <span className="font-mono tabular-nums text-[11px] min-w-[2ch] text-right">
                    {secondsLeft}s
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {enabled
                ? `Auto-refreshing every ${formatInterval(intervalMs)}. Click to pause.`
                : "Auto-refresh paused. Click to resume."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-4 bg-white/10" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2 py-1.5 text-[11px] text-slate-400 hover:text-white transition-colors font-mono">
              {formatInterval(intervalMs)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            <DropdownMenuLabel>Refresh interval</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={String(intervalMs)}
              onValueChange={(v) => onIntervalChange(Number(v))}
            >
              {REFRESH_INTERVALS.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={String(opt.value)}>
                  <span className="flex items-center justify-between w-full">
                    {opt.label}
                    {opt.value === intervalMs && (
                      <Check className="size-3 text-primary ml-2" />
                    )}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Manual refresh with cooldown */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleManualRefresh}
              disabled={isCoolingDown}
              className={cn(
                "p-1.5 rounded border border-white/10 bg-white/3 transition-colors",
                isCoolingDown
                  ? "text-slate-600 cursor-not-allowed opacity-50"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
              )}
            >
              {isCoolingDown ? (
                <span className="text-[10px] font-mono tabular-nums w-3.5 h-3.5 flex items-center justify-center">
                  {cooldownLeft}
                </span>
              ) : (
                <RefreshCw
                  className={cn(
                    "size-3.5 transition-transform",
                    spinning && "animate-spin",
                  )}
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isCoolingDown
              ? `Wait ${cooldownLeft}s before next refresh`
              : "Refresh now"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
