import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import type { ConsumerGroupMember } from "@/types/kafka";

const columns: ColumnDef<ConsumerGroupMember, unknown>[] = [
  {
    accessorKey: "clientId",
    header: "Client ID",
    cell: ({ row }) => <span className="text-white font-medium">{row.original.clientId}</span>,
  },
  {
    accessorKey: "host",
    header: "Host IP",
    cell: ({ row }) => (
      <span className="font-mono text-slate-300" title="NAT gateways may mask the true pod IP">
        {row.original.host}
      </span>
    ),
  },
  {
    accessorKey: "assignedPartitions",
    header: "Assigned Partitions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.assignedPartitions.map((p) => (
          <span
            key={p}
            className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-mono rounded"
          >
            {p}
          </span>
        ))}
      </div>
    ),
  },
];

interface ActiveMembersTableProps {
  members: ConsumerGroupMember[];
}

export function ActiveMembersTable({ members }: ActiveMembersTableProps) {
  return (
    <div>
      <h3 className="text-sm font-display font-bold text-white mb-3 uppercase tracking-wider">
        Active Members ({members.length})
      </h3>
      <DataTable data={members} columns={columns} />
    </div>
  );
}
