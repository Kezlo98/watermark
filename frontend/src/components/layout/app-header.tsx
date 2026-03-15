import { useEffect } from "react";
import { Search, Settings } from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { useSearchPaletteStore } from "@/store/search-palette";
import { ClusterDropdown } from "./cluster-dropdown";
import { SearchCommandPalette } from "@/components/shared/search-command-palette";
import { NotificationBell } from "./notification-bell";
import { NotificationPanel } from "./notification-panel";

export function AppHeader() {
  const { openSettings } = useSettingsStore();
  const { toggle: toggleSearch } = useSearchPaletteStore();

  /* Cmd+K hotkey for search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSearch]);

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        {/* Left: Cluster selector + search */}
        <div className="flex items-center gap-4">
          {/* Cluster selector dropdown */}
          <ClusterDropdown />

          {/* Search trigger */}
          <button
            onClick={toggleSearch}
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
          {/* Notification bell */}
          <NotificationBell />

          <button
            id="settings-trigger"
            onClick={openSettings}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      {/* ⌘K Command Palette */}
      <SearchCommandPalette />

      {/* Notification dropdown panel */}
      <NotificationPanel />
    </>
  );
}
