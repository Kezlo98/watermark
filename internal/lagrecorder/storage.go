package lagrecorder

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

// Recorder is a storage-only lag time-series manager.
// No goroutines — caller (LagAlertService) drives recording.
type Recorder struct {
	configDir string
	clusterID string
	data      *TimeSeriesData
	mu        sync.RWMutex
}

// NewRecorder creates a recorder for a cluster.
func NewRecorder(configDir string) *Recorder {
	return &Recorder{
		configDir: configDir,
		data:      &TimeSeriesData{},
	}
}

// Load reads persisted time-series data for a cluster.
func (r *Recorder) Load(clusterID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.clusterID = clusterID
	path := r.filePath()

	raw, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			r.data = &TimeSeriesData{}
			return nil
		}
		return err
	}

	var data TimeSeriesData
	if err := json.Unmarshal(raw, &data); err != nil {
		log.Printf("lagrecorder: corrupt data file, resetting: %v", err)
		r.data = &TimeSeriesData{}
		return nil
	}

	r.data = &data
	return nil
}

// Record appends a snapshot to the raw tier.
// Called on every alert poll tick.
func (r *Recorder) Record(snapshot LagSnapshot) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.data.Raw = append(r.data.Raw, snapshot)

	// Check if compaction is due (every 5 min)
	if time.Since(r.data.LastCompaction) >= compactionInterval {
		r.compactLocked()
	}
}

// compactLocked runs down-sampling + persistence. Caller holds lock.
func (r *Recorder) compactLocked() {
	now := time.Now().UTC()

	// 1. Move raw data older than 1h → downsample into min1
	rawCutoff := now.Add(-rawRetention)
	var oldRaw []LagSnapshot
	var newRaw []LagSnapshot
	for _, s := range r.data.Raw {
		if s.Timestamp.Before(rawCutoff) {
			oldRaw = append(oldRaw, s)
		} else {
			newRaw = append(newRaw, s)
		}
	}
	if len(oldRaw) > 0 {
		downsampled := downsample(oldRaw, 1*time.Minute)
		r.data.Min1 = append(r.data.Min1, downsampled...)
	}
	r.data.Raw = newRaw

	// 2. Move min1 data older than 1d → downsample into min5
	min1Cutoff := now.Add(-min1Retention)
	var oldMin1 []LagSnapshot
	var newMin1 []LagSnapshot
	for _, s := range r.data.Min1 {
		if s.Timestamp.Before(min1Cutoff) {
			oldMin1 = append(oldMin1, s)
		} else {
			newMin1 = append(newMin1, s)
		}
	}
	if len(oldMin1) > 0 {
		downsampled := downsample(oldMin1, 5*time.Minute)
		r.data.Min5 = append(r.data.Min5, downsampled...)
	}
	r.data.Min1 = newMin1

	// 3. Move min5 data older than 7d → downsample into min15
	min5Cutoff := now.Add(-min5Retention)
	var oldMin5 []LagSnapshot
	var newMin5 []LagSnapshot
	for _, s := range r.data.Min5 {
		if s.Timestamp.Before(min5Cutoff) {
			oldMin5 = append(oldMin5, s)
		} else {
			newMin5 = append(newMin5, s)
		}
	}
	if len(oldMin5) > 0 {
		downsampled := downsample(oldMin5, 15*time.Minute)
		r.data.Min15 = append(r.data.Min15, downsampled...)
	}
	r.data.Min5 = newMin5

	// 4. Trim min15 data older than 30d
	r.data.Min15 = trimBefore(r.data.Min15, now.Add(-min15Retention))

	// 5. Persist to JSON
	r.data.LastCompaction = now
	if err := r.save(); err != nil {
		log.Printf("lagrecorder: save error: %v", err)
	}
}

// GetTopicTimeSeries returns data points for a topic within a time window.
func (r *Recorder) GetTopicTimeSeries(topic string, window string) []LagDataPoint {
	r.mu.RLock()
	defer r.mu.RUnlock()

	snapshots := r.snapshotsForWindow(window)
	result := make([]LagDataPoint, 0, len(snapshots))
	for _, s := range snapshots {
		if lag, ok := s.Topics[topic]; ok {
			result = append(result, LagDataPoint{
				Timestamp: s.Timestamp,
				Lag:       lag,
			})
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Timestamp.Before(result[j].Timestamp)
	})
	return result
}

// GetGroupTimeSeries returns data points for a group within a time window.
func (r *Recorder) GetGroupTimeSeries(groupID string, window string) []LagDataPoint {
	r.mu.RLock()
	defer r.mu.RUnlock()

	snapshots := r.snapshotsForWindow(window)
	result := make([]LagDataPoint, 0, len(snapshots))
	for _, s := range snapshots {
		if lag, ok := s.Groups[groupID]; ok {
			result = append(result, LagDataPoint{
				Timestamp: s.Timestamp,
				Lag:       lag,
			})
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Timestamp.Before(result[j].Timestamp)
	})
	return result
}

// snapshotsForWindow returns the appropriate tier snapshots for a time window.
func (r *Recorder) snapshotsForWindow(window string) []LagSnapshot {
	now := time.Now().UTC()
	var cutoff time.Time

	switch window {
	case "1h":
		cutoff = now.Add(-1 * time.Hour)
		return filterAfter(r.data.Raw, cutoff)
	case "12h":
		cutoff = now.Add(-12 * time.Hour)
		return append(filterAfter(r.data.Raw, cutoff), filterAfter(r.data.Min1, cutoff)...)
	case "1d":
		cutoff = now.Add(-24 * time.Hour)
		return append(filterAfter(r.data.Raw, cutoff), filterAfter(r.data.Min1, cutoff)...)
	case "7d":
		cutoff = now.Add(-7 * 24 * time.Hour)
		return mergeTiers(r.data.Raw, r.data.Min1, r.data.Min5, cutoff)
	case "15d":
		cutoff = now.Add(-15 * 24 * time.Hour)
		return mergeTiers(r.data.Raw, r.data.Min1, r.data.Min5, cutoff)
	case "30d":
		cutoff = now.Add(-30 * 24 * time.Hour)
		return mergeTiers(r.data.Raw, r.data.Min1, r.data.Min5, cutoff)
	default:
		cutoff = now.Add(-1 * time.Hour)
		return filterAfter(r.data.Raw, cutoff)
	}
}

// filterAfter returns snapshots with timestamp >= cutoff.
func filterAfter(snapshots []LagSnapshot, cutoff time.Time) []LagSnapshot {
	var result []LagSnapshot
	for _, s := range snapshots {
		if !s.Timestamp.Before(cutoff) {
			result = append(result, s)
		}
	}
	return result
}

// mergeTiers combines multiple tiers, filtering by cutoff.
func mergeTiers(raw, min1, min5 []LagSnapshot, cutoff time.Time) []LagSnapshot {
	var result []LagSnapshot
	result = append(result, filterAfter(raw, cutoff)...)
	result = append(result, filterAfter(min1, cutoff)...)
	result = append(result, filterAfter(min5, cutoff)...)
	return result
}

// save persists to ~/.watermark/lag-timeseries-{clusterID}.json
func (r *Recorder) save() error {
	data, err := json.Marshal(r.data)
	if err != nil {
		return err
	}

	path := r.filePath()
	tmpPath := path + ".tmp"

	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmpPath, path)
}

// filePath returns the JSON file path for the current cluster.
func (r *Recorder) filePath() string {
	return filepath.Join(r.configDir, "lag-timeseries-"+r.clusterID+".json")
}

// Reset clears in-memory data (called on cluster disconnect).
func (r *Recorder) Reset() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = &TimeSeriesData{}
	r.clusterID = ""
}
