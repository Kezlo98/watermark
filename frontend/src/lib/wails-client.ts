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
  GetTopics,
  GetTopic,
  GetTopicPartitions,
  GetTopicConfigs,
  GetTopicConsumers,
  GetTopicACLs,
  CreateTopic,
  DeleteTopic,
  ConsumeMessages,
  ProduceMessage,
  GetConsumerGroups,
  GetConsumerGroupDetail,
  ResetConsumerGroupOffsets,
} from "../../wailsjs/go/kafka/KafkaService";

// --- Config Service ---
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
  GetDecryptedPassword,
  TestConnection,
  ExportConfig,
  ImportConfig,
} from "../../wailsjs/go/config/ConfigService";

// --- Schema Service ---
export {
  GetSubjects,
  GetSchemaVersions,
  GetSchemaVersion,
  GetCompatibility,
  Configure as ConfigureSchemaRegistry,
} from "../../wailsjs/go/schema/SchemaService";
