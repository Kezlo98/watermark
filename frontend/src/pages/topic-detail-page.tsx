import { useState, useCallback } from "react";
import { useParams, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { TopicTabs } from "@/components/topics/topic-tabs";
import { ProduceMessageModal } from "@/components/topics/produce-message-modal";
import { MessagesActionDropdown } from "@/components/topics/messages-action-dropdown";
import { DeleteRecordsDialog, type DeleteMode } from "@/components/topics/delete-records-dialog";
import { RefreshButton } from "@/components/shared/refresh-button";
import { TopicOwnershipHeader } from "@/components/annotations/topic-ownership-header";
import { AnnotationEditorModal } from "@/components/annotations/annotation-editor-modal";
import { useReadOnly } from "@/hooks/use-read-only";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settings";

export function TopicDetailPage() {
  const { topicId } = useParams({ from: "/topics/$topicId" });
  const router = useRouter();
  const [produceOpen, setProduceOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<DeleteMode | null>(null);
  const isReadOnly = useReadOnly();
  const queryClient = useQueryClient();
  const clusterId = useSettingsStore((s) => s.activeClusterId);

  const handleDeleteSuccess = useCallback(() => {
    setDeleteMode(null);
    queryClient.invalidateQueries({ queryKey: ["messages", topicId] });
    queryClient.invalidateQueries({ queryKey: ["topic-partitions", topicId] });
  }, [queryClient, topicId]);

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.history.back()}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Topics
      </button>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
            Topic: <span className="text-primary">{topicId}</span>
          </h1>
          <TopicOwnershipHeader
            topicName={topicId}
            onEdit={() => setEditorOpen(true)}
          />
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            queryKeys={[
              ["messages", topicId],
              ["topic-consumers", topicId],
              ["topic-partitions", topicId],
              ["topic-configs", topicId],
              ["topic-acls", topicId],
              ["annotations", clusterId ?? ""],
            ]}
          />
          {!isReadOnly && (
            <MessagesActionDropdown
              onProduce={() => setProduceOpen(true)}
              onDeleteBeforeDate={() => setDeleteMode({ type: "beforeTimestamp", topicName: topicId, timestampMs: 0, timestampLabel: "" })}
              onPurgeTopic={() => setDeleteMode({ type: "purge", topicName: topicId })}
            />
          )}
        </div>
      </div>

      <TopicTabs topicName={topicId} />

      <ProduceMessageModal
        isOpen={produceOpen}
        onClose={() => setProduceOpen(false)}
        topicName={topicId}
      />

      <DeleteRecordsDialog
        mode={deleteMode}
        onClose={() => setDeleteMode(null)}
        onSuccess={handleDeleteSuccess}
      />

      <AnnotationEditorModal
        topicName={topicId}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}
