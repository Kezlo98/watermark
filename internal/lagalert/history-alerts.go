package lagalert

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

// --- History (lag-alert-history.json) ---

func (s *HistoryStore) loadHistory() (*AlertHistory, error) {
	path := filepath.Join(s.configDir, historyFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &AlertHistory{Alerts: []AlertEvent{}}, nil
		}
		return nil, fmt.Errorf("read lag-alert-history: %w", err)
	}
	var h AlertHistory
	if err := json.Unmarshal(data, &h); err != nil {
		return &AlertHistory{Alerts: []AlertEvent{}}, nil
	}
	if h.Alerts == nil {
		h.Alerts = []AlertEvent{}
	}
	return &h, nil
}

func (s *HistoryStore) saveHistory(h *AlertHistory) error {
	return atomicWrite(filepath.Join(s.configDir, historyFileName), h)
}

// AppendAlert adds a new alert event to history.
func (s *HistoryStore) AppendAlert(event AlertEvent) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return err
	}
	h.Alerts = append(h.Alerts, event)
	// Trim to max
	if len(h.Alerts) > maxAlerts {
		h.Alerts = h.Alerts[len(h.Alerts)-maxAlerts:]
	}
	return s.saveHistory(h)
}

// ResolveAlert marks an alert as resolved by ID.
func (s *HistoryStore) ResolveAlert(alertID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	for i, a := range h.Alerts {
		if a.ID == alertID {
			h.Alerts[i].Resolved = true
			h.Alerts[i].ResolvedAt = &now
			return s.saveHistory(h)
		}
	}
	return nil // not found is not an error
}

// MarkRead marks a single alert as read.
func (s *HistoryStore) MarkRead(alertID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return err
	}
	for i, a := range h.Alerts {
		if a.ID == alertID {
			h.Alerts[i].Read = true
			return s.saveHistory(h)
		}
	}
	return nil
}

// MarkAllRead marks all alerts for a cluster as read.
func (s *HistoryStore) MarkAllRead(clusterID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return err
	}
	for i, a := range h.Alerts {
		if a.ClusterID == clusterID {
			h.Alerts[i].Read = true
		}
	}
	return s.saveHistory(h)
}

// ClearAll removes all alerts for a cluster.
func (s *HistoryStore) ClearAll(clusterID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return err
	}
	filtered := h.Alerts[:0]
	for _, a := range h.Alerts {
		if a.ClusterID != clusterID {
			filtered = append(filtered, a)
		}
	}
	h.Alerts = filtered
	return s.saveHistory(h)
}

// GetAlerts returns all alerts for a cluster (newest first).
func (s *HistoryStore) GetAlerts(clusterID string) []AlertEvent {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return []AlertEvent{}
	}
	var result []AlertEvent
	for i := len(h.Alerts) - 1; i >= 0; i-- {
		if h.Alerts[i].ClusterID == clusterID {
			result = append(result, h.Alerts[i])
		}
	}
	if result == nil {
		return []AlertEvent{}
	}
	return result
}

// GetUnreadCount returns the count of unread, unresolved alerts for a cluster.
func (s *HistoryStore) GetUnreadCount(clusterID string) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return 0
	}
	count := 0
	for _, a := range h.Alerts {
		if a.ClusterID == clusterID && !a.Read && !a.Resolved {
			count++
		}
	}
	return count
}

// RunCleanupIfNeeded checks whether cleanup is due and, if so, purges expired
// alerts and trims to maxAlerts — all in a single lock+disk-read cycle.
// Should be called on init and periodically (e.g. every poll tick).
func (s *HistoryStore) RunCleanupIfNeeded() {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return
	}

	if time.Since(h.LastCleanup) <= cleanupPeriod {
		return // not due yet
	}

	now := time.Now().UTC()
	filtered := h.Alerts[:0]
	for _, a := range h.Alerts {
		age := now.Sub(a.Timestamp)
		if a.Resolved && age > resolvedTTL {
			continue // drop resolved alerts older than 24h
		}
		if !a.Resolved && age > unresolvedTTL {
			continue // drop unresolved alerts older than 7d
		}
		filtered = append(filtered, a)
	}

	// Trim to max
	if len(filtered) > maxAlerts {
		filtered = filtered[len(filtered)-maxAlerts:]
	}

	h.Alerts = filtered
	h.LastCleanup = now
	if err := s.saveHistory(h); err != nil {
		log.Printf("lagalert: cleanup save error: %v", err)
	}
}
