/**
 * Search Command Palette
 *
 * A ⌘K spotlight-style overlay built on shadcn CommandDialog (cmdk).
 * Searches across pages, topics, consumer groups, schema subjects,
 * and annotation metadata. Shows recently visited items when idle.
 */

import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  useSearchPaletteStore,
  type SearchResultItem,
} from "@/store/search-palette";
import { useSettingsStore } from "@/store/settings";
import { CATEGORY_META, useSearchItems } from "./search-command-palette-data";

/** Categories shown when no search query is typed */
const IDLE_CATEGORIES = new Set(["recent", "page"]);

/* ── Component ───────────────────────────────────────────────────────── */

export function SearchCommandPalette() {
  const { isOpen, close, recentItems, addRecent } = useSearchPaletteStore();
  const navigate = useNavigate();
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const { grouped } = useSearchItems(clusterId, recentItems);
  const [query, setQuery] = useState("");

  /* ── Navigation ─────────────────────────────────────────────────── */

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      addRecent(item);
      close();
      setQuery("");
      if (item.path.startsWith("/topics/")) {
        navigate({ to: "/topics/$topicId", params: { topicId: item.path.replace("/topics/", "") } });
      } else if (item.path.startsWith("/consumers/")) {
        navigate({ to: "/consumers/$groupId", params: { groupId: item.path.replace("/consumers/", "") } });
      } else {
        navigate({ to: item.path as "/" });
      }
    },
    [navigate, close, addRecent],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) { close(); setQuery(""); }
    },
    [close],
  );

  // When idle (no query), only show recents + pages.
  // When searching, show all categories so cmdk can filter.
  const visibleGroups = query.length > 0
    ? grouped
    : grouped.filter((g) => IDLE_CATEGORIES.has(g.category));

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title="Search"
      description="Search topics, groups, schemas, annotations…"
    >
      <div className="flex flex-col">
        <CommandInput
          placeholder="Search topics, groups, schemas, annotations…"
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[360px]">
          <CommandEmpty>No results found.</CommandEmpty>
          {visibleGroups.map(({ category, items }) => {
            const meta = CATEGORY_META[category];
            const CategoryIcon = meta.icon;
            return (
              <CommandGroup
                key={category}
                heading={
                  <span className="flex items-center gap-1.5">
                    <CategoryIcon className="size-3" />
                    {meta.label}
                  </span>
                }
              >
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    keywords={[item.description ?? "", item.category]}
                    onSelect={() => handleSelect(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </div>
    </CommandDialog>
  );
}
