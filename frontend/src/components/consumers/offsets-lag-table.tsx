import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import type { ConsumerGroupOffset } from "@/types/kafka";

interface TopicGroup {
  topic: string;
  partitions: ConsumerGroupOffset[];
  totalLag: number;
}

interface OffsetsLagTableProps {
  offsets: ConsumerGroupOffset[];
}

export function OffsetsLagTable({ offsets }: OffsetsLagTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Group offsets by topic, sorted by topic name
  const groups = useMemo<TopicGroup[]>(() => {
    const map = new Map<string, ConsumerGroupOffset[]>();
    for (const o of offsets) {
      const list = map.get(o.topic) ?? [];
      list.push(o);
      map.set(o.topic, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([topic, partitions]) => ({
        topic,
        partitions: partitions.sort((a, b) => a.partition - b.partition),
        totalLag: partitions.reduce((sum, p) => sum + p.lag, 0),
      }));
  }, [offsets]);

  const toggle = (topic: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(topic) ? next.delete(topic) : next.add(topic);
      return next;
    });

  return (
    <div>
      <h3 className="text-sm font-display font-bold text-white mb-3 uppercase tracking-wider">
        Offsets &amp; Lag
      </h3>
      <div className="glass-panel overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-320px)]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-[#141414]">
              <tr>
                {["Topic", "Partitions", "Total Lag"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groups.map((g) => {
                const isOpen = expanded.has(g.topic);
                return (
                  <>
                    {/* Topic summary row */}
                    <tr
                      key={g.topic}
                      className="cursor-pointer hover:bg-white/5 transition-colors duration-150"
                      onClick={() => toggle(g.topic)}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-white">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            className={cn(
                              "size-4 text-slate-400 transition-transform duration-150 shrink-0",
                              isOpen && "rotate-90"
                            )}
                          />
                          {g.topic}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">
                        {g.partitions.length}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <span className={cn(g.totalLag > 0 && "text-semantic-red font-bold")}>
                          {formatNumber(g.totalLag)}
                          {g.totalLag > 0 && " ⚠️"}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded partition detail rows */}
                    {isOpen && (
                      <tr key={`${g.topic}-detail`}>
                        <td colSpan={3} className="p-0">
                          <table className="w-full bg-white/[0.02]">
                            <thead>
                              <tr className="border-b border-white/5">
                                {["Partition", "Host", "Current Offset", "End Offset", "Lag"].map((h) => (
                                  <th
                                    key={h}
                                    className="px-6 py-2 text-left text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                              {g.partitions.map((p) => (
                                <tr key={p.partition}>
                                  <td className="px-6 py-2 text-xs font-mono text-slate-400">
                                    {p.partition}
                                  </td>
                                  <td className="px-6 py-2 text-xs font-mono text-slate-400">
                                    {p.host || "—"}
                                  </td>
                                  <td className="px-6 py-2 text-xs font-mono text-slate-300">
                                    {formatNumber(p.currentOffset)}
                                  </td>
                                  <td className="px-6 py-2 text-xs font-mono text-slate-300">
                                    {formatNumber(p.endOffset)}
                                  </td>
                                  <td className="px-6 py-2 text-xs font-mono">
                                    <span className={cn(p.lag > 0 && "text-semantic-red font-bold")}>
                                      {formatNumber(p.lag)}
                                      {p.lag > 0 && " ⚠️"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
