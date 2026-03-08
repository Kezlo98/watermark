import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { formatBytes } from "@/lib/utils";
import type { Topic } from "@/types/kafka";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetTopics } from "@/lib/wails-client";
import { useAnnotations } from "@/hooks/use-annotations";
import { useAnnotationUIStore } from "@/store/annotations";
import { OwnershipBadges } from "@/components/annotations/ownership-badges";
import { AnnotationEditorModal } from "@/components/annotations/annotation-editor-modal";
import { BatchTagModal } from "@/components/annotations/batch-tag-modal";
import { Tag } from "lucide-react";

interface TopicListTableProps {
  onTopicClick: (topicName: string) => void;
  searchFilter: string;
  hideInternal: boolean;
}

export function TopicListTable({ onTopicClick, searchFilter, hideInternal }: TopicListTableProps) {
  const { data: topics = [] } = useKafkaQuery(["topics"], GetTopics);
  const { annotations } = useAnnotations();
  const {
    selectedTopicsForTag,
    toggleTopicForTag,
    setSelectedTopicsForTag,
    clearSelectedTopics,
    editingTopic,
    openEditor,
    closeEditor,
    isBatchModalOpen,
    openBatchModal,
    closeBatchModal,
  } = useAnnotationUIStore();

  const filteredData = topics.filter((topic) => {
    if (hideInternal && topic.isInternal) return false;
    return true;
  });

  const allSelected =
    filteredData.length > 0 &&
    filteredData.every((t) => selectedTopicsForTag.includes(t.name));

  const toggleAll = () => {
    if (allSelected) {
      clearSelectedTopics();
    } else {
      setSelectedTopicsForTag(filteredData.map((t) => t.name));
    }
  };

  const columns: ColumnDef<Topic, unknown>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="size-3.5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedTopicsForTag.includes(row.original.name)}
          onChange={() => toggleTopicForTag(row.original.name)}
          className="size-3.5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="text-white font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "producers",
      header: "Producers",
      cell: ({ row }) => {
        const ann = annotations[row.original.name];
        return (
          <OwnershipBadges
            producers={ann?.producers ?? []}
            consumers={[]}
            onEdit={() => openEditor(row.original.name)}
          />
        );
      },
      enableSorting: false,
    },
    {
      id: "consumers",
      header: "Consumers",
      cell: ({ row }) => {
        const ann = annotations[row.original.name];
        return (
          <OwnershipBadges
            producers={[]}
            consumers={ann?.consumers ?? []}
            onEdit={() => openEditor(row.original.name)}
          />
        );
      },
      enableSorting: false,
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

  return (
    <>
      {/* Batch action toolbar */}
      {selectedTopicsForTag.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-3 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-xs font-mono text-primary">
            {selectedTopicsForTag.length} selected
          </span>
          <button
            onClick={openBatchModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
          >
            <Tag className="size-3" />
            Tag Selected
          </button>
          <button
            onClick={clearSelectedTopics}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <DataTable
        data={filteredData}
        columns={columns}
        onRowClick={(row) => onTopicClick(row.name)}
        globalFilter={searchFilter}
      />

      {/* Editor modal */}
      {editingTopic && (
        <AnnotationEditorModal
          topicName={editingTopic}
          open={!!editingTopic}
          onClose={closeEditor}
        />
      )}

      {/* Batch tag modal */}
      <BatchTagModal
        topicNames={selectedTopicsForTag}
        open={isBatchModalOpen}
        onClose={closeBatchModal}
      />
    </>
  );
}
