import { useState, lazy, Suspense } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

type MessageFormat = "Auto" | "String" | "JSON" | "Avro" | "Protobuf" | "Hex";

interface MockMessage {
  partition: number;
  offset: number;
  timestamp: string;
  key: string;
  value: string;
}

const MOCK_MESSAGES: MockMessage[] = [
  { partition: 0, offset: 45901, timestamp: "21:42:01.001", key: '"u_10"', value: '{"name": "Alex", "action": "SIGN_UP", "email": "alex@example.com"}' },
  { partition: 2, offset: 45902, timestamp: "21:42:05.420", key: '"u_11"', value: '{"name": "John", "action": "SIGN_UP", "email": "john@example.com"}' },
  { partition: 1, offset: 45903, timestamp: "21:42:08.112", key: '"u_12"', value: '{"name": "Sara", "action": "LOGIN", "email": "sara@example.com"}' },
  { partition: 0, offset: 45904, timestamp: "21:42:12.650", key: '"u_13"', value: '{"name": "Mike", "action": "SIGN_UP", "email": "mike@example.com"}' },
  { partition: 3, offset: 45905, timestamp: "21:42:15.333", key: '"u_14"', value: '{"name": "Lisa", "action": "PASSWORD_RESET", "email": "lisa@example.com"}' },
];

interface MessagesTabProps {
  topicName: string;
}

export function MessagesTab({ topicName }: MessagesTabProps) {
  const [isLiveTail, setIsLiveTail] = useState(false);
  const [format, setFormat] = useState<MessageFormat>("Auto");
  const [selectedMessage, setSelectedMessage] = useState<MockMessage | null>(null);

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsLiveTail(!isLiveTail)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
            isLiveTail
              ? "text-status-healthy bg-status-healthy/10 border-status-healthy/20"
              : "text-slate-400 bg-white/5 border-white/10 hover:bg-white/10"
          )}
        >
          {isLiveTail ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {isLiveTail ? "Pause" : "Live Tail"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Start:</span>
          <select className="h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50">
            <option>Latest</option>
            <option>Earliest</option>
            <option>Timestamp</option>
          </select>
        </div>

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
      </div>

      {/* Split pane: messages table + inspector */}
      <div className={cn("grid gap-4", selectedMessage ? "grid-cols-[1fr_400px]" : "grid-cols-1")}>
        {/* Messages table */}
        <div className="glass-panel overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">P</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Offset</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Key</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_MESSAGES.map((msg) => (
                <tr
                  key={`${msg.partition}-${msg.offset}`}
                  onClick={() => setSelectedMessage(msg)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedMessage?.offset === msg.offset
                      ? "bg-primary/10"
                      : "hover:bg-white/5"
                  )}
                >
                  <td className="px-4 py-3 text-sm font-mono text-slate-300">{msg.partition}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-300">{msg.offset}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-400">{msg.timestamp}</td>
                  <td className="px-4 py-3 text-sm font-mono text-semantic-cyan">{msg.key}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-300 truncate max-w-xs">{msg.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Message inspector */}
        {selectedMessage && (
          <div className="glass-panel overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
              <span className="text-xs font-mono text-slate-400">
                MESSAGE INSPECTOR (Offset: {selectedMessage.offset})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(selectedMessage.value)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-[300px]">
              <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading editor...</div>}>
                <MonacoEditor
                  height="300px"
                  language="json"
                  theme="vs-dark"
                  value={JSON.stringify(JSON.parse(selectedMessage.value), null, 2)}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: "JetBrains Mono",
                    lineNumbers: "off",
                    folding: true,
                    renderLineHighlight: "none",
                    padding: { top: 12 },
                  }}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
