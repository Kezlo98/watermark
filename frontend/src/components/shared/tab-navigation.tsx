import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: "horizontal" | "vertical";
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = "horizontal",
  className,
}: TabNavigationProps) {
  if (variant === "vertical") {
    return (
      <nav className={cn("flex flex-col gap-1", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-left transition-colors",
              activeTab === tab.id
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            {tab.icon && <tab.icon className="size-3.5 shrink-0" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs text-slate-500 font-mono">({tab.count})</span>
            )}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className={cn("flex items-center gap-1 border-b border-white/10", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "text-primary"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {tab.icon && <tab.icon className="size-3.5 shrink-0" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 text-xs text-slate-500 font-mono">({tab.count})</span>
          )}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
          )}
        </button>
      ))}
    </nav>
  );
}

