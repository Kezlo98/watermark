import { useEffect, useState, useCallback } from "react";
import { ArrowDownCircle, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import { CheckForUpdate, ApplyUpdate } from "@/lib/wails-client";
import { cn } from "@/lib/utils";

type UpdatePhase = "idle" | "checking" | "downloading" | "verifying" | "applying" | "re-signing" | "done" | "error";

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

interface UpdateStatus {
  phase: string;
  progress: number;
  error?: string;
}

/**
 * Sidebar update banner — shows when a new version is available.
 * Listens for "update:available" Wails events + manual check.
 */
export function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // Listen for backend-pushed update events (periodic check)
  useEffect(() => {
    const cancel = EventsOn("update:available", (info: UpdateInfo) => {
      if (info?.available) {
        setUpdateInfo(info);
        setDismissed(false);
      }
    });
    return () => { cancel(); };
  }, []);

  // Listen for update progress events
  useEffect(() => {
    const cancel = EventsOn("update:progress", (status: UpdateStatus) => {
      setPhase(status.phase as UpdatePhase);
      setProgress(status.progress);
      if (status.error) {
        setErrorMsg(status.error);
      }
    });
    return () => { cancel(); };
  }, []);

  const handleUpdate = useCallback(async () => {
    setPhase("downloading");
    setErrorMsg("");
    try {
      await ApplyUpdate();
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const handleManualCheck = useCallback(async () => {
    setPhase("checking");
    try {
      const info = await CheckForUpdate();
      if (info?.available) {
        setUpdateInfo(info);
        setDismissed(false);
      }
      setPhase("idle");
    } catch {
      setPhase("idle");
    }
  }, []);

  // Nothing to show
  if (!updateInfo?.available || dismissed) {
    return null;
  }

  const isUpdating = phase === "checking" || phase === "downloading" || phase === "verifying" || phase === "applying" || phase === "re-signing";
  const isDone = phase === "done";
  const isError = phase === "error";

  return (
    <div className="mx-3 mb-3">
      <div
        className={cn(
          "relative rounded-xl border px-3.5 py-3 transition-all duration-300",
          isError
            ? "bg-red-500/10 border-red-500/20"
            : isDone
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-primary/10 border-primary/20"
        )}
      >
        {/* Dismiss (only when idle, not updating) */}
        {!isUpdating && !isDone && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 p-0.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            aria-label="Dismiss update"
          >
            <X className="size-3" />
          </button>
        )}

        {/* Error state */}
        {isError && (
          <>
            <div className="flex items-center gap-2 mb-1.5">
              <AlertCircle className="size-3.5 text-red-400" />
              <span className="text-[11px] font-semibold text-red-400">Update Failed</span>
            </div>
            <p className="text-[10px] text-red-400/70 mb-2 line-clamp-2">{errorMsg}</p>
            <button
              onClick={handleUpdate}
              className="w-full text-[11px] font-medium py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </>
        )}

        {/* Done state */}
        {isDone && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-400">
                Updated to {updateInfo.latestVersion}
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/60">Restart the app to use the new version.</p>
          </div>
        )}

        {/* Updating state */}
        {isUpdating && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="size-3.5 text-primary animate-spin" />
              <span className="text-[11px] font-semibold text-primary capitalize">{phase}…</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </>
        )}

        {/* Available state (default) */}
        {!isUpdating && !isDone && !isError && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="size-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary">
                {updateInfo.latestVersion} Available
              </span>
            </div>
            <button
              onClick={handleUpdate}
              className="w-full mt-1.5 text-[11px] font-medium py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Update Now
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { type UpdateInfo };
