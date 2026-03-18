import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportPreviewModalProps {
  open: boolean;
  jsonData: string;
  mode: "merge" | "replace";
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
}

interface ImportStats {
  totalTopics: number;
  clusters: number;
  valid: boolean;
  error?: string;
}

export function ImportPreviewModal({
  open,
  jsonData,
  mode,
  onConfirm,
  onCancel,
  isImporting,
}: ImportPreviewModalProps) {
  const stats = useMemo<ImportStats>(() => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.annotations || typeof parsed.annotations !== "object") {
        return { totalTopics: 0, clusters: 0, valid: false, error: "Invalid format: missing 'annotations' field" };
      }

      const clusters = Object.keys(parsed.annotations).length;
      let totalTopics = 0;
      for (const clusterTopics of Object.values(parsed.annotations)) {
        if (typeof clusterTopics === "object" && clusterTopics !== null) {
          totalTopics += Object.keys(clusterTopics).length;
        }
      }

      return { totalTopics, clusters, valid: true };
    } catch {
      return { totalTopics: 0, clusters: 0, valid: false, error: "Invalid JSON" };
    }
  }, [jsonData]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {stats.valid ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Topics
                  </p>
                  <p className="text-lg font-mono font-bold text-primary">
                    {stats.totalTopics}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Clusters
                  </p>
                  <p className="text-lg font-mono font-bold text-white">
                    {stats.clusters}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-slate-400">
                  Mode:{" "}
                  <span className="text-white font-medium">
                    {mode === "merge"
                      ? "Merge (keep existing)"
                      : "Replace (overwrite all)"}
                  </span>
                </p>
                {mode === "replace" && (
                  <p className="text-xs text-status-rebalancing mt-1">
                    ⚠️ This will overwrite all existing annotations
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="p-3 bg-semantic-red/10 border border-semantic-red/20 rounded-lg">
              <p className="text-xs text-semantic-red font-mono">
                {stats.error}
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!stats.valid || isImporting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {isImporting ? "Importing..." : "Apply"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
