import { type IconProps as PhosphorIconProps } from "@phosphor-icons/react";
import { ICON_MAP, type IconName } from "@/lib/icon-map";

export type Tone = "default" | "brand" | "success" | "warning" | "danger" | "info" | "muted";

export interface IconProps extends Omit<PhosphorIconProps, "ref"> {
  name: IconName;
  tone?: Tone;
  weight?: PhosphorIconProps["weight"];
}

// `style` spreads after tone color, so consumer style wins over tone.
export function Icon({ name, tone = "default", weight = "thin", style, ...rest }: IconProps) {
  const Component = ICON_MAP[name];
  return (
    <Component
      weight={weight}
      style={{ color: `var(--icon-${tone}-primary)`, ...style }}
      {...rest}
    />
  );
}
