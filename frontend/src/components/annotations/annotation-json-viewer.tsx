import { useState, lazy, Suspense } from "react";
import { ChevronRight, Code2, Copy, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Editor = lazy(() => import("@monaco-editor/react"));

interface AnnotationJsonViewerProps {
  annotations: Record<string, unknown>;
}

/**
 * Collapsible read-only Monaco JSON viewer for annotation data.
 * Shows annotations-only shape (no version/wrapper envelope).
 */
export function AnnotationJsonViewer({
  annotations,
}: AnnotationJsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonContent = JSON.stringify(annotations, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic editor height: min 100px, max 300px, ~19px per line
  const lineCount = jsonContent.split("\n").length;
  const editorHeight = Math.min(Math.max(lineCount * 19, 100), 300);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ChevronRight
          className={cn(
            "size-3 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        <Code2 className="size-3.5" />
        Raw Config
      </button>

      {isExpanded && (
        <div className="relative rounded-lg border border-white/5 overflow-hidden">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 p-1.5 text-slate-400 hover:text-white bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
          <Suspense fallback={<div className="flex justify-center items-center h-full p-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>}>
            <Editor
              height={editorHeight}
              language="json"
              value={jsonContent}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: "off",
                folding: true,
                scrollBeyondLastLine: false,
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 12, bottom: 12 },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                renderLineHighlight: "none",
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                  verticalScrollbarSize: 6,
                },
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
