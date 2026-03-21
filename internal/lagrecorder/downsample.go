package lagrecorder

import "time"

const (
	compactionInterval = 5 * time.Minute
	rawRetention       = 1 * time.Hour
	min1Retention      = 24 * time.Hour
	min5Retention      = 7 * 24 * time.Hour
	min15Retention     = 30 * 24 * time.Hour
)

// downsample groups snapshots into buckets of given duration,
// averaging lag values per topic/group within each bucket.
func downsample(snapshots []LagSnapshot, bucketSize time.Duration) []LagSnapshot {
	if len(snapshots) == 0 {
		return nil
	}

	type bucket struct {
		groups map[string][]int64
		topics map[string][]int64
		ts     time.Time // midpoint of bucket
	}

	buckets := make(map[int64]*bucket)

	for _, s := range snapshots {
		key := s.Timestamp.UnixNano() / int64(bucketSize)
		b, ok := buckets[key]
		if !ok {
			// Use the first timestamp in the bucket as representative
			b = &bucket{
				groups: make(map[string][]int64),
				topics: make(map[string][]int64),
				ts:     s.Timestamp,
			}
			buckets[key] = b
		}
		for g, lag := range s.Groups {
			b.groups[g] = append(b.groups[g], lag)
		}
		for t, lag := range s.Topics {
			b.topics[t] = append(b.topics[t], lag)
		}
	}

	result := make([]LagSnapshot, 0, len(buckets))
	for _, b := range buckets {
		snap := LagSnapshot{
			Timestamp: b.ts,
			Groups:    make(map[string]int64, len(b.groups)),
			Topics:    make(map[string]int64, len(b.topics)),
		}
		for g, lags := range b.groups {
			snap.Groups[g] = avgInt64(lags)
		}
		for t, lags := range b.topics {
			snap.Topics[t] = avgInt64(lags)
		}
		result = append(result, snap)
	}

	return result
}

// avgInt64 returns the average of a slice of int64 values.
func avgInt64(vals []int64) int64 {
	if len(vals) == 0 {
		return 0
	}
	var sum int64
	for _, v := range vals {
		sum += v
	}
	return sum / int64(len(vals))
}

// trimBefore removes snapshots older than cutoff.
func trimBefore(snapshots []LagSnapshot, cutoff time.Time) []LagSnapshot {
	result := make([]LagSnapshot, 0, len(snapshots))
	for _, s := range snapshots {
		if !s.Timestamp.Before(cutoff) {
			result = append(result, s)
		}
	}
	return result
}
