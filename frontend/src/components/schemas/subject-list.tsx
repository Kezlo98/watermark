import { useState } from "react";
import { SearchInput } from "@/components/shared/search-input";
import { cn } from "@/lib/utils";

interface Subject {
  name: string;
}

const MOCK_SUBJECTS: Subject[] = [
  { name: "user.signup" },
  { name: "order.created" },
  { name: "order.updated" },
  { name: "payment.events" },
  { name: "inventory.sync" },
  { name: "user.profile" },
  { name: "audit.logs" },
  { name: "email.notif" },
  { name: "search.index" },
  { name: "metrics.agg" },
  { name: "dlq.events" },
];

interface SubjectListProps {
  selectedSubject: string | null;
  onSelect: (name: string) => void;
}

export function SubjectList({ selectedSubject, onSelect }: SubjectListProps) {
  const [search, setSearch] = useState("");

  const filtered = MOCK_SUBJECTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/5">
        <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Subjects ({filtered.length})
        </h3>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter..."
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {filtered.map((subject) => (
          <button
            key={subject.name}
            onClick={() => onSelect(subject.name)}
            className={cn(
              "w-full text-left px-4 py-2.5 text-sm font-mono transition-colors",
              selectedSubject === subject.name
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {subject.name}
          </button>
        ))}
      </div>
    </div>
  );
}
