import { lazy, Suspense, useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { CompatibilityBadge } from "./compatibility-badge";
import type { SchemaType, CompatibilityLevel } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetSchemaVersions, GetCompatibility } from "@/lib/wails-client";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const LANGUAGE_MAP: Record<SchemaType, string> = {
  AVRO: "json",
  JSON: "json",
  PROTOBUF: "protobuf",
};

interface SchemaViewerProps {
  subjectName: string;
}

export function SchemaViewer({ subjectName }: SchemaViewerProps) {
  const { data: versions = [] } = useKafkaQuery(
    ["schema-versions", subjectName],
    () => GetSchemaVersions(subjectName),
    { refetchInterval: 30_000 },
  );

  const { data: compatibility } = useKafkaQuery(
    ["schema-compatibility", subjectName],
    () => GetCompatibility(subjectName),
    { refetchInterval: 60_000 },
  );

  const [selectedVersion, setSelectedVersion] = useState(versions[0]?.version ?? 1);

  // Reset version selection when subject changes
  useEffect(() => {
    if (versions.length > 0) {
      setSelectedVersion(versions[0].version);
    }
  }, [subjectName, versions]);

  if (versions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Select a subject to view its schema
      </div>
    );
  }

  const currentVersion = versions.find((v) => v.version === selectedVersion) ?? versions[0];
  const schemaType = (currentVersion?.type ?? "AVRO") as SchemaType;

  const copySchema = () => {
    navigator.clipboard.writeText(currentVersion.schema);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
            {subjectName}
          </h3>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(Number(e.target.value))}
            className="h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version} {v.version === versions[0].version ? "(latest)" : ""}
              </option>
            ))}
          </select>
          {compatibility && (
            <CompatibilityBadge level={compatibility as CompatibilityLevel} />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">
            {schemaType} | ID: {currentVersion.id}
          </span>
          <button
            onClick={copySchema}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Copy className="size-3" /> Copy
          </button>
        </div>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-[300px]">
        <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading editor...</div>}>
          <MonacoEditor
            height="100%"
            language={LANGUAGE_MAP[schemaType]}
            theme="vs-dark"
            value={currentVersion.schema}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: "JetBrains Mono",
              lineNumbers: "on",
              folding: true,
              renderLineHighlight: "none",
              padding: { top: 12 },
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
