import { useEffect, useState, useCallback } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { GetChangelog, ApplyUpdate, SkipVersion } from "@/lib/wails-client";
import { renderChangelogMarkdown } from "@/lib/changelog-markdown-renderer";
import { cn } from "@/lib/utils";

interface ReleaseNote {
  version: string;
  date: string;
  notes: string;
}

interface UpdateInfo {
  available: boolean;
  skipped: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

type ModalState = "loading" | "ready" | "fetch-error" | "updating" | "success" | "update-error";

interface UpdateChangelogModalProps {
  isOpen: boolean;
  onClose: (reason: "skipped" | "updated" | "cancelled") => void;
  updateInfo: UpdateInfo;
}

const INITIAL_SHOW = 5;

export function UpdateChangelogModal({ isOpen, onClose, updateInfo }: UpdateChangelogModalProps) {
  const [state, setState] = useState<ModalState>("loading");
  const [changelog, setChangelog] = useState<ReleaseNote[]>([]);
  const [fetchError, setFetchError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Fetch changelog when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setState("loading");
    setShowAll(false);
    GetChangelog()
      .then((notes) => {
        setChangelog(notes ?? []);
        setState("ready");
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : "Failed to load changelog");
        setState("fetch-error");
      });
  }, [isOpen]);

  const handleSkip = useCallback(async () => {
    await SkipVersion(updateInfo.latestVersion).catch(() => {});
    onClose("skipped");
  }, [updateInfo.latestVersion, onClose]);

  const handleUpdate = useCallback(async () => {
    setState("updating");
    setUpdateError("");
    try {
      await ApplyUpdate();
      setState("success");
      setTimeout(() => onClose("updated"), 3000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Update failed");
      setState("update-error");
    }
  }, [onClose]);

  const handleBackdropClick = useCallback(() => {
    if (state === "updating") return;
    onClose("cancelled");
  }, [state, onClose]);

  if (!isOpen) return null;

  const visibleNotes = showAll ? changelog : changelog.slice(0, INITIAL_SHOW);
  const hiddenCount = changelog.length - INITIAL_SHOW;
  const isUpdating = state === "updating";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="glass-panel w-full max-w-lg flex flex-col"
        style={{ maxHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">
              Update Available
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              v{updateInfo.currentVersion} → v{updateInfo.latestVersion}
            </p>
          </div>
          {!isUpdating && state !== "success" && (
            <button
              onClick={() => onClose("cancelled")}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {/* Loading */}
          {state === "loading" && (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading changelog…</span>
            </div>
          )}

          {/* Fetch error */}
          {state === "fetch-error" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Could not load changelog</p>
                <p className="text-xs text-red-400/70 mt-0.5">{fetchError}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div className="flex items-center gap-2 py-6 justify-center">
              <CheckCircle2 className="size-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                Updated to v{updateInfo.latestVersion} — Restart to apply
              </span>
            </div>
          )}

          {/* Update error */}
          {state === "update-error" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{updateError}</p>
            </div>
          )}

          {/* Updating progress */}
          {state === "updating" && (
            <div className="flex items-center justify-center py-6 gap-2 text-primary">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Downloading update…</span>
            </div>
          )}

          {/* Changelog entries */}
          {(state === "ready" || state === "update-error") && changelog.length > 0 && (
            <div className="space-y-4">
              {visibleNotes.map((note) => (
                <div key={note.version}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                      v{note.version}
                    </span>
                    <span className="text-[10px] text-slate-500">{note.date}</span>
                  </div>
                  <div className="pl-1">{renderChangelogMarkdown(note.notes)}</div>
                </div>
              ))}
              {!showAll && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronDown className="size-3" />
                  Show {hiddenCount} more version{hiddenCount !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {state !== "success" && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5 shrink-0">
            {/* Skip only shown when changelog loaded successfully */}
            {(state === "ready" || state === "update-error") && (
              <button
                onClick={handleSkip}
                disabled={isUpdating}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Skip This Version
              </button>
            )}
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                "text-white bg-primary hover:bg-primary/90"
              )}
            >
              {isUpdating && <Loader2 className="size-3.5 animate-spin" />}
              {isUpdating ? "Updating…" : `Update to v${updateInfo.latestVersion}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export type { UpdateInfo, ReleaseNote };
