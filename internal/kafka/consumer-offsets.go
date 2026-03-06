package kafka

import (
	"fmt"

	"github.com/twmb/franz-go/pkg/kadm"
)

// ResetConsumerGroupOffsets resets offsets for a consumer group.
// strategy: "earliest", "latest".
func (k *KafkaService) ResetConsumerGroupOffsets(groupID string, strategy string) error {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return err
	}

	ctx := k.getCtx()

	// Check group state — must be Empty or Dead
	described, err := k.admin.DescribeGroups(ctx, groupID)
	if err != nil {
		return fmt.Errorf("reset offsets: describe: %w", err)
	}
	dg := described[groupID]
	if dg.State == "Stable" || dg.State == "PreparingRebalance" || dg.State == "CompletingRebalance" {
		return ErrGroupActive
	}

	// Get current committed offsets to determine which topics/partitions
	committed, err := k.admin.FetchOffsets(ctx, groupID)
	if err != nil {
		return fmt.Errorf("reset offsets: fetch current: %w", err)
	}

	// Collect topic names from committed offsets
	topicMap := make(map[string]bool)
	committed.Each(func(o kadm.OffsetResponse) {
		topicMap[o.Topic] = true
	})
	topicNames := make([]string, 0, len(topicMap))
	for t := range topicMap {
		topicNames = append(topicNames, t)
	}
	if len(topicNames) == 0 {
		return fmt.Errorf("reset offsets: no committed offsets found")
	}

	// Build target offsets
	var targetOffsets kadm.Offsets
	switch strategy {
	case "earliest":
		starts, err := k.admin.ListStartOffsets(ctx, topicNames...)
		if err != nil {
			return fmt.Errorf("reset offsets: list start: %w", err)
		}
		targetOffsets = starts.Offsets()
	case "latest":
		ends, err := k.admin.ListEndOffsets(ctx, topicNames...)
		if err != nil {
			return fmt.Errorf("reset offsets: list end: %w", err)
		}
		targetOffsets = ends.Offsets()
	default:
		return fmt.Errorf("reset offsets: unsupported strategy: %s", strategy)
	}

	if _, err := k.admin.CommitOffsets(ctx, groupID, targetOffsets); err != nil {
		return fmt.Errorf("reset offsets: commit: %w", err)
	}

	return nil
}
