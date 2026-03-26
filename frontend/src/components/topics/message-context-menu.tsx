import { RotateCcw, Copy, KeyRound, Trash2, CalendarX2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MessageContextMenuProps {
  children: React.ReactNode;
  onReplay?: () => void;
  onCopyValue: () => void;
  onCopyKey: () => void;
  onDeleteBefore?: () => void;
  onDeleteBeforeTimestamp?: () => void;
}

export function MessageContextMenu({ children, onReplay, onCopyValue, onCopyKey, onDeleteBefore, onDeleteBeforeTimestamp }: MessageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {onReplay && (
          <ContextMenuItem onSelect={onReplay}>
            <RotateCcw className="size-3.5" />
            Replay
          </ContextMenuItem>
        )}
        {onReplay && <ContextMenuSeparator />}
        <ContextMenuItem onSelect={onCopyValue}>
          <Copy className="size-3.5" />
          Copy Value
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCopyKey}>
          <KeyRound className="size-3.5" />
          Copy Key
        </ContextMenuItem>
        {(onDeleteBefore || onDeleteBeforeTimestamp) && <ContextMenuSeparator />}
        {onDeleteBefore && (
          <ContextMenuItem onSelect={onDeleteBefore} className="text-red-400 focus:text-red-400">
            <Trash2 className="size-3.5" />
            Delete all before this
          </ContextMenuItem>
        )}
        {onDeleteBeforeTimestamp && (
          <ContextMenuItem onSelect={onDeleteBeforeTimestamp} className="text-red-400 focus:text-red-400">
            <CalendarX2 className="size-3.5" />
            Delete all before this time
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
