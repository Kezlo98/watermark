/**
 * Centralized Wails backend client.
 * Re-exports all service bindings with typed wrappers for use with useKafkaQuery.
 */

// --- Kafka Service ---
export {
  Connect,
  Disconnect,
  IsConnected,
  GetClusterHealth,
  GetBrokers,
  GetDashboardData,
  GetTopics,
  GetTopic,
  GetTopicPartitions,
  GetTopicConfigs,
  GetTopicConsumers,
  GetTopicACLs,
  CreateTopic,
  DeleteTopic,
  ConsumeMessages,
  ConsumeMessagesFromTimestamp,
  ProduceMessage,
  ProduceMessages,
  DeleteRecordsBefore,
  DeleteRecordsBeforeTimestamp,
  PurgeTopic,
  StartLiveTail,
  StopLiveTail,
  GetConsumerGroups,
  GetConsumerGroupDetail,
  GetAllGroupsLagDetail,
  ResetConsumerGroupOffsets,
  ClearCache,
  UpdateReadOnly,
} from "../../wailsjs/go/kafka/KafkaService";

// --- Config Service ---
// NOTE: GetDecryptedPassword intentionally NOT exported — decryption stays server-side only
export {
  GetClusters,
  GetCluster,
  SaveCluster,
  DeleteCluster as DeleteClusterProfile,
  DuplicateCluster,
  GetSettings,
  SaveSettings,
  GetActiveClusterID,
  SetActiveCluster,
  TestConnection,
  ExportConfig,
  ImportConfig,
  ListAWSProfiles,
  GetSkippedVersion,
  SkipVersion,
} from "../../wailsjs/go/config/ConfigService";

// --- Schema Service ---
export {
  GetSubjects,
  GetSchemaVersions,
  GetSchemaVersion,
  GetCompatibility,
  Configure as ConfigureSchemaRegistry,
} from "../../wailsjs/go/schema/SchemaService";

// --- Annotation Service ---
export {
  GetAnnotations,
  GetAnnotation,
  SetAnnotation,
  BatchSetAnnotation,
  DeleteAnnotation,
  GetServiceNames,
  ExportAnnotations,
  ExportAllAnnotations,
  ImportAnnotations,
  ExportToFile,
  ExportAllToFile,
  ImportFromFile,
} from "../../wailsjs/go/annotations/AnnotationService";

// --- Updater Service ---
export {
  GetCurrentVersion,
  CheckForUpdate,
  ApplyUpdate,
  GetChangelog,
} from "../../wailsjs/go/updater/UpdaterService";

// --- Lag Alert Service ---
import { SaveAlertConfig as _SaveAlertConfig } from "../../wailsjs/go/lagalert/LagAlertService";
import type { ClusterAlertConfig } from "@/types/lag-alerts";
export {
  GetAlertConfig,
  AddRule,
  UpdateRule,
  DeleteRule,
  GetAlerts,
  GetUnreadCount,
  MarkAllRead,
  ClearAlerts,
  RestartMonitoring,
  GetTopicTimeSeries,
  GetGroupTimeSeries,
} from "../../wailsjs/go/lagalert/LagAlertService";

/** Typed wrapper — accepts app interface, bridges to Wails class at boundary. */
export const SaveAlertConfig = (clusterId: string, cfg: ClusterAlertConfig): Promise<void> =>
  _SaveAlertConfig(clusterId, cfg as any);

// --- Template Service ---
export {
  GetTemplates,
  GetTemplate,
  SaveTemplate,
  UpdateTemplate,
  DeleteTemplate,
  ExportTemplates,
  ImportTemplates,
  ExportToFile as ExportTemplatesToFile,
  ImportFromFile as ImportTemplatesFromFile,
} from "../../wailsjs/go/templates/TemplateService";

