import { Icon } from "@/components/ui/icon";
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
            <Icon name="rotate-ccw" className="size-3.5" tone="brand" />
            Replay
          </ContextMenuItem>
        )}
        {onReplay && <ContextMenuSeparator />}
        <ContextMenuItem onSelect={onCopyValue}>
          <Icon name="copy" className="size-3.5" />
          Copy Value
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCopyKey}>
          <Icon name="key" className="size-3.5" />
          Copy Key
        </ContextMenuItem>
        {(onDeleteBefore || onDeleteBeforeTimestamp) && <ContextMenuSeparator />}
        {onDeleteBefore && (
          <ContextMenuItem onSelect={onDeleteBefore} className="text-red-400 focus:text-red-400">
            <Icon name="trash" className="size-3.5" tone="danger" />
            Delete all before this
          </ContextMenuItem>
        )}
        {onDeleteBeforeTimestamp && (
          <ContextMenuItem onSelect={onDeleteBeforeTimestamp} className="text-red-400 focus:text-red-400">
            <Icon name="calendar-x" className="size-3.5" tone="danger" />
            Delete all before this time
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
