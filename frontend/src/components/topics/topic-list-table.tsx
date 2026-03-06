import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { formatBytes } from "@/lib/utils";
import type { Topic } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetTopics } from "@/lib/wails-client";

interface TopicListTableProps {
  onTopicClick: (topicName: string) => void;
  searchFilter: string;
  hideInternal: boolean;
}

const columns: ColumnDef<Topic, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="text-white font-medium">{row.original.name}</span>
    ),
  },
  { accessorKey: "partitions", header: "Partitions" },
  { accessorKey: "replicas", header: "Replicas" },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => formatBytes(row.original.size),
  },
  { accessorKey: "retention", header: "Retention" },
];

export function TopicListTable({ onTopicClick, searchFilter, hideInternal }: TopicListTableProps) {
  const { data: topics = [] } = useKafkaQuery(["topics"], GetTopics);

  const filteredData = topics.filter((topic) => {
    if (hideInternal && topic.isInternal) return false;
    return true;
  });

  return (
    <DataTable
      data={filteredData}
      columns={columns}
      onRowClick={(row) => onTopicClick(row.name)}
      globalFilter={searchFilter}
    />
  );
}
