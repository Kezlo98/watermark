package kafka

import (
	"context"
	"fmt"
	"time"

	"github.com/twmb/franz-go/pkg/kgo"
)

// ConsumeMessages fetches N messages from a topic starting at given offset.
// partition=-1 reads from all partitions; startOffset=-1 for latest, -2 for earliest.
func (k *KafkaService) ConsumeMessages(topicName string, partition int32, startOffset int64, limit int) ([]Message, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	if limit <= 0 {
		limit = 100
	}

	ctx := k.getCtx()

	// Resolve which partitions to consume
	partitions, err := k.resolvePartitions(ctx, topicName, partition)
	if err != nil {
		return nil, err
	}

	// Build per-partition offset map
	partOffsets := make(map[int32]kgo.Offset, len(partitions))
	for _, p := range partitions {
		offset, err := k.resolveStartOffset(ctx, topicName, p, startOffset, limit)
		if err != nil {
			return nil, err
		}
		partOffsets[p] = kgo.NewOffset().At(offset)
	}

	offsets := map[string]map[int32]kgo.Offset{topicName: partOffsets}

	// Reuse stored base opts (includes broker seeds + SASL/TLS) for the temp consumer
	consumerOpts := append(append([]kgo.Opt{}, k.baseOpts...), kgo.ConsumePartitions(offsets))

	consumer, err := kgo.NewClient(consumerOpts...)
	if err != nil {
		return nil, fmt.Errorf("consume: new consumer: %w", err)
	}
	defer consumer.Close()

	messages := make([]Message, 0, limit)

	// Resolve end offsets so we know exactly when each partition is exhausted.
	// This prevents PollFetches from blocking indefinitely on topics with
	// fewer messages than the requested limit.
	endOffsets, err := k.admin.ListEndOffsets(ctx, topicName)
	if err != nil {
		return nil, fmt.Errorf("consume: list end offsets: %w", err)
	}
	partEndOffsets := make(map[int32]int64, len(partitions))
	for _, p := range partitions {
		if eo, ok := endOffsets.Lookup(topicName, p); ok {
			partEndOffsets[p] = eo.Offset
		}
	}

	// Safety timeout — should rarely be hit with end-offset tracking
	pollCtx, pollCancel := context.WithTimeout(ctx, 5*time.Second)
	defer pollCancel()

	// Track the highest consumed offset per partition
	consumed := make(map[int32]int64, len(partitions))

	for len(messages) < limit {
		fetches := consumer.PollFetches(pollCtx)

		// Context expired — return what we have
		if pollCtx.Err() != nil {
			break
		}

		if errs := fetches.Errors(); len(errs) > 0 {
			return messages, fmt.Errorf("consume: poll: %v", errs[0].Err)
		}

		fetches.EachRecord(func(r *kgo.Record) {
			if len(messages) >= limit {
				return
			}

			headers := make(map[string]string)
			for _, h := range r.Headers {
				headers[h.Key] = string(h.Value)
			}

			messages = append(messages, Message{
				Partition: r.Partition,
				Offset:    r.Offset,
				Timestamp: r.Timestamp.UTC().Format(time.RFC3339),
				Key:       string(r.Key),
				Value:     string(r.Value),
				Headers:   headers,
			})

			// Track the highest offset consumed per partition
			if r.Offset+1 > consumed[r.Partition] {
				consumed[r.Partition] = r.Offset + 1
			}
		})

		// Check if all partitions have been consumed up to their end offsets
		allExhausted := true
		for _, p := range partitions {
			if consumed[p] < partEndOffsets[p] {
				allExhausted = false
				break
			}
		}
		if allExhausted {
			break
		}
	}

	return messages, nil
}

// resolvePartitions returns partition IDs to consume.
// partition=-1 means all partitions for the topic.
func (k *KafkaService) resolvePartitions(ctx context.Context, topicName string, partition int32) ([]int32, error) {
	if partition >= 0 {
		return []int32{partition}, nil
	}

	topics, err := k.admin.ListTopics(ctx, topicName)
	if err != nil {
		return nil, fmt.Errorf("consume: list partitions: %w", err)
	}
	td, ok := topics[topicName]
	if !ok {
		return nil, ErrTopicNotFound
	}

	ids := make([]int32, len(td.Partitions))
	for i, p := range td.Partitions.Sorted() {
		ids[i] = p.Partition
	}
	return ids, nil
}

// resolveStartOffset computes the actual start offset for a partition.
func (k *KafkaService) resolveStartOffset(ctx context.Context, topicName string, partition int32, startOffset int64, limit int) (int64, error) {
	if startOffset == -2 {
		return 0, nil
	}
	if startOffset >= 0 {
		return startOffset, nil
	}

	// startOffset == -1: latest → read last N messages
	endOffsets, err := k.admin.ListEndOffsets(ctx, topicName)
	if err != nil {
		return 0, fmt.Errorf("consume: list end offsets: %w", err)
	}
	if eo, ok := endOffsets.Lookup(topicName, partition); ok {
		actual := eo.Offset - int64(limit)
		if actual < 0 {
			actual = 0
		}
		return actual, nil
	}
	return 0, nil
}

// ProduceMessage sends a single message to a topic.
func (k *KafkaService) ProduceMessage(topicName string, partition int32, key string, value string, headers map[string]string) error {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return err
	}

	record := &kgo.Record{
		Topic:     topicName,
		Partition: partition,
		Key:       []byte(key),
		Value:     []byte(value),
	}

	for k, v := range headers {
		record.Headers = append(record.Headers, kgo.RecordHeader{
			Key:   k,
			Value: []byte(v),
		})
	}

	ctx := k.getCtx()
	// Synchronous produce using channel
	errCh := make(chan error, 1)
	k.client.Produce(ctx, record, func(_ *kgo.Record, err error) {
		errCh <- err
	})

	if err := <-errCh; err != nil {
		return fmt.Errorf("produce: %w", err)
	}

	return nil
}
