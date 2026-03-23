import { ChevronDown, Send, CalendarX2, Trash2 } from "lucide-react";
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
          <ChevronDown className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onProduce}>
          <Send className="size-3.5" />
          Produce Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDeleteBeforeDate} className="text-red-400 focus:text-red-400">
          <CalendarX2 className="size-3.5" />
          Delete Before Date…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPurgeTopic} className="text-red-400 focus:text-red-400">
          <Trash2 className="size-3.5" />
          Purge Topic…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
