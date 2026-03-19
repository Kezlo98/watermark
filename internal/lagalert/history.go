package lagalert

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const (
	rulesFileName   = "lag-alerts.json"
	historyFileName = "lag-alert-history.json"

	// TTLs for cleanup
	resolvedTTL   = 24 * time.Hour
	unresolvedTTL = 7 * 24 * time.Hour
	maxAlerts     = 200
	cleanupPeriod = time.Hour
)

// HistoryStore manages persistence of alert rules and alert history.
type HistoryStore struct {
	configDir string
	mu        sync.Mutex
}

// NewHistoryStore creates a new HistoryStore backed by configDir.
func NewHistoryStore(configDir string) *HistoryStore {
	return &HistoryStore{configDir: configDir}
}

// --- Rules (lag-alerts.json) ---

func (s *HistoryStore) loadRules() (*LagAlertData, error) {
	path := filepath.Join(s.configDir, rulesFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &LagAlertData{Clusters: make(map[string]*ClusterAlertConfig)}, nil
		}
		return nil, fmt.Errorf("read lag-alerts: %w", err)
	}
	var d LagAlertData
	if err := json.Unmarshal(data, &d); err != nil {
		// Corrupt file — return empty defaults
		return &LagAlertData{Clusters: make(map[string]*ClusterAlertConfig)}, nil
	}
	if d.Clusters == nil {
		d.Clusters = make(map[string]*ClusterAlertConfig)
	}
	return &d, nil
}

func (s *HistoryStore) saveRules(d *LagAlertData) error {
	return atomicWrite(filepath.Join(s.configDir, rulesFileName), d)
}

// GetClusterConfig returns the alert config for a cluster, or nil if not set.
func (s *HistoryStore) GetClusterConfig(clusterID string) *ClusterAlertConfig {
	s.mu.Lock()
	defer s.mu.Unlock()

	d, err := s.loadRules()
	if err != nil {
		return nil
	}
	cfg, ok := d.Clusters[clusterID]
	if !ok {
		return nil
	}
	// Return a copy
	copy := *cfg
	rules := make([]AlertRule, len(cfg.Rules))
	for i, r := range cfg.Rules {
		rules[i] = r
	}
	copy.Rules = rules
	return &copy
}

// SaveClusterConfig persists the full config for a cluster.
func (s *HistoryStore) SaveClusterConfig(clusterID string, cfg ClusterAlertConfig) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	d, err := s.loadRules()
	if err != nil {
		return err
	}
	d.Clusters[clusterID] = &cfg
	return s.saveRules(d)
}

// AddRule appends a new rule to a cluster's config.
func (s *HistoryStore) AddRule(clusterID string, rule AlertRule) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	d, err := s.loadRules()
	if err != nil {
		return err
	}
	cfg := ensureClusterConfig(d, clusterID)
	cfg.Rules = append(cfg.Rules, rule)
	return s.saveRules(d)
}

// UpdateRule replaces an existing rule by ID.
func (s *HistoryStore) UpdateRule(clusterID string, rule AlertRule) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	d, err := s.loadRules()
	if err != nil {
		return err
	}
	cfg := ensureClusterConfig(d, clusterID)
	for i, r := range cfg.Rules {
		if r.ID == rule.ID {
			cfg.Rules[i] = rule
			return s.saveRules(d)
		}
	}
	return fmt.Errorf("rule %s not found", rule.ID)
}

// DeleteRule removes a rule by ID from a cluster's config.
func (s *HistoryStore) DeleteRule(clusterID, ruleID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	d, err := s.loadRules()
	if err != nil {
		return err
	}
	cfg := ensureClusterConfig(d, clusterID)
	filtered := cfg.Rules[:0]
	for _, r := range cfg.Rules {
		if r.ID != ruleID {
			filtered = append(filtered, r)
		}
	}
	cfg.Rules = filtered
	return s.saveRules(d)
}

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

// RunCleanup purges expired alerts and trims to maxAlerts.
// Should be called on init and periodically (hourly).
func (s *HistoryStore) RunCleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return
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
	_ = s.saveHistory(h)
}

// NeedsCleanup returns true if an hourly cleanup is due.
func (s *HistoryStore) NeedsCleanup() bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	h, err := s.loadHistory()
	if err != nil {
		return true
	}
	return time.Since(h.LastCleanup) > cleanupPeriod
}

// --- Helpers ---

// ensureClusterConfig returns the existing config or creates a default one.
func ensureClusterConfig(d *LagAlertData, clusterID string) *ClusterAlertConfig {
	if _, ok := d.Clusters[clusterID]; !ok {
		d.Clusters[clusterID] = &ClusterAlertConfig{
			PollIntervalSec: 30,
			Rules:           []AlertRule{},
		}
	}
	return d.Clusters[clusterID]
}

// atomicWrite marshals v to JSON and writes it atomically via a temp file + rename.
func atomicWrite(path string, v any) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return fmt.Errorf("write tmp: %w", err)
	}
	if err := os.Rename(tmp, path); err != nil {
		_ = os.Remove(tmp)
		return fmt.Errorf("rename: %w", err)
	}
	return nil
}
