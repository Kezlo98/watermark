import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  shortcutHint?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  shortcutHint,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg",
          "text-sm text-white placeholder:text-slate-500",
          "focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
          "transition-colors duration-150"
        )}
      />
      {shortcutHint && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-mono">
          {shortcutHint}
        </kbd>
      )}
    </div>
  );
}
