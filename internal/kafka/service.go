package kafka

import (
	"context"
	"crypto/tls"
	"fmt"
	"strings"
	"sync"
	"time"

	"watermark-01/internal/config"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kgo"
	awsmsk "github.com/twmb/franz-go/pkg/sasl/aws"
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
	case "AWS_MSK_IAM":
		var loadOpts []func(*awsconfig.LoadOptions) error
		if profile.AwsProfile != "" {
			loadOpts = append(loadOpts, awsconfig.WithSharedConfigProfile(profile.AwsProfile))
		}
		if profile.AwsRegion != "" {
			loadOpts = append(loadOpts, awsconfig.WithRegion(profile.AwsRegion))
		}
		awsCfg, err := awsconfig.LoadDefaultConfig(k.getCtx(), loadOpts...)
		if err != nil {
			return nil, fmt.Errorf("load AWS config: %w", err)
		}

		// Resolve the effective region — user override → AWS config chain
		effectiveRegion := profile.AwsRegion
		if effectiveRegion == "" {
			effectiveRegion = awsCfg.Region
		}

		mechanism := awsmsk.ManagedStreamingIAM(func(ctx context.Context) (awsmsk.Auth, error) {
			creds, err := awsCfg.Credentials.Retrieve(ctx)
			if err != nil {
				profileName := profile.AwsProfile
				if profileName == "" {
					profileName = "default"
				}
				return awsmsk.Auth{}, fmt.Errorf("AWS credentials: %w — run 'aws sso login --profile %s' if using SSO", err, profileName)
			}
			return awsmsk.Auth{
				AccessKey:    creds.AccessKeyID,
				SecretKey:    creds.SecretAccessKey,
				SessionToken: creds.SessionToken,
			}, nil
		})

		// If we have a region, wrap the mechanism to work around franz-go's
		// identifyRegion() which only parses region from *.amazonaws.com hostnames.
		// For VPC endpoints or custom DNS, inject the region via a wrapper.
		if effectiveRegion != "" {
			mechanism = newRegionAwareMSKIAM(mechanism, effectiveRegion)
		}

		opts = append(opts, kgo.SASL(mechanism))
		opts = append(opts, kgo.DialTLSConfig(&tls.Config{}))
	}

	return opts, nil
}
