import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/kafka";
import { MessageContextMenu } from "./message-context-menu";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 100] as const;

interface MessagesTableProps {
  messages: Message[];
  selectedMessage: Message | null;
  onSelectMessage: (msg: Message) => void;
  onReplay?: (msg: Message) => void;
  inspectorOpen?: boolean;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (msg: Message) => void;
  onToggleAll?: (msgs: Message[]) => void;
}

export function MessagesTable({ messages, selectedMessage, onSelectMessage, onReplay, inspectorOpen = false, selectMode, selectedIds, onToggleSelect, onToggleAll }: MessagesTableProps) {
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(messages.length / pageSize));

  // Reset page if it's out of bounds after data/pageSize change
  const safePage = Math.min(currentPage, totalPages - 1);
  useEffect(() => {
    if (safePage !== currentPage) setCurrentPage(safePage);
  }, [safePage, currentPage]);

  const paginatedMessages = useMemo(() => {
    const start = safePage * pageSize;
    return messages.slice(start, start + pageSize);
  }, [messages, safePage, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  return (
    <div className="glass-panel overflow-hidden flex flex-col">
      {/* Table — height shrinks when inspector is open to keep it visible */}
      <div className={cn("overflow-auto", inspectorOpen ? "max-h-[30vh]" : "max-h-[50vh]")}>
        <table className="w-full">
          <thead>
            <tr className="bg-white/5">
              {selectMode && (
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={paginatedMessages.length > 0 && paginatedMessages.every(m => selectedIds?.has(`${m.partition}-${m.offset}`))}
                    onChange={() => onToggleAll?.(paginatedMessages)}
                    className="accent-primary size-4 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">P</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Offset</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Key</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedMessages.length === 0 && (
              <tr>
                <td colSpan={selectMode ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-500 font-mono">
                  No messages found. Click Refresh to fetch.
                </td>
              </tr>
            )}
            {paginatedMessages.map((msg) => {
              const msgKey = `${msg.partition}-${msg.offset}`;
              const isChecked = selectedIds?.has(msgKey) ?? false;
              return (
                <MessageContextMenu
                  key={msgKey}
                  onReplay={() => onReplay?.(msg)}
                  onCopyValue={() => navigator.clipboard.writeText(msg.value)}
                  onCopyKey={() => navigator.clipboard.writeText(msg.key ?? "")}
                >
                  <tr
                    onClick={() => selectMode ? onToggleSelect?.(msg) : onSelectMessage(msg)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      !selectMode && selectedMessage?.partition === msg.partition && selectedMessage?.offset === msg.offset
                        ? "bg-primary/10"
                        : selectMode && isChecked
                          ? "bg-primary/5"
                          : "hover:bg-white/5"
                    )}
                  >
                    {selectMode && (
                      <td className="px-3 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleSelect?.(msg)}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-primary size-4 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-mono text-slate-300">{msg.partition}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-300">{msg.offset}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-400">{msg.timestamp}</td>
                    <td className="px-4 py-3 text-sm font-mono text-semantic-cyan">{msg.key}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-300 truncate max-w-xs">{msg.value}</td>
                  </tr>
                </MessageContextMenu>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-white/[0.02]">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Rows</span>
          <div className="flex gap-0.5">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => handlePageSizeChange(size)}
                className={cn(
                  "px-2 py-1 text-xs font-mono rounded transition-colors",
                  pageSize === size
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Page info + navigation */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">
            {messages.length > 0
              ? `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, messages.length)} of ${messages.length}`
              : "0 messages"}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={safePage === 0}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronsLeft className="size-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(safePage - 1)}
              disabled={safePage === 0}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-400">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(safePage + 1)}
              disabled={safePage >= totalPages - 1}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="size-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronsRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
