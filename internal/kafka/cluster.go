package kafka

import (
	"fmt"

	"github.com/twmb/franz-go/pkg/kadm"
	"golang.org/x/sync/errgroup"
)

// GetClusterHealth returns cluster overview metrics for the Dashboard.
// Parallelizes Metadata + DescribeAllLogDirs for faster response.
func (k *KafkaService) GetClusterHealth() (*ClusterHealth, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()

	// Parallel: Metadata + LogDirs are independent
	var metadata kadm.Metadata
	var logDirs kadm.DescribedAllLogDirs
	var logDirsErr error

	g, gCtx := errgroup.WithContext(ctx)
	safeGo(g, func() error {
		var err error
		metadata, err = k.cache.getMetadata(gCtx, k.admin)
		if err != nil {
			return fmt.Errorf("cluster health: %w", err)
		}
		return nil
	})
	safeGo(g, func() error {
		var err error
		logDirs, err = k.cache.getLogDirs(gCtx, k.admin)
		logDirsErr = err // graceful fallback
		return nil
	})
	if err := g.Wait(); err != nil {
		return nil, err
	}

	brokersOnline := len(metadata.Brokers)
	topicCount := 0
	for _, t := range metadata.Topics {
		if !t.IsInternal {
			topicCount++
		}
	}

	var totalSize int64
	if logDirsErr == nil {
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
// Parallelizes Metadata + DescribeAllLogDirs for faster response.
func (k *KafkaService) GetBrokers() ([]Broker, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()

	// Parallel: Metadata + LogDirs are independent
	var metadata kadm.Metadata
	var logDirs kadm.DescribedAllLogDirs
	var logDirsErr error

	g, gCtx := errgroup.WithContext(ctx)
	safeGo(g, func() error {
		var err error
		metadata, err = k.cache.getMetadata(gCtx, k.admin)
		if err != nil {
			return fmt.Errorf("brokers: %w", err)
		}
		return nil
	})
	safeGo(g, func() error {
		var err error
		logDirs, err = k.cache.getLogDirs(gCtx, k.admin)
		logDirsErr = err // graceful fallback
		return nil
	})
	if err := g.Wait(); err != nil {
		return nil, err
	}

	// Count partitions per broker (leader partitions)
	partitionCounts := make(map[int32]int)
	for _, t := range metadata.Topics {
		for _, p := range t.Partitions {
			partitionCounts[p.Leader]++
		}
	}

	// Sizes per broker from log dirs
	brokerSizes := make(map[int32]int64)
	if logDirsErr == nil {
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
