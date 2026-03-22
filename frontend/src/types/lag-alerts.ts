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
  recordingEnabled: boolean;
  rules: AlertRule[];
  trackedTopics: string[];  // glob patterns; empty = record nothing (opt-in)
  trackedGroups: string[];  // glob patterns; empty = record all (backward compat)
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

export interface LagDataPoint {
  timestamp: string;
  lag: number;
}

export interface TopicLagSummary {
  topic: string;
  totalLag: number;
  groups: number;
}

