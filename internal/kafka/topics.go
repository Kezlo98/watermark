package kafka

import (
	"fmt"
	"strconv"

	"github.com/twmb/franz-go/pkg/kadm"
)

// GetTopics returns all topics with metadata.
func (k *KafkaService) GetTopics() ([]Topic, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	topics, err := k.admin.ListTopicsWithInternal(ctx)
	if err != nil {
		return nil, fmt.Errorf("list topics: %w", err)
	}

	// Get topic sizes from log dirs (graceful fallback)
	topicSizes := make(map[string]int64)
	logDirs, err := k.admin.DescribeAllLogDirs(ctx, nil)
	if err == nil {
		logDirs.Each(func(d kadm.DescribedLogDir) {
			d.Topics.Each(func(p kadm.DescribedLogDirPartition) {
				topicSizes[p.Topic] += p.Size
			})
		})
	}

	result := make([]Topic, 0, len(topics))
	for _, td := range topics.Sorted() {
		replicas := 0
		if len(td.Partitions) > 0 {
			replicas = len(td.Partitions[0].Replicas)
		}

		result = append(result, Topic{
			Name:       td.Topic,
			Partitions: len(td.Partitions),
			Replicas:   replicas,
			Size:       topicSizes[td.Topic],
			Retention:  "",
			IsInternal: td.IsInternal,
		})
	}

	// Batch fetch retention configs for all topics
	topicNames := make([]string, len(result))
	for i, t := range result {
		topicNames[i] = t.Name
	}
	k.fillRetention(result, topicNames)

	return result, nil
}

// fillRetention fills the Retention field for topics from their configs.
func (k *KafkaService) fillRetention(topics []Topic, names []string) {
	if len(names) == 0 {
		return
	}

	ctx := k.getCtx()
	configs, err := k.admin.DescribeTopicConfigs(ctx, names...)
	if err != nil {
		return // graceful fallback
	}

	retentionMap := make(map[string]string)
	for _, rc := range configs {
		for _, c := range rc.Configs {
			if c.Key == "retention.ms" && c.Value != nil {
				ms, _ := strconv.ParseInt(*c.Value, 10, 64)
				retentionMap[rc.Name] = formatRetention(ms)
			}
		}
	}

	for i := range topics {
		if r, ok := retentionMap[topics[i].Name]; ok {
			topics[i].Retention = r
		}
	}
}

// formatRetention converts retention.ms to human-readable string.
func formatRetention(ms int64) string {
	if ms < 0 {
		return "infinite"
	}
	hours := ms / (1000 * 60 * 60)
	if hours >= 24 {
		days := hours / 24
		return fmt.Sprintf("%dd", days)
	}
	return fmt.Sprintf("%dh", hours)
}

// GetTopic returns a single topic with metadata.
func (k *KafkaService) GetTopic(name string) (*Topic, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	topics, err := k.admin.ListTopics(ctx, name)
	if err != nil {
		return nil, fmt.Errorf("get topic: %w", err)
	}

	td, ok := topics[name]
	if !ok {
		return nil, ErrTopicNotFound
	}

	replicas := 0
	if len(td.Partitions) > 0 {
		replicas = len(td.Partitions[0].Replicas)
	}

	return &Topic{
		Name:       td.Topic,
		Partitions: len(td.Partitions),
		Replicas:   replicas,
		IsInternal: td.IsInternal,
	}, nil
}
