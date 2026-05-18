package kafka

import (
	"sort"
	"time"
)

// clampedBudget computes per-partition fetch budget and total hard cap.
// Guarantees each partition gets enough budget to cover the latest-N window.
func clampedBudget(limit, partitionCount int) (perPartition, totalCap int) {
	if partitionCount <= 0 {
		partitionCount = 1
	}
	evenSplit := (limit + partitionCount - 1) / partitionCount // ceil
	perPartition = limit
	if evenSplit*2 > perPartition {
		perPartition = evenSplit * 2
	}
	totalCap = perPartition * partitionCount
	if totalCap > 5000 {
		totalCap = 5000
		perPartition = 5000 / partitionCount
		if perPartition < 1 {
			perPartition = 1
		}
	}
	return perPartition, totalCap
}

type msgWithTime struct {
	msg    Message
	parsed time.Time
}

// mergeSortTrim sorts msgs by timestamp (then partition, then offset) and trims to limit.
// descByTime=true → latest first (DESC); false → earliest first (ASC).
func mergeSortTrim(msgs []Message, limit int, descByTime bool) []Message {
	if len(msgs) == 0 {
		return msgs
	}
	items := make([]msgWithTime, len(msgs))
	for i, m := range msgs {
		t, _ := time.Parse(time.RFC3339, m.Timestamp)
		items[i] = msgWithTime{msg: m, parsed: t}
	}
	sort.SliceStable(items, func(i, j int) bool {
		if !items[i].parsed.Equal(items[j].parsed) {
			if descByTime {
				return items[i].parsed.After(items[j].parsed)
			}
			return items[i].parsed.Before(items[j].parsed)
		}
		if items[i].msg.Partition != items[j].msg.Partition {
			return items[i].msg.Partition < items[j].msg.Partition
		}
		return items[i].msg.Offset < items[j].msg.Offset
	})
	if len(items) > limit {
		items = items[:limit]
	}
	result := make([]Message, len(items))
	for i, it := range items {
		result[i] = it.msg
	}
	return result
}
