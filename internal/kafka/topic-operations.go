package kafka

import (
	"fmt"

	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kmsg"
)

// GetTopicPartitions returns partition details for a topic.
func (k *KafkaService) GetTopicPartitions(topicName string) ([]Partition, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	topics, err := k.admin.ListTopics(ctx, topicName)
	if err != nil {
		return nil, fmt.Errorf("topic partitions: %w", err)
	}

	td, ok := topics[topicName]
	if !ok {
		return nil, ErrTopicNotFound
	}

	// Get watermarks
	endOffsets, _ := k.admin.ListEndOffsets(ctx, topicName)
	startOffsets, _ := k.admin.ListStartOffsets(ctx, topicName)

	partitions := make([]Partition, 0, len(td.Partitions))
	for _, p := range td.Partitions.Sorted() {
		part := Partition{
			ID:       p.Partition,
			Leader:   p.Leader,
			Replicas: p.Replicas,
			ISR:      p.ISR,
		}

		if eo, ok := endOffsets.Lookup(topicName, p.Partition); ok {
			part.HighWatermark = eo.Offset
		}
		if so, ok := startOffsets.Lookup(topicName, p.Partition); ok {
			part.LowWatermark = so.Offset
		}

		partitions = append(partitions, part)
	}

	return partitions, nil
}

// GetTopicConfigs returns topic configuration entries.
func (k *KafkaService) GetTopicConfigs(topicName string) ([]TopicConfig, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	configs, err := k.admin.DescribeTopicConfigs(ctx, topicName)
	if err != nil {
		return nil, fmt.Errorf("topic configs: %w", err)
	}

	var result []TopicConfig
	for _, rc := range configs {
		for _, c := range rc.Configs {
			value := ""
			if c.Value != nil {
				value = *c.Value
			}

			tc := TopicConfig{
				Name:         c.Key,
				Value:        value,
				IsOverridden: c.Source == kmsg.ConfigSourceDynamicTopicConfig,
			}

			// Default value from synonyms
			for _, syn := range c.Synonyms {
				if syn.Source == kmsg.ConfigSourceDefaultConfig || syn.Source == kmsg.ConfigSourceStaticBrokerConfig {
					if syn.Value != nil {
						tc.DefaultValue = *syn.Value
					}
					break
				}
			}

			result = append(result, tc)
		}
	}

	return result, nil
}

// CreateTopic creates a new Kafka topic.
func (k *KafkaService) CreateTopic(name string, partitions int32, replicas int16, configs map[string]string) error {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureWritable(); err != nil {
		return err
	}

	// Convert map[string]string → map[string]*string for kadm API
	cfgPtrs := make(map[string]*string, len(configs))
	for key, val := range configs {
		v := val
		cfgPtrs[key] = &v
	}

	ctx := k.getCtx()
	resp, err := k.admin.CreateTopic(ctx, partitions, replicas, cfgPtrs, name)
	if err != nil {
		return fmt.Errorf("create topic: %w", err)
	}
	if resp.Err != nil {
		return fmt.Errorf("create topic: %w", resp.Err)
	}

	return nil
}

// DeleteTopic deletes a Kafka topic.
func (k *KafkaService) DeleteTopic(name string) error {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureWritable(); err != nil {
		return err
	}

	ctx := k.getCtx()
	resp, err := k.admin.DeleteTopics(ctx, name)
	if err != nil {
		return fmt.Errorf("delete topic: %w", err)
	}
	for _, r := range resp {
		if r.Err != nil {
			return fmt.Errorf("delete topic %s: %w", r.Topic, r.Err)
		}
	}

	return nil
}

// DeleteRecordsBefore truncates all messages before the given offset on a specific partition.
// Partition is required — offsets are partition-scoped, so -1 (all) is not supported.
// Use DeleteRecordsBeforeTimestamp or PurgeTopic for cross-partition operations.
func (k *KafkaService) DeleteRecordsBefore(topicName string, partition int32, beforeOffset int64) ([]DeleteRecordsResult, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureWritable(); err != nil {
		return nil, err
	}
	if partition < 0 {
		return nil, fmt.Errorf("delete records: partition must be >= 0")
	}

	ctx := k.getCtx()
	offsets := make(kadm.Offsets)
	offsets.Add(kadm.Offset{Topic: topicName, Partition: partition, At: beforeOffset})

	results, err := k.admin.DeleteRecords(ctx, offsets)
	if err != nil {
		return nil, fmt.Errorf("delete records: %w", err)
	}

	return mapDeleteResults(results, topicName), nil
}

// DeleteRecordsBeforeTimestamp resolves a timestamp to per-partition offsets
// and truncates all records before those offsets across all partitions.
func (k *KafkaService) DeleteRecordsBeforeTimestamp(topicName string, timestampMs int64) ([]DeleteRecordsResult, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureWritable(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	tsOffsets, err := k.admin.ListOffsetsAfterMilli(ctx, timestampMs, topicName)
	if err != nil {
		return nil, fmt.Errorf("delete records: list offsets after milli: %w", err)
	}

	offsets := make(kadm.Offsets)
	tsOffsets.Each(func(o kadm.ListedOffset) {
		if o.Offset >= 0 {
			offsets.Add(kadm.Offset{Topic: topicName, Partition: o.Partition, At: o.Offset})
		}
	})

	if len(offsets) == 0 {
		return nil, nil // no offsets to delete
	}

	results, err := k.admin.DeleteRecords(ctx, offsets)
	if err != nil {
		return nil, fmt.Errorf("delete records: %w", err)
	}

	return mapDeleteResults(results, topicName), nil
}

// PurgeTopic deletes all messages from all partitions by advancing the start offset
// to the current end offset (HighWatermark), effectively emptying the topic.
func (k *KafkaService) PurgeTopic(topicName string) ([]DeleteRecordsResult, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureWritable(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	endOffsets, err := k.admin.ListEndOffsets(ctx, topicName)
	if err != nil {
		return nil, fmt.Errorf("purge topic: list end offsets: %w", err)
	}

	offsets := make(kadm.Offsets)
	endOffsets.Each(func(o kadm.ListedOffset) {
		offsets.Add(kadm.Offset{Topic: topicName, Partition: o.Partition, At: o.Offset})
	})

	if len(offsets) == 0 {
		return []DeleteRecordsResult{}, nil
	}

	results, err := k.admin.DeleteRecords(ctx, offsets)
	if err != nil {
		return nil, fmt.Errorf("purge topic: %w", err)
	}

	return mapDeleteResults(results, topicName), nil
}

// mapDeleteResults converts kadm.DeleteRecordsResponses to []DeleteRecordsResult for a given topic.
func mapDeleteResults(results kadm.DeleteRecordsResponses, topicName string) []DeleteRecordsResult {
	var out []DeleteRecordsResult
	results.Each(func(r kadm.DeleteRecordsResponse) {
		if r.Topic != topicName {
			return
		}
		dr := DeleteRecordsResult{
			Partition:    r.Partition,
			NewLowOffset: r.LowWatermark,
		}
		if r.Err != nil {
			dr.Error = r.Err.Error()
		}
		out = append(out, dr)
	})
	return out
}
