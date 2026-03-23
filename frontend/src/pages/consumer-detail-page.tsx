import { useParams, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { GroupDetailHeader } from "@/components/consumers/group-detail-header";
import { ActiveMembersTable } from "@/components/consumers/active-members-table";
import { OffsetsLagTable } from "@/components/consumers/offsets-lag-table";
import { SetAlertPopover } from "@/components/consumers/set-alert-popover";
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

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.history.back()}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Consumer Groups
      </button>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
          Consumer Group: <span className="text-primary">{groupId}</span>
        </h1>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[["consumer-group-detail", groupId]]} />
          <SetAlertPopover groupId={groupId} />
          {!isReadOnly && (
            <>
              <button
                disabled
                className="px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 opacity-50 cursor-not-allowed"
                title="Group must be Empty or Dead to reset offsets"
              >
                ⏪ Reset Offsets
              </button>
              <button className="px-4 py-2 text-sm text-semantic-red bg-semantic-red/10 rounded-lg border border-semantic-red/20 hover:bg-semantic-red/20 transition-colors">
                🗑️ Drop Group
              </button>
            </>
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
