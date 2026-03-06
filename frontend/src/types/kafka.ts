/* Kafka Domain Types — matches Go backend struct shapes */

export interface Broker {
  id: number;
  host: string;
  port: number;
  partitions: number;
  size: number;
  isController: boolean;
}

export interface Topic {
  name: string;
  partitions: number;
  replicas: number;
  size: number;
  retention: string;
  isInternal: boolean;
}

export interface Partition {
  id: number;
  leader: number;
  replicas: number[];
  isr: number[];
  lowWatermark: number;
  highWatermark: number;
}

export interface Message {
  partition: number;
  offset: number;
  timestamp: string;
  key: string;
  value: string;
  headers?: Record<string, string>;
}

export type ConsumerGroupState =
  | "Stable"
  | "Rebalancing"
  | "Dead"
  | "Empty"
  | "Unknown";

export interface ConsumerGroup {
  groupId: string;
  state: ConsumerGroupState;
  members: number;
  totalLag: number;
}

export interface ConsumerGroupDetail {
  groupId: string;
  state: ConsumerGroupState;
  coordinator: number;
  members: ConsumerGroupMember[];
  offsets: ConsumerGroupOffset[];
}

export interface ConsumerGroupMember {
  clientId: string;
  host: string;
  assignedPartitions: number[];
}

export interface ConsumerGroupOffset {
  topic: string;
  partition: number;
  currentOffset: number;
  endOffset: number;
  lag: number;
}

export type SchemaType = "AVRO" | "JSON" | "PROTOBUF";

export type CompatibilityLevel =
  | "BACKWARD"
  | "FORWARD"
  | "FULL"
  | "NONE";

export interface SchemaSubject {
  name: string;
  latestVersion: number;
  type: SchemaType;
  compatibility: CompatibilityLevel;
}

export interface SchemaVersion {
  version: number;
  id: number;
  schema: string;
  type: SchemaType;
  date: string;
  description?: string;
}

export interface TopicConfig {
  name: string;
  value: string;
  defaultValue: string;
  isOverridden: boolean;
  description: string;
}

export interface AclEntry {
  principal: string;
  operation: string;
  permissionType: "Allow" | "Deny";
  host: string;
}

export interface ClusterHealth {
  status: "healthy" | "degraded" | "offline";
  brokersOnline: number;
  brokersTotal: number;
  topicCount: number;
  totalSize: number;
}
