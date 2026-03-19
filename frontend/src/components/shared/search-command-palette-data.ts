/**
 * Shared constants and helpers for the search command palette.
 * Keeps the main component file lean by extracting static data
 * and the item-building logic.
 */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  LayoutDashboard,
  List,
  Users,
  FileCode,
  Tag,
  Search,
} from "lucide-react";
import {
  type SearchResultItem,
  type SearchResultCategory,
} from "@/store/search-palette";
import type { Topic, ConsumerGroup, SchemaSubject } from "@/types/kafka";
import type { TopicAnnotation } from "@/types/annotations";
import { clusterQueryKey } from "@/hooks/use-kafka-query";

/* ── Static page entries ─────────────────────────────────────────────── */

export const PAGES: SearchResultItem[] = [
  { id: "page:dashboard", label: "Dashboard", category: "page", path: "/", description: "Cluster overview" },
  { id: "page:topics", label: "Topics", category: "page", path: "/topics", description: "Browse & manage topics" },
  { id: "page:consumers", label: "Consumer Groups", category: "page", path: "/consumers", description: "Monitor consumer lag" },
  { id: "page:schemas", label: "Schema Registry", category: "page", path: "/schemas", description: "View Avro/JSON/Protobuf schemas" },
];

/* ── Category config ─────────────────────────────────────────────────── */

export const CATEGORY_META: Record<SearchResultCategory, { icon: typeof Search; label: string }> = {
  recent: { icon: Clock, label: "Recent" },
  page: { icon: LayoutDashboard, label: "Pages" },
  topic: { icon: List, label: "Topics" },
  consumer: { icon: Users, label: "Consumer Groups" },
  schema: { icon: FileCode, label: "Schema Subjects" },
  annotation: { icon: Tag, label: "Annotations" },
};

export const CATEGORY_ORDER: SearchResultCategory[] = [
  "recent", "page", "topic", "consumer", "schema", "annotation",
];

/* ── Hook: build searchable item list from cache ─────────────────────── */

export function useSearchItems(
  clusterId: string | null,
  recentItems: SearchResultItem[],
) {
  const queryClient = useQueryClient();

  const topics: Topic[] = queryClient.getQueryData(clusterQueryKey(clusterId, ["topics"])) ?? [];
  const consumerGroups: ConsumerGroup[] = queryClient.getQueryData(clusterQueryKey(clusterId, ["consumer-groups"])) ?? [];
  const schemaSubjects: SchemaSubject[] = queryClient.getQueryData(clusterQueryKey(clusterId, ["schema-subjects"])) ?? [];
  const annotations: Record<string, TopicAnnotation> =
    queryClient.getQueryData(["annotations", clusterId ?? ""]) ?? {};

  const allItems = useMemo(() => {
    const results: SearchResultItem[] = [];

    results.push(...recentItems);
    results.push(...PAGES);

    results.push(
      ...topics.slice(0, 50).map((t): SearchResultItem => ({
        id: `topic:${t.name}`, label: t.name, category: "topic",
        description: `${t.partitions}p · ${t.replicas}r`, path: `/topics/${t.name}`,
      }))
    );

    results.push(
      ...consumerGroups.slice(0, 50).map((g): SearchResultItem => ({
        id: `consumer:${g.groupId}`, label: g.groupId, category: "consumer",
        description: `${g.state} · ${g.members} members`, path: `/consumers/${g.groupId}`,
      }))
    );

    results.push(
      ...schemaSubjects.slice(0, 50).map((s): SearchResultItem => ({
        id: `schema:${s.name}`, label: s.name, category: "schema", path: "/schemas",
      }))
    );

    for (const [topicName, ann] of Object.entries(annotations)) {
      const producers = ann.producers ?? [];
      const consumers = ann.consumers ?? [];
      const notes = ann.notes ?? "";
      const desc = [
        producers.length > 0 ? `Prod: ${producers.join(", ")}` : "",
        consumers.length > 0 ? `Cons: ${consumers.join(", ")}` : "",
      ].filter(Boolean).join(" · ");
      results.push({
        id: `annotation:${topicName}`, label: topicName, category: "annotation",
        description: desc || notes, path: `/topics/${topicName}`,
      });
    }

    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [topics, consumerGroups, schemaSubjects, annotations, recentItems]);

  const grouped = useMemo(() => {
    const map = new Map<SearchResultCategory, SearchResultItem[]>();
    for (const item of allItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return CATEGORY_ORDER
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [allItems]);

  return { allItems, grouped };
}
