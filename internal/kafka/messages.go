package kafka

import (
	"fmt"
	"time"

	"github.com/twmb/franz-go/pkg/kgo"
)

// ConsumeMessages fetches N messages from a topic starting at given offset.
// Use startOffset=-1 for latest (will compute latest-limit), -2 for earliest.
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

	// Determine the actual start offset
	actualOffset := startOffset
	if startOffset == -1 {
		// Latest: get end offset and subtract limit
		endOffsets, err := k.admin.ListEndOffsets(ctx, topicName)
		if err != nil {
			return nil, fmt.Errorf("consume: list end offsets: %w", err)
		}
		if eo, ok := endOffsets.Lookup(topicName, partition); ok {
			actualOffset = eo.Offset - int64(limit)
			if actualOffset < 0 {
				actualOffset = 0
			}
		}
	} else if startOffset == -2 {
		actualOffset = 0
	}

	// Build consumer-specific offset map
	offsets := map[string]map[int32]kgo.Offset{
		topicName: {
			partition: kgo.NewOffset().At(actualOffset),
		},
	}

	// Create a temporary consumer client
	consumerOpts := []kgo.Opt{
		kgo.SeedBrokers(k.client.OptValue(kgo.SeedBrokers).([]string)...),
		kgo.ConsumePartitions(offsets),
	}

	consumer, err := kgo.NewClient(consumerOpts...)
	if err != nil {
		return nil, fmt.Errorf("consume: new consumer: %w", err)
	}
	defer consumer.Close()

	messages := make([]Message, 0, limit)
	deadline := time.After(10 * time.Second)

	for len(messages) < limit {
		select {
		case <-deadline:
			return messages, nil
		default:
		}

		fetches := consumer.PollFetches(ctx)
		if errs := fetches.Errors(); len(errs) > 0 {
			// Return what we have so far
			return messages, nil
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
		})
	}

	return messages, nil
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
