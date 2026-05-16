import { useParams, useRouter } from "@tanstack/react-router";
import { Icon } from "@/components/ui/icon";
import { GroupDetailHeader } from "@/components/consumers/group-detail-header";
import { ActiveMembersTable } from "@/components/consumers/active-members-table";
import { OffsetsLagTable } from "@/components/consumers/offsets-lag-table";
import { ConsumerActionDropdown } from "@/components/consumers/consumer-action-dropdown";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { GetConsumerGroupDetail } from "@/lib/wails-client";
import { useReadOnly } from "@/hooks/use-read-only";
import type { ConsumerGroupState } from "@/types/kafka";

export function ConsumerDetailPage() {
  const { groupId } = useParams({ from: "/consumers/$groupId" });
  const router = useRouter();
  const isReadOnly = useReadOnly();
  const { data: detail } = useKafkaQuery(
    ["consumer-group-detail", groupId],
    () => GetConsumerGroupDetail(groupId),
  );

  const handleDropGroup = () => {
    // TODO: implement drop group confirmation dialog
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.history.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon name="chevron-left" className="size-4" />
        Consumer Groups
      </button>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
          Consumer Group: <span className="text-primary">{groupId}</span>
        </h1>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[["consumer-group-detail", groupId]]} />
          {!isReadOnly && (
            <ConsumerActionDropdown
              groupId={groupId}
              onDropGroup={handleDropGroup}
            />
          )}
        </div>
      </div>

      <GroupDetailHeader
        groupId={groupId}
        state={(detail?.state ?? "Unknown") as ConsumerGroupState}
        coordinator={detail?.coordinator ?? 0}
        totalLag={detail?.offsets.reduce((sum, o) => sum + o.lag, 0) ?? 0}
      />

      <div className="space-y-6">
        <OffsetsLagTable offsets={detail?.offsets ?? []} />
        <ActiveMembersTable members={detail?.members ?? []} />
      </div>
    </div>
  );
}
