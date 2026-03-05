import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import type { TopicConfig } from "@/types/kafka";

const MOCK_CONFIGS: TopicConfig[] = [
  { name: "cleanup.policy", value: "delete", defaultValue: "delete", isOverridden: false, description: "A string that is either delete or compact or both" },
  { name: "compression.type", value: "snappy", defaultValue: "producer", isOverridden: true, description: "Compression codec for the topic" },
  { name: "max.message.bytes", value: "2097152", defaultValue: "1048588", isOverridden: true, description: "Maximum size of a message in bytes" },
  { name: "retention.ms", value: "604800000", defaultValue: "604800000", isOverridden: false, description: "Time to retain messages in ms" },
  { name: "segment.bytes", value: "1073741824", defaultValue: "1073741824", isOverridden: false, description: "Segment file size in bytes" },
  { name: "min.insync.replicas", value: "2", defaultValue: "1", isOverridden: true, description: "Minimum ISR required to write" },
];

const columns: ColumnDef<TopicConfig, unknown>[] = [
  {
    accessorKey: "name",
    header: "Config",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.isOverridden && (
          <span className="w-0.5 h-5 bg-primary rounded-full" />
        )}
        <span className={cn("font-mono text-sm", row.original.isOverridden && "text-primary")}>
          {row.original.name}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => (
      <span className={cn("font-mono", row.original.isOverridden && "text-white font-medium")}>
        {row.original.value}
      </span>
    ),
  },
  {
    accessorKey: "defaultValue",
    header: "Default",
    cell: ({ row }) => <span className="font-mono text-slate-500">{row.original.defaultValue}</span>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <span className="text-slate-400 text-xs">{row.original.description}</span>,
  },
];

interface ConfigurationTabProps {
  topicName: string;
}

export function ConfigurationTab({ topicName }: ConfigurationTabProps) {
  return (
    <DataTable
      data={MOCK_CONFIGS}
      columns={columns}
      highlightRow={(row) =>
        row.isOverridden ? "bg-primary/5 border-l-2 border-primary" : undefined
      }
    />
  );
}
