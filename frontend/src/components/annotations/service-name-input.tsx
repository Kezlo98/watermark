import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceNameInputProps {
  value: string[];
  onChange: (names: string[]) => void;
  suggestions: string[];
  placeholder: string;
  variant: "producer" | "consumer";
}

const VARIANT_STYLES = {
  producer: {
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    ring: "focus-within:ring-purple-500/30",
    dot: "bg-purple-400",
  },
  consumer: {
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    ring: "focus-within:ring-blue-500/30",
    dot: "bg-blue-400",
  },
};

export function ServiceNameInput({
  value,
  onChange,
  suggestions,
  placeholder,
  variant,
}: ServiceNameInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const styles = VARIANT_STYLES[variant];

  // Filter suggestions: not already added, and matches input
  const filtered = suggestions.filter(
    (s) =>
      !value.includes(s) &&
      s.toLowerCase().includes(input.toLowerCase())
  );

  const addName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeName = (name: string) => {
    onChange(value.filter((n) => n !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      addName(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeName(value[value.length - 1]);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex flex-wrap gap-1.5 items-center min-h-[38px] px-2.5 py-1.5",
          "bg-white/5 border border-white/10 rounded-lg",
          "transition-all duration-200",
          "focus-within:ring-1",
          styles.ring
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((name) => (
          <span
            key={name}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-md border",
              "transition-all duration-150 hover:scale-105",
              styles.badge
            )}
          >
            <span className={cn("size-1.5 rounded-full", styles.dot)} />
            {name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeName(name);
              }}
              className="ml-0.5 hover:text-white transition-colors"
              type="button"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : "Add..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-300 placeholder:text-slate-500 outline-none font-mono"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 py-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl max-h-40 overflow-y-auto">
          {filtered.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addName(suggestion)}
              className="w-full px-3 py-1.5 text-left text-sm text-slate-300 font-mono hover:bg-white/10 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
