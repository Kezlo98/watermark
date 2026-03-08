package kafka

import (
	"context"
	"crypto/tls"
	"fmt"
	"strings"
	"sync"
	"time"

	"watermark-01/internal/config"

	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kgo"
	"github.com/twmb/franz-go/pkg/sasl/plain"
	"github.com/twmb/franz-go/pkg/sasl/scram"
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
	activeProfile string
	ctx           context.Context
	baseOpts      []kgo.Opt   // broker + auth/TLS opts, reused for temp consumers
	cache         *adminCache // short-TTL cache for expensive admin calls
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
		return fmt.Errorf("connect: ping failed: %w", err)
	}

	k.client = client
	k.admin = kadm.NewClient(client)
	k.baseOpts = opts
	k.connected = true
	k.activeProfile = profileID

	return nil
}

// Disconnect closes the active Kafka connection.
func (k *KafkaService) Disconnect() error {
	k.mu.Lock()
	defer k.mu.Unlock()

	if !k.connected {
		return nil
	}

	k.admin = nil
	k.client.Close()
	k.client = nil
	k.baseOpts = nil
	k.connected = false
	k.activeProfile = ""
	k.cache.invalidate()

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

// getCtx returns the Wails context or a background context.
func (k *KafkaService) getCtx() context.Context {
	if k.ctx != nil {
		return k.ctx
	}
	return context.Background()
}

// buildClientOpts creates kgo.Opt slice from a cluster profile.
func (k *KafkaService) buildClientOpts(profile *config.ClusterProfile, password string) ([]kgo.Opt, error) {
	seeds := strings.Split(profile.BootstrapServers, ",")
	for i := range seeds {
		seeds[i] = strings.TrimSpace(seeds[i])
	}

	opts := []kgo.Opt{
		kgo.SeedBrokers(seeds...),
	}

	// SASL authentication
	switch profile.SecurityProtocol {
	case "SASL_PLAIN":
		opts = append(opts, kgo.SASL(plain.Auth{
			User: profile.Username,
			Pass: password,
		}.AsMechanism()))
	case "SASL_SCRAM":
		mechanism := scram.Auth{
			User: profile.Username,
			Pass: password,
		}
		switch profile.SASLMechanism {
		case "SCRAM-SHA-512":
			opts = append(opts, kgo.SASL(mechanism.AsSha512Mechanism()))
		default: // SCRAM-SHA-256
			opts = append(opts, kgo.SASL(mechanism.AsSha256Mechanism()))
		}
	case "SASL_SSL":
		// SASL + TLS
		mechanism := scram.Auth{
			User: profile.Username,
			Pass: password,
		}
		switch profile.SASLMechanism {
		case "SCRAM-SHA-512":
			opts = append(opts, kgo.SASL(mechanism.AsSha512Mechanism()))
		default:
			opts = append(opts, kgo.SASL(mechanism.AsSha256Mechanism()))
		}
		opts = append(opts, kgo.DialTLSConfig(&tls.Config{}))
	case "SSL":
		opts = append(opts, kgo.DialTLSConfig(&tls.Config{}))
	}

	return opts, nil
}
