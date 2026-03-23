/**
 * Tracked entities configuration section for the Monitoring Settings dialog.
 * Allows users to manage glob patterns for topics/groups whose lag data
 * should be persistently recorded for charting. Includes exclusion patterns
 * with "exclude wins over include" semantics.
 */

import { useState, useMemo } from "react";
import { X, Plus, AlertTriangle } from "lucide-react";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetAllGroupsLagDetail, GetConsumerGroups } from "@/lib/wails-client";
import { globMatch } from "@/lib/glob-match";
import { cn } from "@/lib/utils";
import type { TopicLagSummary } from "@/types/lag-alerts";

interface TrackedEntitiesConfigProps {
  trackedTopics: string[];
  trackedGroups: string[];
  excludedTopics: string[];
  excludedGroups: string[];
  onUpdate: (
    trackedTopics: string[],
    trackedGroups: string[],
    excludedTopics: string[],
    excludedGroups: string[],
  ) => void;
  disabled?: boolean;
}

type ActiveTab = "topics" | "groups";

const WARN_THRESHOLD = 25;

export function TrackedEntitiesConfig({
  trackedTopics,
  trackedGroups,
  excludedTopics,
  excludedGroups,
  onUpdate,
  disabled,
}: TrackedEntitiesConfigProps) {
  const [tab, setTab] = useState<ActiveTab>("topics");
  const [newPattern, setNewPattern] = useState("");
  const [newExcludePattern, setNewExcludePattern] = useState("");

  // Fetch available entities for match preview
  const { data: topicLags } = useKafkaQuery<TopicLagSummary[]>(
    ["all-groups-lag-detail"],
    GetAllGroupsLagDetail as () => Promise<TopicLagSummary[]>,
  );
  const { data: consumerGroups } = useKafkaQuery(
    ["consumer-groups"],
    GetConsumerGroups,
  );

  const activePatterns = tab === "topics" ? trackedTopics : trackedGroups;
  const activeExcludePatterns = tab === "topics" ? excludedTopics : excludedGroups;
  const availableNames = useMemo(() => {
    if (tab === "topics") {
      return (topicLags ?? []).map((t) => t.topic);
    }
    return (consumerGroups ?? []).map((g) => g.groupId);
  }, [tab, topicLags, consumerGroups]);

  // Count total matched entities across all patterns
  const totalMatched = useMemo(() => {
    const matched = new Set<string>();
    for (const pattern of activePatterns) {
      for (const name of availableNames) {
        if (globMatch(name, pattern)) matched.add(name);
      }
    }
    return matched.size;
  }, [activePatterns, availableNames]);

  // Net tracked count: included minus excluded
  const netTracked = useMemo(() => {
    const included = new Set<string>();
    const excluded = new Set<string>();
    for (const pattern of activePatterns) {
      for (const name of availableNames) {
        if (globMatch(name, pattern)) included.add(name);
      }
    }
    for (const pattern of activeExcludePatterns) {
      for (const name of availableNames) {
        if (globMatch(name, pattern)) excluded.add(name);
      }
    }
    return [...included].filter((n) => !excluded.has(n)).length;
  }, [activePatterns, activeExcludePatterns, availableNames]);

  // Include handlers
  const handleAdd = () => {
    const val = newPattern.trim();
    if (!val || activePatterns.includes(val)) return;
    const updated = [...activePatterns, val];
    if (tab === "topics") {
      onUpdate(updated, trackedGroups, excludedTopics, excludedGroups);
    } else {
      onUpdate(trackedTopics, updated, excludedTopics, excludedGroups);
    }
    setNewPattern("");
  };

  const handleRemove = (idx: number) => {
    const updated = activePatterns.filter((_, i) => i !== idx);
    if (tab === "topics") {
      onUpdate(updated, trackedGroups, excludedTopics, excludedGroups);
    } else {
      onUpdate(trackedTopics, updated, excludedTopics, excludedGroups);
    }
  };

  // Exclude handlers
  const handleAddExclude = () => {
    const val = newExcludePattern.trim();
    if (!val || activeExcludePatterns.includes(val)) return;
    const updated = [...activeExcludePatterns, val];
    if (tab === "topics") {
      onUpdate(trackedTopics, trackedGroups, updated, excludedGroups);
    } else {
      onUpdate(trackedTopics, trackedGroups, excludedTopics, updated);
    }
    setNewExcludePattern("");
  };

  const handleRemoveExclude = (idx: number) => {
    const updated = activeExcludePatterns.filter((_, i) => i !== idx);
    if (tab === "topics") {
      onUpdate(trackedTopics, trackedGroups, updated, excludedGroups);
    } else {
      onUpdate(trackedTopics, trackedGroups, excludedTopics, updated);
    }
  };

  const getMatchCount = (pattern: string) => {
    return availableNames.filter((n) => globMatch(n, pattern)).length;
  };

  const getExcludeMatchCount = (pattern: string) => {
    return availableNames.filter((n) => globMatch(n, pattern)).length;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Chart Tracking
        </span>
        {totalMatched > WARN_THRESHOLD && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400">
            <AlertTriangle className="size-3" />
            {totalMatched} entities tracked — may increase disk usage
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5 w-fit">
        {(["topics", "groups"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setNewPattern(""); setNewExcludePattern(""); }}
            className={cn(
              "px-3 py-1 text-xs rounded-md transition-colors capitalize",
              tab === t
                ? "bg-primary/20 text-primary"
                : "text-slate-400 hover:text-white",
            )}
          >
            {t} ({t === "topics" ? trackedTopics.length : trackedGroups.length})
          </button>
        ))}
      </div>

      {/* Include section */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Include
        </span>

        {/* Add pattern input */}
        <div className="flex gap-2">
          <input
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={tab === "topics" ? "e.g. orders-*" : "e.g. payment-*"}
            disabled={disabled}
            className="flex-1 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-slate-600 focus:outline-none focus:border-white/30 font-mono"
          />
          <button
            onClick={handleAdd}
            disabled={disabled || !newPattern.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>

        {/* Include pattern list */}
        {activePatterns.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center border border-dashed border-white/10 rounded-lg">
            {tab === "topics"
              ? "No topics tracked. Select topics in the chart or add patterns here."
              : "No groups tracked. Select groups in the chart or add patterns here."}
          </p>
        ) : (
          <div className="space-y-1.5">
            {activePatterns.map((pattern, idx) => {
              const matchCount = getMatchCount(pattern);
              return (
                <div
                  key={pattern}
                  className="flex items-center justify-between px-3 py-1.5 bg-white/3 border border-white/5 rounded-md group"
                >
                  <span className="text-xs font-mono text-white">{pattern}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">
                      matches {matchCount} {tab === "topics" ? "topic" : "group"}
                      {matchCount !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => handleRemove(idx)}
                      disabled={disabled}
                      className="text-slate-500 hover:text-semantic-red transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove pattern"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exclude section */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Exclude
        </span>

        <div className="flex gap-2">
          <input
            value={newExcludePattern}
            onChange={(e) => setNewExcludePattern(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddExclude()}
            placeholder={tab === "topics" ? "e.g. *-dlq" : "e.g. *-retry"}
            disabled={disabled}
            className="flex-1 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-slate-600 focus:outline-none focus:border-white/30 font-mono"
          />
          <button
            onClick={handleAddExclude}
            disabled={disabled || !newExcludePattern.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-semantic-red/20 text-semantic-red border border-semantic-red/30 rounded hover:bg-semantic-red/30 transition-colors disabled:opacity-50"
          >
            <Plus className="size-3" />
            Exclude
          </button>
        </div>

        {activeExcludePatterns.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 text-center">
            No exclude patterns — all included entities will be recorded.
          </p>
        ) : (
          <div className="space-y-1.5">
            {activeExcludePatterns.map((pattern, idx) => {
              const matchCount = getExcludeMatchCount(pattern);
              return (
                <div
                  key={pattern}
                  className="flex items-center justify-between px-3 py-1.5 bg-semantic-red/5 border border-semantic-red/10 rounded-md group"
                >
                  <span className="text-xs font-mono text-white">{pattern}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">
                      excludes {matchCount} {tab === "topics" ? "topic" : "group"}
                      {matchCount !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => handleRemoveExclude(idx)}
                      disabled={disabled}
                      className="text-slate-500 hover:text-semantic-red transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Net tracked count */}
      {(activePatterns.length > 0 || activeExcludePatterns.length > 0) && (
        <div className="text-xs text-slate-400 pt-1">
          Net tracked: <span className="text-white font-medium">{netTracked}</span> {tab}
        </div>
      )}
    </div>
  );
}
