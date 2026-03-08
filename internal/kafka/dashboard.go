package kafka

import (
	"fmt"

	"github.com/twmb/franz-go/pkg/kadm"
	"golang.org/x/sync/errgroup"
)

// DashboardData is a combined response for the Dashboard page,
// avoiding duplicate Metadata + LogDirs calls from separate endpoints.
type DashboardData struct {
	Health  *ClusterHealth `json:"health"`
	Brokers []Broker       `json:"brokers"`
}

// GetDashboardData returns both cluster health and brokers in a single call.
// This eliminates the duplicate Metadata + LogDirs calls that happen when
// the frontend queries GetClusterHealth and GetBrokers independently.
func (k *KafkaService) GetDashboardData() (*DashboardData, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()

	// Parallel: Metadata + LogDirs — only called ONCE
	var metadata kadm.Metadata
	var logDirs kadm.DescribedAllLogDirs
	var logDirsErr error

	g, gCtx := errgroup.WithContext(ctx)
	g.Go(func() error {
		var err error
		metadata, err = k.cache.getMetadata(gCtx, k.admin)
		if err != nil {
			return fmt.Errorf("dashboard: metadata: %w", err)
		}
		return nil
	})
	g.Go(func() error {
		var err error
		logDirs, err = k.cache.getLogDirs(gCtx, k.admin)
		logDirsErr = err
		return nil
	})
	if err := g.Wait(); err != nil {
		return nil, err
	}

	// --- Build health ---
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

	// --- Build brokers ---
	partitionCounts := make(map[int32]int)
	for _, t := range metadata.Topics {
		for _, p := range t.Partitions {
			partitionCounts[p.Leader]++
		}
	}
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

	return &DashboardData{
		Health: &ClusterHealth{
			Status:        status,
			BrokersOnline: brokersOnline,
			BrokersTotal:  brokersOnline,
			TopicCount:    topicCount,
			TotalSize:     totalSize,
		},
		Brokers: brokers,
	}, nil
}
