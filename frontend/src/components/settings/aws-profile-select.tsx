import { useQuery } from "@tanstack/react-query";
import { ListAWSProfiles } from "@/lib/wails-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AwsProfileSelectProps {
  value: string;
  onChange: (value: string) => void;
}

/* Radix Select doesn't allow empty-string values, so we use a sentinel */
const DEFAULT_SENTINEL = "__default__";

export function AwsProfileSelect({ value, onChange }: AwsProfileSelectProps) {
  const { data: profiles = ["(Default)"], isLoading } = useQuery({
    queryKey: ["aws-profiles"],
    queryFn: ListAWSProfiles,
    staleTime: 30_000,
  });

  return (
    <div>
      <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
        AWS Profile
      </label>
      <Select
        value={value || DEFAULT_SENTINEL}
        onValueChange={(v) => onChange(v === DEFAULT_SENTINEL ? "" : v)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select profile" />
        </SelectTrigger>
        <SelectContent>
          {profiles.map((p) => (
            <SelectItem key={p} value={p === "(Default)" ? DEFAULT_SENTINEL : p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-slate-500 mt-1">
        Uses env vars or ~/.aws/config. Leave default for current environment.
      </p>
    </div>
  );
}
