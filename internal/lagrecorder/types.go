package lagrecorder

import "time"

// RecorderConfig holds per-cluster chart recording settings.
type RecorderConfig struct {
	Enabled bool `json:"enabled"`
}

// LagDataPoint represents a single time-series point for charting.
type LagDataPoint struct {
	Timestamp time.Time `json:"timestamp"`
	Lag       int64     `json:"lag"`
}

// LagSnapshot captures lag for all groups and topics at one moment.
type LagSnapshot struct {
	Timestamp time.Time        `json:"timestamp"`
	Groups    map[string]int64 `json:"groups"` // groupID → totalLag
	Topics    map[string]int64 `json:"topics"` // topic → sumLag
}

// TimeSeriesData is the persisted structure per cluster.
type TimeSeriesData struct {
	Raw            []LagSnapshot `json:"raw"`   // full resolution (< 1h)
	Min1           []LagSnapshot `json:"min1"`  // 1-min buckets (1h–1d)
	Min5           []LagSnapshot `json:"min5"`  // 5-min buckets (1d–7d)
	Min15          []LagSnapshot `json:"min15"` // 15-min buckets (7d–30d)
	LastCompaction time.Time     `json:"lastCompaction"`
}
