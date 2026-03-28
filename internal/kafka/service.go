package kafka

import (
	"context"
	"fmt"
	"sync"
	"time"

	"watermark-01/internal/config"
	"watermark-01/internal/kafkautil"

	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kgo"
)

// connectionTimeout is the maximum duration for a cluster connection attempt.
const connectionTimeout = 10 * time.Second

// KafkaService manages the Kafka connection lifecycle and all Kafka operations.
// All public methods are exposed to the frontend via Wails bindings.
type KafkaService struct {
	configSvc     *config.ConfigService
	client        *kgo.Client
	admin         *kadm.Client
	mu            sync.RWMutex
	connected     bool
	readOnly      bool           // true when the active cluster profile has read-only mode enabled
	activeProfile string
	ctx           context.Context
	baseOpts      []kgo.Opt      // broker + auth/TLS opts, reused for temp consumers
	cache         *adminCache    // short-TTL cache for expensive admin calls
	activeTail    *liveTailState // current live-tail session (at most one)
	activeTailMu  sync.Mutex     // guards activeTail
}

// NewKafkaService creates a new KafkaService.
func NewKafkaService(configSvc *config.ConfigService) *KafkaService {
	return &KafkaService{
		configSvc: configSvc,
		cache:     newAdminCache(defaultCacheTTL),
	}
}

// SetContext sets the Wails runtime context for cancellation support.
func (k *KafkaService) SetContext(ctx context.Context) {
	k.ctx = ctx
}

// Connect establishes a connection to the Kafka cluster identified by profileID.
// Uses a 10-second timeout to prevent hanging on unreachable clusters.
func (k *KafkaService) Connect(profileID string) error {
	k.mu.Lock()
	defer k.mu.Unlock()

	if k.connected {
		return ErrAlreadyConnected
	}

	profile, err := k.configSvc.GetCluster(profileID)
	if err != nil {
		return fmt.Errorf("connect: %w", err)
	}

	password, err := k.configSvc.GetDecryptedPassword(profileID)
	if err != nil {
		return fmt.Errorf("connect: decrypt password: %w", err)
	}

	opts, err := k.buildClientOpts(profile, password)
	if err != nil {
		return fmt.Errorf("connect: build opts: %w", err)
	}

	client, err := kgo.NewClient(opts...)
	if err != nil {
		return fmt.Errorf("connect: new client: %w", err)
	}

	// Ping with timeout to verify connectivity — prevents hanging on unreachable brokers
	connectCtx, cancel := context.WithTimeout(k.getCtx(), connectionTimeout)
	defer cancel()

	if err := client.Ping(connectCtx); err != nil {
		client.Close()
		if connectCtx.Err() == context.DeadlineExceeded {
			return fmt.Errorf("connection timed out after %s — cluster unreachable", connectionTimeout)
		}
		// Hint for AWS auth failures
		if profile.SecurityProtocol == "AWS_MSK_IAM" {
			return fmt.Errorf("AWS MSK IAM auth failed: %w — verify AWS credentials and IAM policy", err)
		}
		return fmt.Errorf("connect: ping failed: %w", err)
	}

	k.client = client
	k.admin = kadm.NewClient(client)
	k.baseOpts = opts
	k.connected = true
	k.readOnly = profile.ReadOnly
	k.activeProfile = profileID

	return nil
}

// Disconnect closes the active Kafka connection.
// Stops any active live-tail first to prevent goroutines from using a closed client.
func (k *KafkaService) Disconnect() error {
	// Stop live-tail BEFORE acquiring the write lock to avoid deadlock
	// (StopLiveTail uses activeTailMu, not k.mu)
	k.StopLiveTail()

	k.mu.Lock()
	defer k.mu.Unlock()

	if !k.connected {
		return nil
	}

	k.cache.invalidate()
	k.admin = nil
	k.client.Close()
	k.client = nil
	k.baseOpts = nil
	k.connected = false
	k.readOnly = false
	k.activeProfile = ""

	return nil
}

// IsConnected returns true if there is an active Kafka connection.
func (k *KafkaService) IsConnected() bool {
	k.mu.RLock()
	defer k.mu.RUnlock()
	return k.connected
}

// GetActiveCluster returns the profile ID of the active connection.
func (k *KafkaService) GetActiveCluster() string {
	k.mu.RLock()
	defer k.mu.RUnlock()
	return k.activeProfile
}

// UpdateReadOnly updates the read-only flag for the active connection
// without requiring a reconnect. Used when the user edits cluster config.
func (k *KafkaService) UpdateReadOnly(readOnly bool) {
	k.mu.Lock()
	defer k.mu.Unlock()
	if k.connected {
		k.readOnly = readOnly
	}
}

// ClearCache invalidates the in-memory metadata cache so the next
// API call fetches fresh data from the Kafka cluster.
// Exposed to the frontend via Wails binding for manual refresh.
func (k *KafkaService) ClearCache() {
	k.cache.Invalidate()
}

// ensureConnected returns ErrNotConnected if not connected.
func (k *KafkaService) ensureConnected() error {
	if !k.connected {
		return ErrNotConnected
	}
	return nil
}

// ensureWritable returns ErrReadOnly if the cluster is in read-only mode.
// Must be called under at least an RLock.
func (k *KafkaService) ensureWritable() error {
	if err := k.ensureConnected(); err != nil {
		return err
	}
	if k.readOnly {
		return ErrReadOnly
	}
	return nil
}

// getCtx returns the Wails context or a background context.
func (k *KafkaService) getCtx() context.Context {
	if k.ctx != nil {
		return k.ctx
	}
	return context.Background()
}

// buildClientOpts creates kgo.Opt slice from a cluster profile.
// Delegates to the shared kafkautil.BuildClientOpts to keep SASL/TLS logic in one place.
func (k *KafkaService) buildClientOpts(profile *config.ClusterProfile, password string) ([]kgo.Opt, error) {
	return kafkautil.BuildClientOpts(kafkautil.ProfileOpts{
		BootstrapServers: profile.BootstrapServers,
		SecurityProtocol: profile.SecurityProtocol,
		SASLMechanism:    profile.SASLMechanism,
		Username:         profile.Username,
		AwsProfile:       profile.AwsProfile,
		AwsRegion:        profile.AwsRegion,
	}, password)
}
