/**
 * Search Command Palette
 *
 * A ⌘K spotlight-style overlay that searches across all entity types:
 * pages, topics, consumer groups, schema subjects, and annotation metadata.
 * Shows recently visited items first, supports full keyboard navigation.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Clock,
  LayoutDashboard,
  List,
  Users,
  FileCode,
  Tag,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSearchPaletteStore,
  type SearchResultItem,
  type SearchResultCategory,
} from "@/store/search-palette";
import type { Topic, ConsumerGroup, SchemaSubject } from "@/types/kafka";
import type { TopicAnnotation } from "@/types/annotations";
import { useSettingsStore } from "@/store/settings";
import { clusterQueryKey } from "@/hooks/use-kafka-query";

/* ── Static page entries ─────────────────────────────────────────────── */

const PAGES: SearchResultItem[] = [
  { id: "page:dashboard", label: "Dashboard", category: "page", path: "/", description: "Cluster overview" },
  { id: "page:topics", label: "Topics", category: "page", path: "/topics", description: "Browse & manage topics" },
  { id: "page:consumers", label: "Consumer Groups", category: "page", path: "/consumers", description: "Monitor consumer lag" },
  { id: "page:schemas", label: "Schema Registry", category: "page", path: "/schemas", description: "View Avro/JSON/Protobuf schemas" },
];

/* ── Category config ─────────────────────────────────────────────────── */

const CATEGORY_META: Record<SearchResultCategory, { icon: typeof Search; label: string }> = {
  recent: { icon: Clock, label: "Recent" },
  page: { icon: LayoutDashboard, label: "Pages" },
  topic: { icon: List, label: "Topics" },
  consumer: { icon: Users, label: "Consumer Groups" },
  schema: { icon: FileCode, label: "Schema Subjects" },
  annotation: { icon: Tag, label: "Annotations" },
};

const CATEGORY_ORDER: SearchResultCategory[] = [
  "recent", "page", "topic", "consumer", "schema", "annotation",
];

/* ── Component ───────────────────────────────────────────────────────── */

export function SearchCommandPalette() {
  const { isOpen, close, recentItems, addRecent } = useSearchPaletteStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clusterId = useSettingsStore((s) => s.activeClusterId);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Reset state on open/close */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* ── Gather search data from React Query cache ──────────────────── */

  const topics: Topic[] = queryClient.getQueryData(clusterQueryKey(clusterId, ["topics"])) ?? [];
  const consumerGroups: ConsumerGroup[] = queryClient.getQueryData(clusterQueryKey(clusterId, ["consumer-groups"])) ?? [];
  const schemaSubjects: SchemaSubject[] = queryClient.getQueryData(clusterQueryKey(clusterId, ["schema-subjects"])) ?? [];
  const annotations: Record<string, TopicAnnotation> =
    queryClient.getQueryData(["annotations", clusterId ?? ""]) ?? {};

  /* ── Build flat result list ─────────────────────────────────────── */

  const allResults = useMemo(() => {
    const lq = query.toLowerCase().trim();

    const results: SearchResultItem[] = [];

    /* 1. Recent items — only shown when palette first opens (no query).
       When searching, live data already covers topics/consumers/schemas
       under their proper category headers, avoiding duplicate grouping. */
    if (!lq) {
      results.push(...recentItems);
    }

    /* 2. Pages */
    const matchingPages = lq
      ? PAGES.filter(
          (p) =>
            p.label.toLowerCase().includes(lq) ||
            p.description?.toLowerCase().includes(lq),
        )
      : PAGES;
    results.push(...matchingPages);

    if (lq) {
      /* 3. Topics */
      const matchingTopics = topics
        .filter((t) => t.name.toLowerCase().includes(lq))
        .slice(0, 15)
        .map((t): SearchResultItem => ({
          id: `topic:${t.name}`,
          label: t.name,
          category: "topic",
          description: `${t.partitions}p · ${t.replicas}r`,
          path: `/topics/${t.name}`,
        }));
      results.push(...matchingTopics);

      /* 4. Consumer groups */
      const matchingGroups = consumerGroups
        .filter((g) => g.groupId.toLowerCase().includes(lq))
        .slice(0, 15)
        .map((g): SearchResultItem => ({
          id: `consumer:${g.groupId}`,
          label: g.groupId,
          category: "consumer",
          description: `${g.state} · ${g.members} members`,
          path: `/consumers/${g.groupId}`,
        }));
      results.push(...matchingGroups);

      /* 5. Schema subjects */
      const matchingSchemas = schemaSubjects
        .filter((s) => s.name.toLowerCase().includes(lq))
        .slice(0, 15)
        .map((s): SearchResultItem => ({
          id: `schema:${s.name}`,
          label: s.name,
          category: "schema",
          path: "/schemas",
        }));
      results.push(...matchingSchemas);

      /* 6. Annotation metadata search */
      const annotationResults: SearchResultItem[] = [];
      for (const [topicName, ann] of Object.entries(annotations)) {
        const producers = ann.producers ?? [];
        const consumers = ann.consumers ?? [];
        const notes = ann.notes ?? "";
        const allText = [...producers, ...consumers, notes, topicName]
          .join(" ")
          .toLowerCase();
        if (allText.includes(lq)) {
          const desc = [
            producers.length > 0 ? `Prod: ${producers.join(", ")}` : "",
            consumers.length > 0 ? `Cons: ${consumers.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
          annotationResults.push({
            id: `annotation:${topicName}`,
            label: topicName,
            category: "annotation",
            description: desc || notes,
            path: `/topics/${topicName}`,
          });
        }
      }
      results.push(...annotationResults.slice(0, 10));
    }

    /* Deduplicate by id (recent items may overlap with live results) */
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [query, topics, consumerGroups, schemaSubjects, annotations, recentItems]);

  /* ── Group results by category for rendering ────────────────────── */

  const grouped = useMemo(() => {
    const map = new Map<SearchResultCategory, SearchResultItem[]>();
    for (const item of allResults) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return CATEGORY_ORDER
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [allResults]);

  /* ── Navigation ─────────────────────────────────────────────────── */

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      addRecent(item);
      close();
      // Use type-safe navigate for known routes
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

  /* ── Keyboard handler ───────────────────────────────────────────── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, allResults.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (allResults[activeIndex]) handleSelect(allResults[activeIndex]);
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    },
    [allResults, activeIndex, handleSelect, close],
  );

  /* Keep active index in view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  /* Clamp activeIndex when results shrink */
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(allResults.length - 1, 0)));
  }, [allResults.length]);

  if (!isOpen) return null;

  let flatIndex = -1;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className={cn(
          "relative w-full max-w-[560px] rounded-xl overflow-hidden",
          "bg-[#0f0f17]/95 border border-white/10 shadow-2xl shadow-primary/5",
          "palette-enter",
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search className="size-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search topics, groups, schemas, annotations..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none font-mono"
          />
          <kbd className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto py-2 scrollbar-thin"
        >
          {allResults.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No results found for "{query}"
            </div>
          )}

          {grouped.map(({ category, items }) => {
            const meta = CATEGORY_META[category];
            const CategoryIcon = meta.icon;

            return (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <CategoryIcon className="size-3 text-slate-500" />
                  <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    {meta.label}
                  </span>
                </div>

                {/* Items */}
                {items.map((item) => {
                  flatIndex++;
                  const idx = flatIndex;
                  const isActive = idx === activeIndex;

                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-primary/10 text-white"
                          : "text-slate-300 hover:bg-white/5",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-[11px] text-slate-500 truncate block">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <ArrowRight className="size-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <kbd className="bg-white/5 px-1 py-0.5 rounded border border-white/10">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white/5 px-1 py-0.5 rounded border border-white/10">↵</kbd>
            Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white/5 px-1 py-0.5 rounded border border-white/10">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
