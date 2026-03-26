// Package kafkautil provides shared Kafka client utilities used by multiple internal packages.
// Extracted here to avoid circular imports between config and kafka packages.
// It defines its own ProfileOpts struct to avoid importing the config package.
package kafkautil

import (
	"context"
	"crypto/tls"
	"fmt"
	"strings"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/twmb/franz-go/pkg/kgo"
	awsmsk "github.com/twmb/franz-go/pkg/sasl/aws"
	"github.com/twmb/franz-go/pkg/sasl/plain"
	"github.com/twmb/franz-go/pkg/sasl/scram"
)

// ProfileOpts carries the fields from ClusterProfile needed to build kgo client options.
// Defined here to avoid importing the config package (which would create a cycle).
type ProfileOpts struct {
	BootstrapServers string
	SecurityProtocol string
	SASLMechanism    string
	Username         string
	AwsProfile       string
	AwsRegion        string
}

// BuildClientOpts creates a kgo.Opt slice from a ProfileOpts and a plaintext password.
// This is the single source of truth for SASL/TLS option construction,
// shared by both KafkaService.Connect and ConfigService.TestConnection.
func BuildClientOpts(profile ProfileOpts, password string) ([]kgo.Opt, error) {
	seeds := strings.Split(profile.BootstrapServers, ",")
	for i := range seeds {
		seeds[i] = strings.TrimSpace(seeds[i])
	}

	opts := []kgo.Opt{
		kgo.SeedBrokers(seeds...),
	}

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

		awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(), loadOpts...)
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

		// Wrap with region-aware mechanism for VPC endpoints / custom DNS
		if effectiveRegion != "" {
			mechanism = NewRegionAwareMSKIAM(mechanism, effectiveRegion)
		}

		opts = append(opts, kgo.SASL(mechanism))
		opts = append(opts, kgo.DialTLSConfig(&tls.Config{}))
	}

	return opts, nil
}
