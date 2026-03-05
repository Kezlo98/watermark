/* App Configuration Types */

export type ThemeMode = "dark" | "light" | "system";
export type UIDensity = "compact" | "comfortable" | "spacious";
export type ClusterColor = "red" | "orange" | "green" | "purple";

export interface ClusterProfile {
  id: string;
  name: string;
  bootstrapServers: string;
  color: ClusterColor;
  readOnly: boolean;
  securityProtocol: "NONE" | "SASL_PLAIN" | "SASL_SCRAM" | "SSL";
  saslMechanism?: string;
  username?: string;
  schemaRegistryUrl?: string;
}

export interface AppSettings {
  theme: ThemeMode;
  density: UIDensity;
  codeFont: string;
  codeFontSize: number;
  launchOnStartup: boolean;
  minimizeToTray: boolean;
}

/** Row height and padding per density mode */
export const DENSITY_CONFIG: Record<UIDensity, { rowHeight: string; padding: string }> = {
  compact: { rowHeight: "36px", padding: "py-2 px-4" },
  comfortable: { rowHeight: "48px", padding: "py-3 px-6" },
  spacious: { rowHeight: "56px", padding: "py-4 px-6" },
};
