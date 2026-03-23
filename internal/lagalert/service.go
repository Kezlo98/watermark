package lagalert

import (
	"context"
	"log"
	"path"
	"sync"
	"time"

	"watermark-01/internal/kafka"
	"watermark-01/internal/lagrecorder"
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
	store.RunCleanupIfNeeded()
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
