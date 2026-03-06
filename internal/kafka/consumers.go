package kafka

import (
	"fmt"

	"github.com/twmb/franz-go/pkg/kadm"
)

// GetConsumerGroups returns all consumer groups with state and lag summary.
func (k *KafkaService) GetConsumerGroups() ([]ConsumerGroup, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	groups, err := k.admin.ListGroups(ctx)
	if err != nil {
		return nil, fmt.Errorf("list groups: %w", err)
	}

	if len(groups) == 0 {
		return []ConsumerGroup{}, nil
	}

	groupIDs := make([]string, 0, len(groups))
	for _, g := range groups {
		groupIDs = append(groupIDs, g.Group)
	}

	// Get lag for all groups
	lags, err := k.admin.Lag(ctx, groupIDs...)
	if err != nil {
		// Fallback: return groups without lag info
		result := make([]ConsumerGroup, 0, len(groups))
		for _, g := range groups {
			result = append(result, ConsumerGroup{
				GroupID:  g.Group,
				State:    mapGroupState(g.State),
				Members:  0,
				TotalLag: 0,
			})
		}
		return result, nil
	}

	// Describe groups to get member count
	described, _ := k.admin.DescribeGroups(ctx, groupIDs...)
	memberCounts := make(map[string]int)
	for _, dg := range described {
		memberCounts[dg.Group] = len(dg.Members)
	}

	result := make([]ConsumerGroup, 0, len(groups))
	lags.Each(func(gl kadm.DescribedGroupLag) {
		totalLag := gl.Lag.Total()

		result = append(result, ConsumerGroup{
			GroupID:  gl.Group,
			State:    mapGroupState(gl.State),
			Members:  memberCounts[gl.Group],
			TotalLag: totalLag,
		})
	})

	if len(result) == 0 {
		return []ConsumerGroup{}, nil
	}

	return result, nil
}

// GetConsumerGroupDetail returns full detail for a single consumer group.
func (k *KafkaService) GetConsumerGroupDetail(groupID string) (*ConsumerGroupDetail, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	described, err := k.admin.DescribeGroups(ctx, groupID)
	if err != nil {
		return nil, fmt.Errorf("describe group: %w", err)
	}

	if len(described) == 0 {
		return nil, ErrGroupNotFound
	}

	dg := described[groupID]
	if dg.Err != nil {
		return nil, fmt.Errorf("describe group %s: %w", groupID, dg.Err)
	}

	// Map members
	members := make([]ConsumerGroupMember, 0, len(dg.Members))
	for _, m := range dg.Members {
		assigned := make([]int32, 0)
		if consumer, ok := m.Assigned.AsConsumer(); ok {
			for _, t := range consumer.Topics {
				assigned = append(assigned, t.Partitions...)
			}
		}

		members = append(members, ConsumerGroupMember{
			ClientID:           m.ClientID,
			Host:               m.ClientHost,
			AssignedPartitions: assigned,
		})
	}

	// Get lag details
	lags, err := k.admin.Lag(ctx, groupID)
	if err != nil {
		return nil, fmt.Errorf("group lag: %w", err)
	}

	var offsets []ConsumerGroupOffset
	lags.Each(func(gl kadm.DescribedGroupLag) {
		for _, ml := range gl.Lag.Sorted() {
			offsets = append(offsets, ConsumerGroupOffset{
				Topic:         ml.Topic,
				Partition:     ml.Partition,
				CurrentOffset: ml.Commit.At,
				EndOffset:     ml.End.Offset,
				Lag:           ml.Lag,
			})
		}
	})

	if offsets == nil {
		offsets = []ConsumerGroupOffset{}
	}

	return &ConsumerGroupDetail{
		GroupID:     groupID,
		State:       mapGroupState(dg.State),
		Coordinator: dg.Coordinator.NodeID,
		Members:     members,
		Offsets:     offsets,
	}, nil
}


// mapGroupState normalizes Kafka group state strings for frontend display.
func mapGroupState(state string) string {
	switch state {
	case "Stable":
		return "Stable"
	case "PreparingRebalance", "CompletingRebalance":
		return "Rebalancing"
	case "Dead":
		return "Dead"
	case "Empty":
		return "Empty"
	default:
		return "Unknown"
	}
}
