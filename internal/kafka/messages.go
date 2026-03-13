package kafka

import (
	"context"
	"fmt"
	"time"

	"github.com/twmb/franz-go/pkg/kgo"
)

// consumeFromOffsets creates a temporary consumer with the given per-partition
// offsets and polls up to `limit` messages. Shared by ConsumeMessages and
// ConsumeMessagesFromTimestamp.
func (k *KafkaService) consumeFromOffsets(
	ctx context.Context,
	topicName string,
	partOffsets map[int32]kgo.Offset,
	partEndOffsets map[int32]int64,
	limit int,
) ([]Message, error) {
	offsets := map[string]map[int32]kgo.Offset{topicName: partOffsets}
	consumerOpts := append(append([]kgo.Opt{}, k.baseOpts...), kgo.ConsumePartitions(offsets))

	consumer, err := kgo.NewClient(consumerOpts...)
	if err != nil {
		return nil, fmt.Errorf("consume: new consumer: %w", err)
	}
	defer consumer.Close()

	messages := make([]Message, 0, limit)

	// Safety timeout — should rarely be hit with end-offset tracking
	pollCtx, pollCancel := context.WithTimeout(ctx, 5*time.Second)
	defer pollCancel()

	partitions := make([]int32, 0, len(partOffsets))
	for p := range partOffsets {
		partitions = append(partitions, p)
	}

	// Track the highest consumed offset per partition
	consumed := make(map[int32]int64, len(partitions))

	for len(messages) < limit {
		fetches := consumer.PollFetches(pollCtx)

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
			if r.Offset+1 > consumed[r.Partition] {
				consumed[r.Partition] = r.Offset + 1
			}
		})

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

	partitions, err := k.resolvePartitions(ctx, topicName, partition)
	if err != nil {
		return nil, err
	}

	// Fetch end offsets once — reused for both start-offset resolution and
	// end-of-partition tracking (eliminates N+1 redundant broker round-trips).
	endOffsets, err := k.admin.ListEndOffsets(ctx, topicName)
	if err != nil {
		return nil, fmt.Errorf("consume: list end offsets: %w", err)
	}

	partOffsets := make(map[int32]kgo.Offset, len(partitions))
	partEndOffsets := make(map[int32]int64, len(partitions))
	for _, p := range partitions {
		if eo, ok := endOffsets.Lookup(topicName, p); ok {
			partEndOffsets[p] = eo.Offset
		}
		offset := resolveStartOffsetFromEndOffsets(partEndOffsets[p], startOffset, limit)
		partOffsets[p] = kgo.NewOffset().At(offset)
	}

	return k.consumeFromOffsets(ctx, topicName, partOffsets, partEndOffsets, limit)
}

// ConsumeMessagesFromTimestamp fetches N messages from a topic starting at the
// first offset whose timestamp >= timestampMs (Unix milliseconds).
// partition=-1 reads from all partitions.
func (k *KafkaService) ConsumeMessagesFromTimestamp(topicName string, partition int32, timestampMs int64, limit int) ([]Message, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 100
	}

	ctx := k.getCtx()

	partitions, err := k.resolvePartitions(ctx, topicName, partition)
	if err != nil {
		return nil, err
	}

	// Resolve per-partition offsets from timestamp
	timestampOffsets, err := k.admin.ListOffsetsAfterMilli(ctx, timestampMs, topicName)
	if err != nil {
		return nil, fmt.Errorf("consume: list offsets after milli: %w", err)
	}

	endOffsets, err := k.admin.ListEndOffsets(ctx, topicName)
	if err != nil {
		return nil, fmt.Errorf("consume: list end offsets: %w", err)
	}

	partOffsets := make(map[int32]kgo.Offset, len(partitions))
	partEndOffsets := make(map[int32]int64, len(partitions))
	for _, p := range partitions {
		if eo, ok := endOffsets.Lookup(topicName, p); ok {
			partEndOffsets[p] = eo.Offset
		}
		// Use timestamp-resolved offset; fall back to end offset if not found
		if to, ok := timestampOffsets.Lookup(topicName, p); ok && to.Offset >= 0 {
			partOffsets[p] = kgo.NewOffset().At(to.Offset)
		} else {
			partOffsets[p] = kgo.NewOffset().At(partEndOffsets[p])
		}
	}

	return k.consumeFromOffsets(ctx, topicName, partOffsets, partEndOffsets, limit)
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

// resolveStartOffsetFromEndOffsets computes the actual start offset for a partition
// using pre-fetched end offsets. No additional broker calls needed.
func resolveStartOffsetFromEndOffsets(endOffset int64, startOffset int64, limit int) int64 {
	if startOffset == -2 {
		return 0 // earliest
	}
	if startOffset >= 0 {
		return startOffset // explicit offset
	}
	// startOffset == -1: latest → read last N messages
	actual := endOffset - int64(limit)
	if actual < 0 {
		actual = 0
	}
	return actual
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
	errCh := make(chan error, 1)
	k.client.Produce(ctx, record, func(_ *kgo.Record, err error) {
		errCh <- err
	})

	if err := <-errCh; err != nil {
		return fmt.Errorf("produce: %w", err)
	}

	return nil
}
