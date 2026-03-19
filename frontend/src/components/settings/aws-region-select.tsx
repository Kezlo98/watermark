import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";

// Common AWS regions — covers ~95% of MSK deployments
const AWS_REGIONS = [
  { value: "us-east-1", label: "us-east-1 — US East (N. Virginia)" },
  { value: "us-east-2", label: "us-east-2 — US East (Ohio)" },
  { value: "us-west-1", label: "us-west-1 — US West (N. California)" },
  { value: "us-west-2", label: "us-west-2 — US West (Oregon)" },
  { value: "ap-southeast-1", label: "ap-southeast-1 — Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "ap-southeast-2 — Asia Pacific (Sydney)" },
  { value: "ap-southeast-7", label: "ap-southeast-7 — Asia Pacific (Thailand)" },
  { value: "ap-northeast-1", label: "ap-northeast-1 — Asia Pacific (Tokyo)" },
  { value: "ap-northeast-2", label: "ap-northeast-2 — Asia Pacific (Seoul)" },
  { value: "ap-south-1", label: "ap-south-1 — Asia Pacific (Mumbai)" },
  { value: "eu-west-1", label: "eu-west-1 — Europe (Ireland)" },
  { value: "eu-west-2", label: "eu-west-2 — Europe (London)" },
  { value: "eu-central-1", label: "eu-central-1 — Europe (Frankfurt)" },
  { value: "eu-north-1", label: "eu-north-1 — Europe (Stockholm)" },
  { value: "sa-east-1", label: "sa-east-1 — South America (São Paulo)" },
  { value: "ca-central-1", label: "ca-central-1 — Canada (Central)" },
  { value: "me-south-1", label: "me-south-1 — Middle East (Bahrain)" },
  { value: "af-south-1", label: "af-south-1 — Africa (Cape Town)" },
];

interface AwsRegionSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function AwsRegionSelect({ value, onChange }: AwsRegionSelectProps) {
  const [inputText, setInputText] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);

  // Sync input text when value changes externally (e.g. form load)
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const filtered = inputText
    ? AWS_REGIONS.filter((r) => r.label.toLowerCase().includes(inputText.toLowerCase()))
    : AWS_REGIONS;

  const handleSelect = (regionValue: string) => {
    onChange(regionValue);
    setInputText(regionValue);
    setShowDropdown(false);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    onChange(text);
    setShowDropdown(true);
  };

  const handleClear = () => {
    onChange("");
    setInputText("");
  };

  const hasDropdown = showDropdown && filtered.length > 0;

  return (
    <Popover open={hasDropdown} onOpenChange={(open) => { if (!open) setShowDropdown(false); }}>
      <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
        AWS Region
      </label>
      <PopoverAnchor asChild>
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="From AWS Config (Default)"
            className="w-full h-9 px-3 pr-8 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-slate-500 placeholder:font-sans placeholder:not-italic"
          />
          {inputText && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              title="Clear — use region from AWS config"
            >
              ✕
            </button>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-48 overflow-y-auto"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {filtered.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => handleSelect(r.value)}
            className={`w-full px-3 py-1.5 text-left text-xs font-mono cursor-pointer transition-colors ${
              r.value === value
                ? "text-primary bg-primary/10"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            {r.label}
          </button>
        ))}
      </PopoverContent>

      <p className="text-[10px] text-slate-500 mt-1">
        Leave empty to use region from ~/.aws/config or AWS_REGION env var.
      </p>
    </Popover>
  );
}
