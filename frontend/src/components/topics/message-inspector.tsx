import { lazy, Suspense } from "react";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

type MessageFormat = "Auto" | "String" | "JSON" | "Avro" | "Protobuf" | "Hex";

/** Formats a raw message value string for Monaco display. */
function formatMessageValue(
  raw: string,
  format: MessageFormat
): { content: string; language: string } {
  if (format === "String" || format === "Hex") {
    return { content: raw, language: "plaintext" };
  }
  try {
    return { content: JSON.stringify(JSON.parse(raw), null, 2), language: "json" };
  } catch {
    return { content: raw, language: "plaintext" };
  }
}

interface MessageInspectorProps {
  value: string;
  offset: number;
  format: MessageFormat;
  onClose: () => void;
}

export function MessageInspector({ value, offset, format, onClose }: MessageInspectorProps) {
  const { content, language } = formatMessageValue(value, format);

  return (
    <div className="glass-panel overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <span className="text-xs font-mono text-slate-400">
          MESSAGE INSPECTOR (Offset: {offset})
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
          >
            Copy
          </button>
          <button
            onClick={onClose}
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
            language={language}
            theme="vs-dark"
            value={content}
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
  );
}
