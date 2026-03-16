package lagalert

import (
	"fmt"
	"log"
	"sync"

	"github.com/gen2brain/beeep"
)

// Notifier sends OS notifications for lag breaches, debounced per group.
type Notifier struct {
	// notified tracks groups that have already received an OS notification
	// this breach cycle. Key: "clusterID:groupID"
	notified map[string]bool
	mu       sync.Mutex
}

// NewNotifier creates a new Notifier.
func NewNotifier() *Notifier {
	return &Notifier{notified: make(map[string]bool)}
}

// NotifyBreach sends an OS notification for the first breach of a group.
// Subsequent calls for the same key are no-ops until ClearState is called.
func (n *Notifier) NotifyBreach(clusterID, group string, level AlertLevel, lag, threshold int64) {
	n.mu.Lock()
	key := clusterID + ":" + group
	if n.notified[key] {
		n.mu.Unlock()
		return
	}
	n.notified[key] = true
	n.mu.Unlock()

	levelStr := "⚠️ Warning"
	if level == AlertLevelCritical {
		levelStr = "🔴 Critical"
	}

	title := fmt.Sprintf("Kafka Lag Alert — %s", levelStr)
	body := fmt.Sprintf("Group: %s\nLag: %d (threshold: %d)", group, lag, threshold)

	if err := beeep.Notify(title, body, ""); err != nil {
		log.Printf("lagalert: OS notification failed: %v", err)
	}
}

// ClearState resets the notification state for a group (call on recovery).
func (n *Notifier) ClearState(clusterID, group string) {
	n.mu.Lock()
	defer n.mu.Unlock()
	delete(n.notified, clusterID+":"+group)
}

// Reset clears all notification state (call on Stop).
func (n *Notifier) Reset() {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.notified = make(map[string]bool)
}
