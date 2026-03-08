import { useAnnotations } from "@/hooks/use-annotations";
import { OwnershipBadges } from "./ownership-badges";

interface TopicOwnershipHeaderProps {
  topicName: string;
  onEdit: () => void;
}

/**
 * Compact ownership info shown in topic detail header.
 * Always visible below topic name — shows badges or "Add tags" prompt.
 */
export function TopicOwnershipHeader({
  topicName,
  onEdit,
}: TopicOwnershipHeaderProps) {
  const { annotations } = useAnnotations();
  const ann = annotations[topicName];

  return (
    <div className="flex items-center gap-2">
      <OwnershipBadges
        producers={ann?.producers ?? []}
        consumers={ann?.consumers ?? []}
        maxVisible={3}
        onEdit={onEdit}
      />
      {ann?.notes && (
        <span className="text-[10px] text-slate-500 font-mono italic ml-1">
          — {ann.notes}
        </span>
      )}
    </div>
  );
}
