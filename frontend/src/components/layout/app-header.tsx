import { useState, useEffect } from "react";
import { Search, Settings, Bell, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings";

export function AppHeader() {
  const { openSettings } = useSettingsStore();
  const [searchOpen, setSearchOpen] = useState(false);

  /* Cmd+K hotkey for search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      {/* Left: Cluster selector + search */}
      <div className="flex items-center gap-4">
        {/* Cluster selector */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
          <span className="size-2 rounded-full bg-status-healthy animate-pulse" />
          <span className="text-sm font-medium text-white">Dev Cluster</span>
          <ChevronDown className="size-3 text-slate-400" />
        </button>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition-colors"
        >
          <Search className="size-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-4 text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
          <Plus className="size-3.5" />
          New Resource
        </button>

        <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors relative">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-semantic-orange" />
        </button>

        <button
          id="settings-trigger"
          onClick={openSettings}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </header>
  );
}
