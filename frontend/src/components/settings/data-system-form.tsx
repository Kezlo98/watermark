import { Download, Upload } from "lucide-react";

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
    </div>
  );
}
