import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import type { TopicConfig } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetTopicConfigs } from "@/lib/wails-client";

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
  const { data: configs = [] } = useKafkaQuery(
    ["topic-configs", topicName],
    () => GetTopicConfigs(topicName),
  );

  return (
    <DataTable
      data={configs}
      columns={columns}
      highlightRow={(row) =>
        row.isOverridden ? "bg-primary/5 border-l-2 border-primary" : undefined
      }
    />
  );
}
