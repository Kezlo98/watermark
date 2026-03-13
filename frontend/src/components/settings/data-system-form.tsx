import { useEffect, useState, useCallback } from "react";
import { Download, Upload, Loader2, ArrowDownCircle, CheckCircle2 } from "lucide-react";
import { GetCurrentVersion, CheckForUpdate, ApplyUpdate } from "@/lib/wails-client";
import type { UpdateInfo } from "@/components/layout/update-banner";

type CheckState = "idle" | "checking" | "up-to-date" | "available" | "updating" | "done";

function AppVersionSection() {
  const [version, setVersion] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    GetCurrentVersion().then(setVersion).catch(() => {});
  }, []);

  const handleCheck = useCallback(async () => {
    if (checkState === "available" || checkState === "done") {
      // Trigger update
      setCheckState("updating");
      try {
        await ApplyUpdate();
        setCheckState("done");
      } catch {
        setCheckState("available");
      }
      return;
    }

    setCheckState("checking");
    try {
      const info = await CheckForUpdate();
      if (info?.available) {
        setUpdateInfo(info);
        setCheckState("available");
      } else {
        setCheckState("up-to-date");
      }
    } catch {
      setCheckState("idle");
    }
  }, [checkState]);

  const buttonLabel = () => {
    switch (checkState) {
      case "checking": return "Checking…";
      case "up-to-date": return "Up to date";
      case "available": return `Update to ${updateInfo?.latestVersion}`;
      case "updating": return "Updating…";
      case "done": return "Restart to apply";
      default: return "Check for Updates";
    }
  };

  const isLoading = checkState === "checking" || checkState === "updating";
  const isAvailable = checkState === "available";
  const isDone = checkState === "done";

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
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          {isLoading && <Loader2 className="size-3 animate-spin" />}
          {isAvailable && <ArrowDownCircle className="size-3" />}
          {isDone && <CheckCircle2 className="size-3 text-emerald-400" />}
          {buttonLabel()}
        </button>
      </div>
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
