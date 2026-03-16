// TypeScript types mirroring the Go lagalert package types.

export type AlertLevel = "warning" | "critical";

export interface AlertRule {
  id: string;
  groupPattern: string;
  warningLag: number;
  criticalLag: number;
  enabled: boolean;
}

export interface ClusterAlertConfig {
  enabled: boolean;
  pollIntervalSec: number;
  notifyOS: boolean;
  notificationSound: boolean;
  rules: AlertRule[];
}

export interface AlertEvent {
  id: string;
  clusterId: string;
  groupId: string;
  matchedRule: string;
  rulePattern: string;
  level: AlertLevel;
  lag: number;
  threshold: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  read: boolean;
}

export interface LagAlertPayload {
  type: "breach" | "recovery";
  alerts: AlertEvent[];
}
