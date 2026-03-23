package lagalert

import "time"

// AlertLevel represents the severity of a lag alert.
type AlertLevel string

const (
	AlertLevelWarning  AlertLevel = "warning"
	AlertLevelCritical AlertLevel = "critical"
)

// AlertRule defines a glob pattern and thresholds for a consumer group.
type AlertRule struct {
	ID           string `json:"id"`
	GroupPattern string `json:"groupPattern"`
	WarningLag   int64  `json:"warningLag"`
	CriticalLag  int64  `json:"criticalLag"`
	Enabled      bool   `json:"enabled"`
}

// ClusterAlertConfig holds per-cluster alert settings and rules.
type ClusterAlertConfig struct {
	Enabled           bool        `json:"enabled"`
	PollIntervalSec   int         `json:"pollIntervalSec"`
	NotifyOS          bool        `json:"notifyOS"`
	NotificationSound bool        `json:"notificationSound"`
	RecordingEnabled  bool        `json:"recordingEnabled"`
	Rules             []AlertRule `json:"rules"`
	TrackedTopics     []string    `json:"trackedTopics"`  // glob patterns; empty = record nothing (opt-in)
	TrackedGroups     []string    `json:"trackedGroups"`  // glob patterns; empty = record nothing
	ExcludedTopics    []string    `json:"excludedTopics"` // glob patterns; exclude wins over include
	ExcludedGroups    []string    `json:"excludedGroups"` // glob patterns; exclude wins over include
}

// AlertEvent represents a single lag breach or recovery event.
type AlertEvent struct {
	ID          string     `json:"id"`
	ClusterID   string     `json:"clusterId"`
	GroupID     string     `json:"groupId"`
	MatchedRule string     `json:"matchedRule"`
	RulePattern string     `json:"rulePattern"`
	Level       AlertLevel `json:"level"`
	Lag         int64      `json:"lag"`
	Threshold   int64      `json:"threshold"`
	Timestamp   time.Time  `json:"timestamp"`
	Resolved    bool       `json:"resolved"`
	ResolvedAt  *time.Time `json:"resolvedAt,omitempty"`
	Read        bool       `json:"read"`
}

// LagAlertData is the top-level structure persisted to lag-alerts.json.
type LagAlertData struct {
	Clusters map[string]*ClusterAlertConfig `json:"clusters"`
}

// AlertHistory is the top-level structure persisted to lag-alert-history.json.
type AlertHistory struct {
	Alerts      []AlertEvent `json:"alerts"`
	LastCleanup time.Time    `json:"lastCleanup"`
}

// LagAlertPayload is emitted via Wails Events to the frontend.
type LagAlertPayload struct {
	Type   string       `json:"type"`   // "breach" | "recovery"
	Alerts []AlertEvent `json:"alerts"` // new/changed alerts this cycle
}
