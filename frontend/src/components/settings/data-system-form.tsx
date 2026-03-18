import { useEffect, useState, useCallback } from "react";
import { Download, Upload, Loader2, ArrowDownCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { GetCurrentVersion, CheckForUpdate } from "@/lib/wails-client";
import { UpdateChangelogModal } from "@/components/layout/update-changelog-modal";
import type { UpdateInfo } from "@/components/layout/update-changelog-modal";

type CheckState = "idle" | "checking" | "up-to-date" | "available" | "skipped" | "done" | "error";

function AppVersionSection() {
  const [version, setVersion] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    GetCurrentVersion().then(setVersion).catch(() => {});
  }, []);

  const handleCheck = useCallback(async () => {
    if (checkState === "available" || checkState === "skipped") {
      setShowModal(true);
      return;
    }

    setCheckState("checking");
    setErrorMsg("");
    try {
      const info = await CheckForUpdate();
      if (info?.available) {
        setUpdateInfo(info as UpdateInfo);
        setCheckState(info.skipped ? "skipped" : "available");
      } else {
        setCheckState("up-to-date");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Check failed");
      setCheckState("error");
    }
  }, [checkState]);

  const handleModalClose = useCallback((reason: "skipped" | "updated" | "cancelled") => {
    setShowModal(false);
    if (reason === "skipped") setCheckState("skipped");
    if (reason === "updated") setCheckState("done");
  }, []);

  const buttonLabel = () => {
    switch (checkState) {
      case "checking": return "Checking…";
      case "up-to-date": return "Up to date";
      case "available": return `Update to ${updateInfo?.latestVersion}`;
      case "skipped": return `Skipped ${updateInfo?.latestVersion}`;
      case "done": return "Restart to apply";
      case "error": return "Retry";
      default: return "Check for Updates";
    }
  };

  const isLoading = checkState === "checking";
  const isAvailable = checkState === "available";
  const isSkipped = checkState === "skipped";
  const isDone = checkState === "done";
  const isError = checkState === "error";

  return (
    <section>
      <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4">
        ℹ️ About
      </h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white font-medium">Watermark</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {version ? `v${version}` : "—"}
          </p>
        </div>
        <button
          onClick={handleCheck}
          disabled={isLoading || isDone || checkState === "up-to-date"}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isAvailable
              ? "bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
              : isSkipped
                ? "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20"
                : isError
                  ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          {isLoading && <Loader2 className="size-3 animate-spin" />}
          {isAvailable && <ArrowDownCircle className="size-3" />}
          {isDone && <CheckCircle2 className="size-3 text-emerald-400" />}
          {isError && <AlertCircle className="size-3" />}
          {buttonLabel()}
        </button>
      </div>
      {isError && errorMsg && (
        <p className="text-xs text-red-400/70 mt-2">{errorMsg}</p>
      )}

      {updateInfo && (
        <UpdateChangelogModal
          isOpen={showModal}
          onClose={handleModalClose}
          updateInfo={updateInfo}
        />
      )}
    </section>
  );
}

export function DataSystemForm() {
  return (
    <div className="space-y-8">
      {/* Data section */}
      <section>
        <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4">
          💻 System & Workspace
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="launch-startup"
              defaultChecked
              className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
            />
            <label htmlFor="launch-startup" className="text-sm text-slate-300">
              Start application when computer starts
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="minimize-tray"
              defaultChecked
              className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
            />
            <label htmlFor="minimize-tray" className="text-sm text-slate-300">
              Minimize to system tray when closed
            </label>
          </div>
        </div>
      </section>

      {/* Import/Export */}
      <section>
        <p className="text-sm text-slate-400 mb-4">
          Share cluster configurations with your team.
        </p>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
            <Download className="size-4" />
            Import Config (.json)
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
            <Upload className="size-4" />
            Export Config (.json)
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            id="include-passwords"
            className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
          />
          <label htmlFor="include-passwords" className="text-xs text-semantic-red">
            Include passwords in export — <strong>⚠️ stored as plaintext, keep file secure</strong>
          </label>
        </div>
      </section>

      {/* About / version */}
      <AppVersionSection />
    </div>
  );
}
