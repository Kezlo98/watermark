import { create } from "zustand";
import type { ThemeMode, UIDensity } from "@/types/config";
import {
  Connect,
  Disconnect,
  IsConnected,
  GetActiveClusterID,
  SetActiveCluster,
} from "@/lib/wails-client";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface SettingsState {
  /* Theme */
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  /* UI Density */
  density: UIDensity;
  setDensity: (density: UIDensity) => void;

  /* Active Cluster */
  activeClusterId: string | null;

  /* Connection */
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  connectToCluster: (id: string) => Promise<void>;
  disconnectCluster: () => Promise<void>;
  initializeConnection: () => Promise<void>;

  /* Settings Overlay */
  isSettingsOpen: boolean;
  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;

  /* Editor config */
  codeFont: string;
  setCodeFont: (font: string) => void;
  codeFontSize: number;
  setCodeFontSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme }),

  density: "comfortable",
  setDensity: (density) => set({ density }),

  activeClusterId: null,

  connectionStatus: "disconnected",
  connectionError: null,

  connectToCluster: async (id: string) => {
    const { activeClusterId } = get();

    // Disconnect current cluster first if connected to a different one
    if (activeClusterId && activeClusterId !== id) {
      try {
        await Disconnect();
      } catch {
        // ignore disconnect errors during switch
      }
    }

    set({ connectionStatus: "connecting", connectionError: null, activeClusterId: id });

    try {
      await SetActiveCluster(id);
      await Connect(id);
      set({ connectionStatus: "connected", connectionError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ connectionStatus: "error", connectionError: message });
      throw err;
    }
  },

  disconnectCluster: async () => {
    try {
      await Disconnect();
    } catch {
      // ignore disconnect errors
    }
    set({ connectionStatus: "disconnected", connectionError: null, activeClusterId: null });
  },

  initializeConnection: async () => {
    try {
      const activeId = await GetActiveClusterID();
      if (!activeId) {
        set({ connectionStatus: "disconnected", activeClusterId: null });
        return;
      }

      // Check if already connected (e.g. hot reload)
      const connected = await IsConnected();
      if (connected) {
        set({ connectionStatus: "connected", activeClusterId: activeId });
        return;
      }

      // Try to auto-connect to the saved active cluster
      set({ connectionStatus: "connecting", activeClusterId: activeId });
      await Connect(activeId);
      set({ connectionStatus: "connected" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ connectionStatus: "error", connectionError: message });
    }
  },

  isSettingsOpen: false,
  toggleSettings: () => set((s) => ({ isSettingsOpen: !s.isSettingsOpen })),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  codeFont: "JetBrains Mono",
  setCodeFont: (font) => set({ codeFont: font }),
  codeFontSize: 13,
  setCodeFontSize: (size) => set({ codeFontSize: size }),
}));
