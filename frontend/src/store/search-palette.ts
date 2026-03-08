/**
 * Search Command Palette Store
 *
 * Manages open/close state and recently visited items.
 * Recent items are persisted to localStorage (capped at 8).
 */

import { create } from "zustand";

const RECENT_KEY = "watermark:recent-search-items";
const MAX_RECENT = 8;

export type SearchResultCategory =
  | "recent"
  | "page"
  | "topic"
  | "consumer"
  | "schema"
  | "annotation";

export interface SearchResultItem {
  id: string;
  label: string;
  category: SearchResultCategory;
  /** Optional secondary description (e.g. producer/consumer names) */
  description?: string;
  /** Navigation path */
  path: string;
}

interface SearchPaletteState {
  isOpen: boolean;
  recentItems: SearchResultItem[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  addRecent: (item: SearchResultItem) => void;
}

function loadRecent(): SearchResultItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(items: SearchResultItem[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items));
}

export const useSearchPaletteStore = create<SearchPaletteState>((set) => ({
  isOpen: false,
  recentItems: loadRecent(),

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  addRecent: (item) =>
    set((s) => {
      const filtered = s.recentItems.filter((r) => r.id !== item.id);
      const updated = [{ ...item, category: "recent" as const }, ...filtered].slice(
        0,
        MAX_RECENT,
      );
      saveRecent(updated);
      return { recentItems: updated };
    }),
}));
