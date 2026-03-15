import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { kafka } from "../../../wailsjs/go/models";

type ProduceResult = kafka.ProduceResult;

interface BatchReplayProgressProps {
  total: number;
  completed: number;
  failed: number;
  results: ProduceResult[];
  isSending: boolean;
}

export function BatchReplayProgress({ total, completed, failed, results, isSending }: BatchReplayProgressProps) {
  const [expanded, setExpanded] = useState(false);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const succeeded = completed - failed;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>{isSending ? "Replaying..." : completed === total ? "Done" : "Ready"}</span>
          <span>{completed}/{total}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      {completed > 0 && (
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1 text-status-healthy">
            <CheckCircle2 className="size-3.5" />
            {succeeded} sent
          </span>
          {failed > 0 && (
            <span className="flex items-center gap-1 text-semantic-red">
              <XCircle className="size-3.5" />
              {failed} failed
            </span>
          )}
          {isSending && <Loader2 className="size-3.5 animate-spin text-primary" />}
        </div>
      )}

      {/* Expandable failures */}
      {results.some(r => r.error) && (
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? "Hide" : "Show"} failures
          </button>
          {expanded && (
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {results.filter(r => r.error).map(r => (
                <div key={r.index} className="text-xs font-mono text-semantic-red px-2 py-1 bg-semantic-red/5 rounded">
                  #{r.index}: {r.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
