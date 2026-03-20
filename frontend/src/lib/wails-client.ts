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
  ResetConsumerGroupOffsets,
  ClearCache,
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
export {
  GetAlertConfig,
  SaveAlertConfig,
  AddRule,
  UpdateRule,
  DeleteRule,
  GetAlerts,
  GetUnreadCount,
  MarkAllRead,
  ClearAlerts,
  RestartMonitoring,
} from "../../wailsjs/go/lagalert/LagAlertService";

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

