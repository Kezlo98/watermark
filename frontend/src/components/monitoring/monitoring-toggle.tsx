import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MonitoringToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function MonitoringToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: MonitoringToggleProps) {
  const id = `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <Label htmlFor={id} className="text-sm text-white font-normal cursor-pointer">{label}</Label>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
