import { create } from "zustand";
import type { ThemeMode, UIDensity } from "@/types/config";
import {
  Connect,
  Disconnect,
  IsConnected,
  GetActiveClusterID,
  SetActiveCluster,
} from "@/lib/wails-client";

/** Frontend timeout (slightly longer than backend's 10s to let backend timeout trigger first) */
const CONNECTION_TIMEOUT_MS = 15_000;

/** Wraps a promise with a timeout — rejects if it doesn't resolve in time */
function withTimeout<T>(promise: Promise<T>, ms: number, label = "Operation"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

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
      await withTimeout(Connect(id), CONNECTION_TIMEOUT_MS, "Connection");
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
      await withTimeout(Connect(activeId), CONNECTION_TIMEOUT_MS, "Auto-connect");
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
