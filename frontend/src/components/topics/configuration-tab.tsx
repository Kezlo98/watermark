import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Bookmark } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import type { TopicConfig } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetTopicConfigs, GetTopicPartitions } from "@/lib/wails-client";
import { SaveTemplateModal } from "@/components/templates/save-template-modal";

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
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { data: configs = [] } = useKafkaQuery(
    ["topic-configs", topicName],
    () => GetTopicConfigs(topicName),
  );

  const { data: partitions = [] } = useKafkaQuery(
    ["topic-partitions", topicName],
    () => GetTopicPartitions(topicName),
  );

  const overriddenCount = configs.filter((c) => c.isOverridden).length;
  const partitionCount = partitions.length;
  const replicationFactor = partitions[0]?.replicas?.length ?? 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400">
          <span className="text-primary">{overriddenCount}</span> overridden
        </span>
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={overriddenCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary/90 hover:bg-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Bookmark className="size-3" />
          Save as Template
        </button>
      </div>

      {/* Config Table */}
      <DataTable
        data={configs}
        columns={columns}
        highlightRow={(row) =>
          row.isOverridden ? "bg-primary/5 border-l-2 border-primary" : undefined
        }
      />

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        topicName={topicName}
        configs={configs}
        partitions={partitionCount}
        replicationFactor={replicationFactor}
      />
    </div>
  );
}
