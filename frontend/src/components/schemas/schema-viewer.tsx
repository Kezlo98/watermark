import { lazy, Suspense, useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { CompatibilityBadge } from "./compatibility-badge";
import type { SchemaVersion, CompatibilityLevel, SchemaType } from "@/types/kafka";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface SchemaData {
  name: string;
  type: SchemaType;
  compatibility: CompatibilityLevel;
  versions: SchemaVersion[];
}

const MOCK_SCHEMAS: Record<string, SchemaData> = {
  "user.signup": {
    name: "user.signup",
    type: "AVRO",
    compatibility: "BACKWARD",
    versions: [
      { version: 3, id: 42, type: "AVRO", date: "2026-03-01", description: 'Added "timestamp" field',
        schema: `{
  "type": "record",
  "name": "UserSignup",
  "namespace": "com.example.events",
  "fields": [
    { "name": "userId", "type": "string" },
    { "name": "email", "type": "string" },
    { "name": "timestamp", "type": "long" }
  ]
}` },
      { version: 2, id: 28, type: "AVRO", date: "2026-02-15", description: 'Added "email" field',
        schema: `{
  "type": "record",
  "name": "UserSignup",
  "namespace": "com.example.events",
  "fields": [
    { "name": "userId", "type": "string" },
    { "name": "email", "type": "string" }
  ]
}` },
      { version: 1, id: 12, type: "AVRO", date: "2026-01-10", description: "Initial schema",
        schema: `{
  "type": "record",
  "name": "UserSignup",
  "namespace": "com.example.events",
  "fields": [
    { "name": "userId", "type": "string" }
  ]
}` },
    ],
  },
};

const LANGUAGE_MAP: Record<SchemaType, string> = {
  AVRO: "json",
  JSON: "json",
  PROTOBUF: "protobuf",
};

interface SchemaViewerProps {
  subjectName: string;
}

export function SchemaViewer({ subjectName }: SchemaViewerProps) {
  const schema = MOCK_SCHEMAS[subjectName];
  const [selectedVersion, setSelectedVersion] = useState(schema?.versions[0]?.version ?? 1);

  // Reset version selection when subject changes so stale version isn't applied to new subject
  useEffect(() => {
    setSelectedVersion(schema?.versions[0]?.version ?? 1);
  }, [subjectName]);

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Select a subject to view its schema
      </div>
    );
  }

  const currentVersion = schema.versions.find((v) => v.version === selectedVersion) ?? schema.versions[0];

  const copySchema = () => {
    navigator.clipboard.writeText(currentVersion.schema);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
            {schema.name}
          </h3>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(Number(e.target.value))}
            className="h-8 px-2 bg-white/5 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            {schema.versions.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version} {v.version === schema.versions[0].version ? "(latest)" : ""}
              </option>
            ))}
          </select>
          <CompatibilityBadge level={schema.compatibility} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">
            {schema.type} | ID: {currentVersion.id}
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
            language={LANGUAGE_MAP[schema.type]}
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
