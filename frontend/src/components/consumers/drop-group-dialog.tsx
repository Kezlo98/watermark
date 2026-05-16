import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConsumerGroup } from "@/lib/wails-client";
import { clusterQueryKey } from "@/hooks/use-kafka-query";
import { useSettingsStore } from "@/store/settings";

interface DropGroupDialogProps {
  groupId: string | null;
  onClose: () => void;
  onSuccess: (groupId: string) => void;
}

export function DropGroupDialog({ groupId, onClose, onSuccess }: DropGroupDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();
  const { activeClusterId } = useSettingsStore();

  useEffect(() => {
    setConfirmed(false);
  }, [groupId]);

  const handleDrop = async () => {
    if (!groupId) return;
    setIsPending(true);
    try {
      await DeleteConsumerGroup(groupId);
      onSuccess(groupId);
    } catch (err) {
      queryClient.invalidateQueries({
        queryKey: clusterQueryKey(activeClusterId, ["consumer-group-detail", groupId]),
      });
      toast.error(`Drop failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsPending(false);
    }
  };

  if (!groupId) return null;

  return (
    <AlertDialog open={!!groupId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-400">
            <Icon name="alert-triangle" className="size-4" tone="danger" />
            Drop consumer group "{groupId}"?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground">
            This will permanently delete the consumer group{" "}
            <span className="font-mono">{groupId}</span> from Kafka. Committed offsets will be lost. This cannot be undone.
          </AlertDialogDescription>
          <p className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
            <Icon name="alert-triangle" className="size-3 shrink-0" tone="warning" />
            Any matching lag-alert rule will also be removed.
          </p>
        </AlertDialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Checkbox
            id="drop-group-confirm"
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(!!v)}
          />
          <label htmlFor="drop-group-confirm" className="text-sm text-foreground cursor-pointer select-none">
            I understand this is irreversible
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDrop}
            disabled={!confirmed || isPending}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
          >
            {isPending ? "Dropping…" : "Drop"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
