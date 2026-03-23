package lagalert

import (
	"watermark-01/internal/lagrecorder"

	"github.com/google/uuid"
)

// --- Wails-bound public methods ---

// GetAlertConfig returns the alert config for a cluster.
func (s *LagAlertService) GetAlertConfig(clusterID string) *ClusterAlertConfig {
	return s.store.GetClusterConfig(clusterID)
}

// SaveAlertConfig persists the full config for a cluster.
func (s *LagAlertService) SaveAlertConfig(clusterID string, cfg ClusterAlertConfig) error {
	return s.store.SaveClusterConfig(clusterID, cfg)
}

// AddRule appends a new rule (assigns a UUID if ID is empty).
func (s *LagAlertService) AddRule(clusterID string, rule AlertRule) error {
	if rule.ID == "" {
		rule.ID = uuid.New().String()
	}
	return s.store.AddRule(clusterID, rule)
}

// UpdateRule replaces an existing rule by ID.
func (s *LagAlertService) UpdateRule(clusterID string, rule AlertRule) error {
	return s.store.UpdateRule(clusterID, rule)
}

// DeleteRule removes a rule by ID.
func (s *LagAlertService) DeleteRule(clusterID, ruleID string) error {
	return s.store.DeleteRule(clusterID, ruleID)
}

// GetAlerts returns alerts for a cluster (newest first).
func (s *LagAlertService) GetAlerts(clusterID string) []AlertEvent {
	return s.store.GetAlerts(clusterID)
}

// GetUnreadCount returns the count of unread alerts for a cluster.
func (s *LagAlertService) GetUnreadCount(clusterID string) int {
	return s.store.GetUnreadCount(clusterID)
}

// MarkAllRead marks all alerts for a cluster as read.
func (s *LagAlertService) MarkAllRead(clusterID string) error {
	return s.store.MarkAllRead(clusterID)
}

// ClearAlerts removes all alerts for a cluster.
func (s *LagAlertService) ClearAlerts(clusterID string) error {
	return s.store.ClearAll(clusterID)
}

// GetTopicTimeSeries delegates to recorder — returns lag data points for a topic.
func (s *LagAlertService) GetTopicTimeSeries(topic string, window string) []lagrecorder.LagDataPoint {
	if s.recorder == nil {
		return nil
	}
	return s.recorder.GetTopicTimeSeries(topic, window)
}

// GetGroupTimeSeries delegates to recorder — returns lag data points for a consumer group.
func (s *LagAlertService) GetGroupTimeSeries(groupID string, window string) []lagrecorder.LagDataPoint {
	if s.recorder == nil {
		return nil
	}
	return s.recorder.GetGroupTimeSeries(groupID, window)
}
