import { useQuery } from "@tanstack/react-query";
import { ListAWSProfiles } from "@/lib/wails-client";

interface AwsProfileSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function AwsProfileSelect({ value, onChange }: AwsProfileSelectProps) {
  const { data: profiles = ["(Default)"], isLoading } = useQuery({
    queryKey: ["aws-profiles"],
    queryFn: ListAWSProfiles,
    staleTime: 30_000, // cache 30s
  });

  return (
    <div>
      <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
        AWS Profile
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
        disabled={isLoading}
      >
        {profiles.map((p) => (
          <option key={p} value={p === "(Default)" ? "" : p}>
            {p}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-slate-500 mt-1">
        Uses env vars or ~/.aws/config. Leave default for current environment.
      </p>
    </div>
  );
}
