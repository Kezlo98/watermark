import type { SchemaVersion } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetSchemaVersions } from "@/lib/wails-client";

interface VersionHistoryProps {
  subjectName: string;
}

export function VersionHistory({ subjectName }: VersionHistoryProps) {
  const { data: versions = [] } = useKafkaQuery(
    ["schema-versions", subjectName],
    () => GetSchemaVersions(subjectName),
    { refetchInterval: 30_000 },
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
          Version History
        </h4>
        <button
          disabled
          className="px-3 py-1 text-xs text-slate-500 bg-white/5 rounded border border-white/10 cursor-not-allowed opacity-50"
          title="Coming soon"
        >
          Compare Versions
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5">
              <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Version</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Schema ID</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {versions.map((v) => (
              <tr key={v.version} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-2.5 text-sm font-mono text-primary">v{v.version}</td>
                <td className="px-4 py-2.5 text-sm font-mono text-slate-400">{v.id}</td>
                <td className="px-4 py-2.5 text-sm text-slate-300">{v.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
