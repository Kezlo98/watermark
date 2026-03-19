import { lazy, Suspense } from "react";
import { Slider } from "@/components/ui/slider";
import { useSettingsStore } from "@/store/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const SAMPLE_JSON = `{
  "user": "test",
  "status": "active",
  "timestamp": 1709640000,
  "metadata": {
    "source": "kafka",
    "version": "3.6"
  }
}`;

export function AppearanceForm() {
  const { theme, setTheme, density, setDensity, codeFont, setCodeFont, codeFontSize, setCodeFontSize } =
    useSettingsStore();

  return (
    <div className="space-y-8">
      {/* Theme */}
      <section>
        <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4">
          🎨 Appearance
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Theme</label>
            <Select value={theme} onValueChange={(v) => setTheme(v as "dark" | "light" | "system")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light" disabled>Light (Coming Soon)</SelectItem>
                <SelectItem value="system" disabled>System (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">UI Density</label>
            <Select value={density} onValueChange={(v) => setDensity(v as "compact" | "comfortable" | "spacious")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">Controls row height and padding in tables</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Code Font</label>
              <input
                type="text"
                value={codeFont}
                onChange={(e) => setCodeFont(e.target.value)}
                className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Font Size ({codeFontSize}px)</label>
              <Slider
                value={[codeFontSize]}
                onValueChange={([v]) => setCodeFontSize(v)}
                min={12}
                max={16}
                step={1}
                className="w-full mt-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section>
        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Preview</label>
        <div className="glass-panel overflow-hidden">
          <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading preview...</div>}>
            <MonacoEditor
              height="180px"
              language="json"
              theme="vs-dark"
              value={SAMPLE_JSON}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: codeFontSize,
                fontFamily: codeFont,
                lineNumbers: "on",
                renderLineHighlight: "none",
                padding: { top: 12 },
              }}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
