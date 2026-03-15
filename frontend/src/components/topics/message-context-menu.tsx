import * as ContextMenu from "@radix-ui/react-context-menu";
import { RotateCcw, Copy, KeyRound } from "lucide-react";

interface MessageContextMenuProps {
  children: React.ReactNode;
  onReplay: () => void;
  onCopyValue: () => void;
  onCopyKey: () => void;
}

export function MessageContextMenu({ children, onReplay, onCopyValue, onCopyKey }: MessageContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-[160px] bg-zinc-900 border border-white/10 rounded-lg shadow-xl backdrop-blur p-1">
          <ContextMenu.Item
            onSelect={onReplay}
            className="flex items-center gap-2 px-3 py-2 text-sm font-mono text-slate-300 hover:bg-white/10 hover:text-white rounded cursor-pointer outline-none"
          >
            <RotateCcw className="size-3.5" />
            Replay
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-white/10 my-1" />
          <ContextMenu.Item
            onSelect={onCopyValue}
            className="flex items-center gap-2 px-3 py-2 text-sm font-mono text-slate-300 hover:bg-white/10 hover:text-white rounded cursor-pointer outline-none"
          >
            <Copy className="size-3.5" />
            Copy Value
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={onCopyKey}
            className="flex items-center gap-2 px-3 py-2 text-sm font-mono text-slate-300 hover:bg-white/10 hover:text-white rounded cursor-pointer outline-none"
          >
            <KeyRound className="size-3.5" />
            Copy Key
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
