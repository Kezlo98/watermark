import { useState } from "react";
import { SubjectList } from "@/components/schemas/subject-list";
import { SchemaViewer } from "@/components/schemas/schema-viewer";
import { VersionHistory } from "@/components/schemas/version-history";
import { RefreshButton } from "@/components/shared/refresh-button";

export function SchemasPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
          Schema Registry
        </h1>
        <RefreshButton queryKeys={[["schema-subjects"]]} />
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-4 h-[calc(100vh-240px)]">
        <div className="glass-panel overflow-hidden">
          <SubjectList
            selectedSubject={selectedSubject}
            onSelect={setSelectedSubject}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass-panel flex-1 overflow-hidden">
            {selectedSubject ? (
              <SchemaViewer subjectName={selectedSubject} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Select a subject to view its schema
              </div>
            )}
          </div>

          {selectedSubject && (
            <VersionHistory subjectName={selectedSubject} />
          )}
        </div>
      </div>
    </div>
  );
}
