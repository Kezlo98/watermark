package lagalert

import (
	"context"
	"fmt"
	"log"
	"path"
	"sync"
	"time"

	"watermark-01/internal/kafka"
	"watermark-01/internal/lagrecorder"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/google/uuid"
)

// LagAlertService monitors consumer group lag and emits alerts.
// It is fully opt-in: no goroutine is spawned unless the cluster has
// alert config with enabled=true and at least one enabled rule.
type LagAlertService struct {
	kafkaSvc    *kafka.KafkaService
	store       *HistoryStore
	notifier    *Notifier
	recorder    *lagrecorder.Recorder
	ctx         context.Context
	cancel      context.CancelFunc
	running     bool
	mu          sync.Mutex
	clusterID   string
	// breachState tracks current alert level per group (empty = healthy)
	breachState map[string]AlertLevel
}

// NewLagAlertService creates a new LagAlertService.
func NewLagAlertService(kafkaSvc *kafka.KafkaService, configDir string) *LagAlertService {
	store := NewHistoryStore(configDir)
	// Run initial cleanup on startup
	store.RunCleanup()
	return &LagAlertService{
		kafkaSvc:    kafkaSvc,
		store:       store,
		notifier:    NewNotifier(),
		recorder:    lagrecorder.NewRecorder(configDir),
		breachState: make(map[string]AlertLevel),
	}
}

// SetContext stores the Wails runtime context for EventsEmit.
func (s *LagAlertService) SetContext(ctx context.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ctx = ctx
}

// Start begins the poll loop ONLY if alert config exists, is enabled,
// and has at least one enabled rule. Safe to call unconditionally on connect.
func (s *LagAlertService) Start(clusterID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	log.Printf("lagalert: Start() called for cluster=%s", clusterID)

	// Load persisted time-series data for charting
	if err := s.recorder.Load(clusterID); err != nil {
		log.Printf("lagalert: load recorder data: %v", err)
	}

	// Opt-in gate: check config before spawning any goroutine
	cfg := s.store.GetClusterConfig(clusterID)
	if cfg == nil || !cfg.Enabled {
		log.Printf("lagalert: Start() skipped — cfg nil=%v enabled=%v", cfg == nil, cfg != nil && cfg.Enabled)
		return
	}
	if !cfg.RecordingEnabled && !hasEnabledRules(cfg.Rules) {
		log.Printf("lagalert: Start() skipped — recording=%v enabledRules=%v", cfg.RecordingEnabled, hasEnabledRules(cfg.Rules))
		return
	}

	log.Printf("lagalert: Start() launching poll loop — recording=%v interval=%ds rules=%d",
		cfg.RecordingEnabled, cfg.PollIntervalSec, len(cfg.Rules))

	// Stop any existing poller first
	s.stopLocked()

	interval := time.Duration(cfg.PollIntervalSec) * time.Second
	if interval <= 0 {
		interval = 30 * time.Second
	}

	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel
	s.running = true
	s.clusterID = clusterID
	s.breachState = make(map[string]AlertLevel)

	go s.pollLoop(ctx, clusterID, interval)
}

// Stop gracefully stops the poll loop.
func (s *LagAlertService) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stopLocked()
}

// RestartMonitoring stops the current poller and re-evaluates config.
// Called by frontend after user saves alert config for the first time.
func (s *LagAlertService) RestartMonitoring(clusterID string) {
	s.Stop()
	s.Start(clusterID)
}

// stopLocked stops the poller. Caller must hold s.mu.
func (s *LagAlertService) stopLocked() {
	if s.running && s.cancel != nil {
		s.cancel()
		s.cancel = nil
	}
	s.running = false
	s.notifier.Reset()
}

// pollLoop runs the periodic lag check. Uses panic recovery like consumers.go.
// Executes an immediate first poll before waiting for the ticker.
func (s *LagAlertService) pollLoop(ctx context.Context, clusterID string, interval time.Duration) {
	log.Printf("lagalert: pollLoop started for cluster=%s interval=%v", clusterID, interval)

	// Immediate first poll so data appears without waiting for full interval
	func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("lagalert: recovered panic in initial poll: %v", r)
			}
		}()
		if err := s.pollOnce(clusterID); err != nil {
			log.Printf("lagalert: initial poll error: %v", err)
		}
	}()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("lagalert: pollLoop stopped for cluster=%s", clusterID)
			return
		case <-ticker.C:
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("lagalert: recovered panic in poll: %v", r)
					}
				}()
				if err := s.pollOnce(clusterID); err != nil {
					log.Printf("lagalert: poll error: %v", err)
				}
				// Run hourly cleanup if due
				if s.store.NeedsCleanup() {
					s.store.RunCleanup()
				}
			}()
		}
	}
}

// pollOnce fetches lag, matches rules, detects transitions, and emits events.
func (s *LagAlertService) pollOnce(clusterID string) error {
	cfg := s.store.GetClusterConfig(clusterID)
	if cfg == nil || !cfg.Enabled {
		return nil
	}
	if !cfg.RecordingEnabled && !hasEnabledRules(cfg.Rules) {
		return nil
	}

	groups, err := s.kafkaSvc.GetConsumerGroups()
	if err != nil {
		return fmt.Errorf("get consumer groups: %w", err)
	}

	// Record lag snapshot for charting (piggyback on poll loop)
	// Single-tier recording: only entities matching include AND NOT matching exclude
	if cfg.RecordingEnabled && s.recorder != nil {
		snapshot := lagrecorder.LagSnapshot{
			Timestamp: time.Now().UTC(),
			Groups:    make(map[string]int64),
			Topics:    make(map[string]int64),
		}

		// Filter groups: empty TrackedGroups = record nothing (same as topics)
		for _, g := range groups {
			included := len(cfg.TrackedGroups) > 0 && matchesAnyGlob(g.GroupID, cfg.TrackedGroups)
			excluded := len(cfg.ExcludedGroups) > 0 && matchesAnyGlob(g.GroupID, cfg.ExcludedGroups)
			if included && !excluded {
				snapshot.Groups[g.GroupID] = g.TotalLag
			}
		}

		// Filter topics: empty TrackedTopics = record nothing (opt-in)
		if topicLags, err := s.kafkaSvc.GetAllGroupsLagDetail(); err == nil {
			for _, tl := range topicLags {
				included := len(cfg.TrackedTopics) > 0 && matchesAnyGlob(tl.Topic, cfg.TrackedTopics)
				excluded := len(cfg.ExcludedTopics) > 0 && matchesAnyGlob(tl.Topic, cfg.ExcludedTopics)
				if included && !excluded {
					snapshot.Topics[tl.Topic] = tl.TotalLag
				}
			}
		}

		// Only record if we have data
		if len(snapshot.Topics) > 0 || len(snapshot.Groups) > 0 {
			log.Printf("lagalert: recording snapshot — topics=%d groups=%d", len(snapshot.Topics), len(snapshot.Groups))
			s.recorder.Record(snapshot)
		}
	}

	var newAlerts []AlertEvent
	var recoveries []AlertEvent

	s.mu.Lock()
	for _, group := range groups {
		rule := matchRule(group.GroupID, cfg.Rules)
		if rule == nil {
			// No matching rule — check if was in breach (recovery)
			if prev, ok := s.breachState[group.GroupID]; ok && prev != "" {
				delete(s.breachState, group.GroupID)
				s.notifier.ClearState(clusterID, group.GroupID)
				// Mark existing alert as resolved
				go s.resolveActiveAlert(clusterID, group.GroupID)
				recoveries = append(recoveries, AlertEvent{
					ID:        uuid.New().String(),
					ClusterID: clusterID,
					GroupID:   group.GroupID,
					Resolved:  true,
				})
			}
			continue
		}

		currentLevel := determineLevel(group.TotalLag, rule)
		prevLevel := s.breachState[group.GroupID]

		if currentLevel == "" {
			// Healthy — check for recovery
			if prevLevel != "" {
				delete(s.breachState, group.GroupID)
				s.notifier.ClearState(clusterID, group.GroupID)
				go s.resolveActiveAlert(clusterID, group.GroupID)
				recoveries = append(recoveries, AlertEvent{
					ID:        uuid.New().String(),
					ClusterID: clusterID,
					GroupID:   group.GroupID,
					Resolved:  true,
				})
			}
			continue
		}

		// In breach — check for new or escalated state
		if currentLevel != prevLevel {
			s.breachState[group.GroupID] = currentLevel
			threshold := rule.WarningLag
			if currentLevel == AlertLevelCritical {
				threshold = rule.CriticalLag
			}

			event := AlertEvent{
				ID:          uuid.New().String(),
				ClusterID:   clusterID,
				GroupID:     group.GroupID,
				MatchedRule: rule.ID,
				RulePattern: rule.GroupPattern,
				Level:       currentLevel,
				Lag:         group.TotalLag,
				Threshold:   threshold,
				Timestamp:   time.Now().UTC(),
			}
			newAlerts = append(newAlerts, event)

			// OS notification (debounced by notifier)
			if cfg.NotifyOS {
				go s.notifier.NotifyBreach(clusterID, group.GroupID, currentLevel, group.TotalLag, threshold, cfg.NotificationSound)
			}
		}
	}
	s.mu.Unlock()

	// Persist new alerts
	for _, a := range newAlerts {
		if err := s.store.AppendAlert(a); err != nil {
			log.Printf("lagalert: append alert: %v", err)
		}
	}

	// Emit Wails events
	s.mu.Lock()
	ctx := s.ctx
	s.mu.Unlock()

	if ctx != nil {
		if len(newAlerts) > 0 {
			wailsRuntime.EventsEmit(ctx, "lag:alert", LagAlertPayload{
				Type:   "breach",
				Alerts: newAlerts,
			})
		}
		if len(recoveries) > 0 {
			wailsRuntime.EventsEmit(ctx, "lag:alert", LagAlertPayload{
				Type:   "recovery",
				Alerts: recoveries,
			})
		}
	}

	return nil
}

// resolveActiveAlert finds the most recent unresolved alert for a group and resolves it.
func (s *LagAlertService) resolveActiveAlert(clusterID, groupID string) {
	alerts := s.store.GetAlerts(clusterID)
	for _, a := range alerts {
		if a.GroupID == groupID && !a.Resolved {
			_ = s.store.ResolveAlert(a.ID)
			return
		}
	}
}

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



// --- Helpers ---

// hasEnabledRules returns true if at least one rule is enabled.
func hasEnabledRules(rules []AlertRule) bool {
	for _, r := range rules {
		if r.Enabled {
			return true
		}
	}
	return false
}

// matchesAnyGlob returns true if name matches any glob pattern.
func matchesAnyGlob(name string, patterns []string) bool {
	for _, p := range patterns {
		if matched, _ := path.Match(p, name); matched {
			return true
		}
	}
	return false
}



// determineLevel returns the alert level for a given lag and rule.
// Returns empty string if lag is below warning threshold.
func determineLevel(lag int64, rule *AlertRule) AlertLevel {
	if rule.CriticalLag > 0 && lag >= rule.CriticalLag {
		return AlertLevelCritical
	}
	if rule.WarningLag > 0 && lag >= rule.WarningLag {
		return AlertLevelWarning
	}
	return ""
}

// matchRule returns the most specific enabled rule matching groupName.
// Specificity: exact match > prefix glob > catch-all.
func matchRule(groupName string, rules []AlertRule) *AlertRule {
	var best *AlertRule
	bestScore := -1

	for i := range rules {
		r := &rules[i]
		if !r.Enabled {
			continue
		}
		matched, err := path.Match(r.GroupPattern, groupName)
		if err != nil || !matched {
			continue
		}
		score := specificity(r.GroupPattern)
		if score > bestScore {
			bestScore = score
			best = r
		}
	}
	return best
}

// specificity scores a glob pattern: exact > prefix-* > catch-all.
func specificity(pattern string) int {
	if pattern == "*" {
		return 1
	}
	// Count non-wildcard prefix length
	for i, c := range pattern {
		if c == '*' || c == '?' || c == '[' {
			return i*10 + 2
		}
	}
	// No wildcards — exact match
	return len(pattern)*100 + 3
}
