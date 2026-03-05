import { create } from "zustand";
import type { ThemeMode, UIDensity } from "@/types/config";

interface SettingsState {
  /* Theme */
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  /* UI Density */
  density: UIDensity;
  setDensity: (density: UIDensity) => void;

  /* Active Cluster */
  activeClusterId: string | null;
  setActiveCluster: (id: string) => void;

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

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme }),

  density: "comfortable",
  setDensity: (density) => set({ density }),

  activeClusterId: null,
  setActiveCluster: (id) => set({ activeClusterId: id }),

  isSettingsOpen: false,
  toggleSettings: () => set((s) => ({ isSettingsOpen: !s.isSettingsOpen })),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  codeFont: "JetBrains Mono",
  setCodeFont: (font) => set({ codeFont: font }),
  codeFontSize: 13,
  setCodeFontSize: (size) => set({ codeFontSize: size }),
}));
