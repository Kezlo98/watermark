import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { formatBytes } from "@/lib/utils";
import type { Topic } from "@/types/kafka";

const MOCK_TOPICS: Topic[] = [
  { name: "user.signup.events", partitions: 6, replicas: 3, size: 2.4e9, retention: "7d", isInternal: false },
  { name: "order.created", partitions: 12, replicas: 3, size: 8.1e9, retention: "30d", isInternal: false },
  { name: "payment.processed", partitions: 3, replicas: 3, size: 1.2e9, retention: "14d", isInternal: false },
  { name: "inventory.updates", partitions: 6, replicas: 2, size: 4.5e9, retention: "7d", isInternal: false },
  { name: "audit.log.events", partitions: 1, replicas: 3, size: 12.3e9, retention: "365d", isInternal: false },
  { name: "user.profile.changes", partitions: 3, replicas: 3, size: 890e6, retention: "7d", isInternal: false },
  { name: "notif.email.send", partitions: 6, replicas: 2, size: 3.1e9, retention: "14d", isInternal: false },
  { name: "__consumer_offsets", partitions: 50, replicas: 3, size: 500e6, retention: "-1", isInternal: true },
  { name: "__transaction_state", partitions: 50, replicas: 3, size: 200e6, retention: "-1", isInternal: true },
];

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
  const filteredData = MOCK_TOPICS.filter((topic) => {
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
