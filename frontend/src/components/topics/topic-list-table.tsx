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
import { Pencil, Tag } from "lucide-react";

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
    if (searchFilter) {
      return topic.name.toLowerCase().includes(searchFilter.toLowerCase());
    }
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
      cell: ({ row }) => {
        const ann = annotations[row.original.name];
        const producers = ann?.producers ?? [];
        const consumers = ann?.consumers ?? [];
        const hasOwnership = producers.length > 0 || consumers.length > 0;

        return (
          <div className="flex flex-col gap-1">
            <span className="text-white font-medium">{row.original.name}</span>
            {hasOwnership && (
              <div
                className="flex items-center gap-1 cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditor(row.original.name);
                }}
              >
                <OwnershipBadges
                  producers={producers}
                  consumers={[]}
                  maxVisible={3}
                />
                <span className="text-[10px] text-slate-500 mx-0.5">→</span>
                <OwnershipBadges
                  producers={[]}
                  consumers={consumers}
                  maxVisible={3}
                />
                <Pencil className="size-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
              </div>
            )}
            {!hasOwnership && (
              <div
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditor(row.original.name);
                }}
              >
                <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors italic">
                  + tag
                </span>
              </div>
            )}
          </div>
        );
      },
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
