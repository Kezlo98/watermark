package kafka

import (
	"context"
	"sync"
	"time"

	"github.com/twmb/franz-go/pkg/kadm"
)

// defaultCacheTTL is the default time-to-live for cached Kafka admin results.
// Kafka metadata (broker list, topic sizes) changes infrequently,
// so a 15-second TTL eliminates redundant broker round-trips
// while keeping data reasonably fresh.
const defaultCacheTTL = 15 * time.Second

// cachedEntry holds a cached result with its fetch timestamp.
type cachedEntry[T any] struct {
	data      T
	fetchedAt time.Time
}

// adminCache provides short-TTL in-memory caching for expensive Kafka admin
// API calls (DescribeAllLogDirs, Metadata). Thread-safe via its own mutex.
type adminCache struct {
	mu       sync.RWMutex
	ttl      time.Duration
	logDirs  *cachedEntry[kadm.DescribedAllLogDirs]
	metadata *cachedEntry[kadm.Metadata]
}

// newAdminCache creates a cache with the given TTL.
func newAdminCache(ttl time.Duration) *adminCache {
	return &adminCache{ttl: ttl}
}

// getLogDirs returns cached log dirs or fetches from the admin client.
func (c *adminCache) getLogDirs(ctx context.Context, admin *kadm.Client) (kadm.DescribedAllLogDirs, error) {
	// Fast path — read lock
	c.mu.RLock()
	if e := c.logDirs; e != nil && time.Since(e.fetchedAt) < c.ttl {
		c.mu.RUnlock()
		return e.data, nil
	}
	c.mu.RUnlock()

	// Slow path — write lock with double-check
	c.mu.Lock()
	defer c.mu.Unlock()
	if e := c.logDirs; e != nil && time.Since(e.fetchedAt) < c.ttl {
		return e.data, nil
	}

	dirs, err := admin.DescribeAllLogDirs(ctx, nil)
	if err != nil {
		return dirs, err
	}
	c.logDirs = &cachedEntry[kadm.DescribedAllLogDirs]{data: dirs, fetchedAt: time.Now()}
	return dirs, nil
}

// getMetadata returns cached metadata or fetches from the admin client.
func (c *adminCache) getMetadata(ctx context.Context, admin *kadm.Client) (kadm.Metadata, error) {
	// Fast path — read lock
	c.mu.RLock()
	if e := c.metadata; e != nil && time.Since(e.fetchedAt) < c.ttl {
		c.mu.RUnlock()
		return e.data, nil
	}
	c.mu.RUnlock()

	// Slow path — write lock with double-check
	c.mu.Lock()
	defer c.mu.Unlock()
	if e := c.metadata; e != nil && time.Since(e.fetchedAt) < c.ttl {
		return e.data, nil
	}

	meta, err := admin.Metadata(ctx)
	if err != nil {
		return meta, err
	}
	c.metadata = &cachedEntry[kadm.Metadata]{data: meta, fetchedAt: time.Now()}
	return meta, nil
}

// invalidate clears all cached entries (e.g. on disconnect or cluster switch).
func (c *adminCache) invalidate() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.logDirs = nil
	c.metadata = nil
}
