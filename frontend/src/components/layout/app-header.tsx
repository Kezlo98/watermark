import { useEffect } from "react";
import { Search, Settings, Sun, Moon } from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { useSearchPaletteStore } from "@/store/search-palette";
import { ClusterDropdown } from "./cluster-dropdown";
import { SearchCommandPalette } from "@/components/shared/search-command-palette";

export function AppHeader() {
  const { openSettings, theme, setTheme } = useSettingsStore();
  const { toggle: toggleSearch } = useSearchPaletteStore();

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        {/* Left: Cluster selector + search */}
        <div className="flex items-center gap-4">
          <ClusterDropdown />

          <button
            onClick={toggleSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-border-hover transition-colors"
          >
            <Search className="size-4" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-4 text-[10px] bg-secondary px-1.5 py-0.5 rounded border border-border font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            id="settings-trigger"
            onClick={openSettings}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      <SearchCommandPalette />
    </>
  );
}

