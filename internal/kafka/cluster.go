package kafka

import (
	"fmt"

	"github.com/twmb/franz-go/pkg/kadm"
)

// GetClusterHealth returns cluster overview metrics for the Dashboard.
func (k *KafkaService) GetClusterHealth() (*ClusterHealth, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	metadata, err := k.admin.Metadata(ctx)
	if err != nil {
		return nil, fmt.Errorf("cluster health: %w", err)
	}

	brokersOnline := len(metadata.Brokers)
	topicCount := 0
	for _, t := range metadata.Topics {
		if !t.IsInternal {
			topicCount++
		}
	}

	// Estimate total size from log dirs (graceful fallback to 0)
	var totalSize int64
	logDirs, err := k.admin.DescribeAllLogDirs(ctx, nil)
	if err == nil {
		logDirs.Each(func(d kadm.DescribedLogDir) {
			totalSize += d.Topics.Size()
		})
	}

	status := "healthy"
	if brokersOnline == 0 {
		status = "offline"
	}

	return &ClusterHealth{
		Status:        status,
		BrokersOnline: brokersOnline,
		BrokersTotal:  brokersOnline,
		TopicCount:    topicCount,
		TotalSize:     totalSize,
	}, nil
}

// GetBrokers returns all broker details.
func (k *KafkaService) GetBrokers() ([]Broker, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()
	metadata, err := k.admin.Metadata(ctx)
	if err != nil {
		return nil, fmt.Errorf("brokers: %w", err)
	}

	// Count partitions per broker (leader partitions)
	partitionCounts := make(map[int32]int)
	for _, t := range metadata.Topics {
		for _, p := range t.Partitions {
			partitionCounts[p.Leader]++
		}
	}

	// Estimate sizes per broker from log dirs
	brokerSizes := make(map[int32]int64)
	logDirs, err := k.admin.DescribeAllLogDirs(ctx, nil)
	if err == nil {
		logDirs.Each(func(d kadm.DescribedLogDir) {
			brokerSizes[d.Broker] += d.Topics.Size()
		})
	}

	brokers := make([]Broker, 0, len(metadata.Brokers))
	for _, b := range metadata.Brokers {
		brokers = append(brokers, Broker{
			ID:           b.NodeID,
			Host:         b.Host,
			Port:         b.Port,
			Partitions:   partitionCounts[b.NodeID],
			Size:         brokerSizes[b.NodeID],
			IsController: b.NodeID == metadata.Controller,
		})
	}

	return brokers, nil
}
