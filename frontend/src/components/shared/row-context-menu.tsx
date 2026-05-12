import { Fragment, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface RowContextMenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  variant?: "default" | "destructive";
  separatorBefore?: boolean;
}

interface RowContextMenuProps {
  children: ReactNode;
  items: RowContextMenuItem[];
}

export function RowContextMenu({ children, items }: RowContextMenuProps) {
  if (items.length === 0) return <>{children}</>;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {items.map((item) => (
          <Fragment key={item.label}>
            {item.separatorBefore && <ContextMenuSeparator />}
            <ContextMenuItem onSelect={item.onSelect} variant={item.variant}>
              <item.icon className="size-3.5" />
              {item.label}
            </ContextMenuItem>
          </Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
