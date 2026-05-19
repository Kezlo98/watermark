import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MessagesActionDropdownProps {
  onProduce: () => void;
  onDeleteBeforeDate: () => void;
  onPurgeTopic: () => void;
  disabled?: boolean;
}

export function MessagesActionDropdown({ onProduce, onDeleteBeforeDate, onPurgeTopic, disabled }: MessagesActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            "text-white bg-primary hover:bg-primary/90",
            disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          )}
        >
          Actions
          <Icon name="chevron-down" className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onProduce}>
          <Icon name="send" className="size-3.5" tone="brand" />
          Produce Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDeleteBeforeDate} className="text-red-400 focus:text-red-400">
          <Icon name="calendar-x" className="size-3.5" tone="danger" />
          Delete Before Date…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPurgeTopic} className="text-red-400 focus:text-red-400">
          <Icon name="trash" className="size-3.5" tone="danger" />
          Purge Topic…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
