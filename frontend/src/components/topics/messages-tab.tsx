import { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw, Timer, TimerOff, Radio, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { ConsumeMessages, StartLiveTail, StopLiveTail } from "@/lib/wails-client";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import { MessagesTable } from "./messages-table";
import { MessageInspector } from "./message-inspector";

type MessageFormat = "Auto" | "String" | "JSON" | "Avro" | "Protobuf" | "Hex";
type StartPosition = "Latest" | "Earliest";
const FETCH_LIMIT_OPTIONS = [50, 100, 200, 500] as const;
const LIVE_TAIL_MAX_MESSAGES = 500;
const AUTO_REFRESH_SECONDS = 10;

interface MessagesTabProps {
  topicName: string;
}

export function MessagesTab({ topicName }: MessagesTabProps) {
  // --- Filter state (pending values — applied only on refresh) ---
  const [startPosition, setStartPosition] = useState<StartPosition>("Latest");
  const [format, setFormat] = useState<MessageFormat>("Auto");
  const [fetchLimit, setFetchLimit] = useState(50);

  // --- Applied values (actually used by the query) ---
  const [appliedStart, setAppliedStart] = useState<StartPosition>("Latest");
  const [appliedLimit, setAppliedLimit] = useState(50);

  // --- Auto-refresh ---
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Live-tail state ---
  const [liveTailActive, setLiveTailActive] = useState(false);
  const [liveTailMessages, setLiveTailMessages] = useState<Message[]>([]);

  // --- UI state ---
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const startOffset = appliedStart === "Latest" ? -1 : -2;

  const { data: fetchedMessages = [], refetch, isFetching } = useKafkaQuery(
    ["messages", topicName, String(startOffset), String(appliedLimit)],
    () => ConsumeMessages(topicName, -1, startOffset, appliedLimit),
    {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      enabled: true,
    },
  );

  // --- Decide which messages to show ---
  const messages = liveTailActive ? liveTailMessages : fetchedMessages;

  // --- Refresh handler ---
  const handleRefresh = useCallback(() => {
    setAppliedStart(startPosition);
    setAppliedLimit(fetchLimit);
    setTimeout(() => refetch(), 0);
  }, [startPosition, fetchLimit, refetch]);

  // --- Auto-refresh countdown & interval management ---
  useEffect(() => {
    if (autoRefresh) {
      setCountdown(AUTO_REFRESH_SECONDS);
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            refetch();
            return AUTO_REFRESH_SECONDS;
          }
          return prev - 1;
        });
      }, 1_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refetch]);

  // --- Live-tail event subscription ---
  useEffect(() => {
    if (!liveTailActive) return;

    const cancelMessage = EventsOn("liveTail:message", (msg: Message) => {
      setLiveTailMessages((prev) => {
        const next = [msg, ...prev];
        return next.length > LIVE_TAIL_MAX_MESSAGES
          ? next.slice(0, LIVE_TAIL_MAX_MESSAGES)
          : next;
      });
    });

    const cancelError = EventsOn("liveTail:error", (errMsg: string) => {
      console.error("[LiveTail] error:", errMsg);
    });

    return () => {
      cancelMessage();
      cancelError();
    };
  }, [liveTailActive]);

  // --- Start live-tail ---
  const handleStartLiveTail = useCallback(async () => {
    if (autoRefresh) setAutoRefresh(false);
    setLiveTailMessages([]);
    setSelectedMessage(null);
    try {
      await StartLiveTail(topicName);
      setLiveTailActive(true);
    } catch (err) {
      console.error("[LiveTail] failed to start:", err);
    }
  }, [autoRefresh, topicName]);

  // --- Stop live-tail ---
  const handleStopLiveTail = useCallback(async () => {
    await StopLiveTail();
    setLiveTailActive(false);
  }, []);

  // --- Cleanup on unmount / topic change ---
  useEffect(() => {
    return () => {
      StopLiveTail().catch(() => {});
    };
  }, [topicName]);

  return (
    <div className="space-y-4">
      {/* ── Controls bar: two distinct modes ── */}
      {liveTailActive ? (
        /* ════════ LIVE TAIL MODE ════════ */
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          {/* Pulsing live indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-emerald-400 tracking-wide">
              LIVE TAIL
            </span>
          </div>

          <div className="h-4 w-px bg-emerald-500/20" />

          {/* Topic name */}
          <span className="text-xs font-mono text-slate-400">
            {topicName}
          </span>

          {/* Message count */}
          <span className="text-xs font-mono text-slate-500">
            · {liveTailMessages.length} messages
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stop button */}
          <button
            onClick={handleStopLiveTail}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
          >
            <Square className="size-3 fill-current" />
            Stop
          </button>
        </div>
      ) : (
        /* ════════ BROWSE MODE ════════ */
        <div className="flex items-center gap-3 flex-wrap">
          {/* Start position */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Start:</span>
            <select
              value={startPosition}
              onChange={(e) => setStartPosition(e.target.value as StartPosition)}
              className="h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option>Latest</option>
              <option>Earliest</option>
            </select>
          </div>

          {/* Format */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Format:</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as MessageFormat)}
              className="h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {(["Auto", "String", "JSON", "Avro", "Protobuf", "Hex"] as MessageFormat[]).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Fetch limit */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Limit:</span>
            <select
              value={fetchLimit}
              onChange={(e) => setFetchLimit(Number(e.target.value))}
              className="h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {FETCH_LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10" />

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
              "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20",
              isFetching && "opacity-60 cursor-wait"
            )}
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            {isFetching ? "Fetching…" : "Refresh"}
          </button>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
              autoRefresh
                ? "text-status-healthy bg-status-healthy/10 border-status-healthy/20"
                : "text-slate-400 bg-white/5 border-white/10 hover:bg-white/10"
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

          {/* Live Tail button */}
          <button
            onClick={handleStartLiveTail}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
          >
            <Radio className="size-3.5" />
            Live Tail
          </button>

          {/* Message count badge */}
          <span className="ml-auto text-xs font-mono text-slate-500">
            {messages.length} messages fetched
          </span>
        </div>
      )}

      <MessagesTable
        messages={messages}
        selectedMessage={selectedMessage}
        onSelectMessage={setSelectedMessage}
        inspectorOpen={!!selectedMessage}
      />

      {/* Inspector: shown below table when a message is selected */}
      {selectedMessage && (
        <MessageInspector
          value={selectedMessage.value}
          offset={selectedMessage.offset}
          format={format}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
}
