package kafka

import (
	"fmt"

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

	if err := k.ensureConnected(); err != nil {
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

	if err := k.ensureConnected(); err != nil {
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
