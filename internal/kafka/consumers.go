package kafka

import (
	"fmt"

	"github.com/twmb/franz-go/pkg/kadm"
	"golang.org/x/sync/errgroup"
)

// GetConsumerGroups returns all consumer groups with state and lag summary.
// Parallelizes Lag + DescribeGroups calls for faster response.
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

	// Parallel: Lag + DescribeGroups are independent (both only need groupIDs)
	var lags kadm.DescribedGroupLags
	var described kadm.DescribedGroups
	var lagsErr error

	g2, gCtx := errgroup.WithContext(ctx)
	g2.Go(func() error {
		var err error
		lags, err = k.admin.Lag(gCtx, groupIDs...)
		lagsErr = err
		return nil // graceful fallback
	})
	g2.Go(func() error {
		described, _ = k.admin.DescribeGroups(gCtx, groupIDs...)
		return nil
	})
	_ = g2.Wait()

	// Build member counts from described groups
	memberCounts := make(map[string]int)
	for _, dg := range described {
		memberCounts[dg.Group] = len(dg.Members)
	}

	// Fallback: return groups without lag info if Lag() failed
	if lagsErr != nil {
		result := make([]ConsumerGroup, 0, len(groups))
		for _, g := range groups {
			result = append(result, ConsumerGroup{
				GroupID:  g.Group,
				State:    mapGroupState(g.State),
				Members:  memberCounts[g.Group],
				TotalLag: 0,
			})
		}
		return result, nil
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
