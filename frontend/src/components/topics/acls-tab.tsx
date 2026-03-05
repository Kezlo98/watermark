import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import type { AclEntry } from "@/types/kafka";
import { cn } from "@/lib/utils";

const MOCK_ACLS: AclEntry[] = [
  { principal: "User:admin", operation: "All", permissionType: "Allow", host: "*" },
  { principal: "User:producer-svc", operation: "Write", permissionType: "Allow", host: "10.0.1.0/24" },
  { principal: "User:consumer-svc", operation: "Read", permissionType: "Allow", host: "10.0.2.0/24" },
  { principal: "User:external", operation: "Write", permissionType: "Deny", host: "*" },
];

const columns: ColumnDef<AclEntry, unknown>[] = [
  {
    accessorKey: "principal",
    header: "Principal",
    cell: ({ row }) => <span className="text-white font-medium">{row.original.principal}</span>,
  },
  {
    accessorKey: "operation",
    header: "Operation",
    cell: ({ row }) => (
      <span className="font-mono text-semantic-cyan">{row.original.operation}</span>
    ),
  },
  {
    accessorKey: "permissionType",
    header: "Permission",
    cell: ({ row }) => (
      <span
        className={cn(
          "px-2 py-0.5 rounded text-xs font-semibold",
          row.original.permissionType === "Allow"
            ? "bg-status-healthy/10 text-status-healthy"
            : "bg-semantic-red/10 text-semantic-red"
        )}
      >
        {row.original.permissionType}
      </span>
    ),
  },
  {
    accessorKey: "host",
    header: "Host",
    cell: ({ row }) => <span className="font-mono text-slate-400">{row.original.host}</span>,
  },
];

interface AclsTabProps {
  topicName: string;
}

export function AclsTab({ topicName }: AclsTabProps) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4">
        Read-only view of ACL entries for this topic.
      </p>
      <DataTable data={MOCK_ACLS} columns={columns} />
    </div>
  );
}
