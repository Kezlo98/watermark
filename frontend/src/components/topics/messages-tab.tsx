import { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw, Timer, TimerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { ConsumeMessages } from "@/lib/wails-client";
import { MessagesTable } from "./messages-table";
import { MessageInspector } from "./message-inspector";

type MessageFormat = "Auto" | "String" | "JSON" | "Avro" | "Protobuf" | "Hex";
type StartPosition = "Latest" | "Earliest";
const FETCH_LIMIT_OPTIONS = [50, 100, 200, 500] as const;

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- UI state ---
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const startOffset = appliedStart === "Latest" ? -1 : -2;

  const { data: messages = [], refetch, isFetching } = useKafkaQuery(
    ["messages", topicName, String(startOffset), String(appliedLimit)],
    () => ConsumeMessages(topicName, -1, startOffset, appliedLimit),
    {
      refetchInterval: false,   // Disabled — manual refresh only
      refetchOnWindowFocus: false,
      enabled: true,            // Initial fetch on mount
    },
  );

  // --- Refresh handler: apply pending filters then refetch ---
  const handleRefresh = useCallback(() => {
    setAppliedStart(startPosition);
    setAppliedLimit(fetchLimit);
    // refetch will fire automatically when query key changes
    setTimeout(() => refetch(), 0);
  }, [startPosition, fetchLimit, refetch]);

  // --- Auto-refresh interval management ---
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        refetch();
      }, 10_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refetch]);

  return (
    <div className="space-y-4">
      {/* Controls bar */}
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
          {autoRefresh ? "Stop Auto" : "Auto (10s)"}
        </button>

        {/* Message count badge */}
        <span className="ml-auto text-xs font-mono text-slate-500">
          {messages.length} messages fetched
        </span>
      </div>

      {/* Split pane: messages table + inspector */}
      <div className={cn("grid gap-4", selectedMessage ? "grid-cols-[1fr_400px]" : "grid-cols-1")}>
        <MessagesTable
          messages={messages}
          selectedMessage={selectedMessage}
          onSelectMessage={setSelectedMessage}
        />

        {selectedMessage && (
          <MessageInspector
            value={selectedMessage.value}
            offset={selectedMessage.offset}
            format={format}
            onClose={() => setSelectedMessage(null)}
          />
        )}
      </div>
    </div>
  );
}
