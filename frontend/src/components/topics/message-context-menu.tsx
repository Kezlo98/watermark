import { RotateCcw, Copy, KeyRound } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MessageContextMenuProps {
  children: React.ReactNode;
  onReplay: () => void;
  onCopyValue: () => void;
  onCopyKey: () => void;
}

export function MessageContextMenu({ children, onReplay, onCopyValue, onCopyKey }: MessageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onReplay}>
          <RotateCcw className="size-3.5" />
          Replay
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onCopyValue}>
          <Copy className="size-3.5" />
          Copy Value
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCopyKey}>
          <KeyRound className="size-3.5" />
          Copy Key
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
