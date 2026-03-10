package kafka

import (
	"context"
	"fmt"
	"strings"

	"github.com/twmb/franz-go/pkg/sasl"
)

// regionAwareMSKIAM wraps a SASL mechanism to inject the AWS region into
// the host string when franz-go's identifyRegion() can't extract it from
// the actual broker hostname (e.g., VPC endpoints or custom DNS).
//
// franz-go's aws.ManagedStreamingIAM internally parses the broker hostname
// for a region suffix like *.kafka.us-east-1.amazonaws.com. When the broker
// uses a non-standard hostname, identifyRegion() fails.
//
// This wrapper rewrites the host to include a fake suffix that embeds the
// correct region, allowing the SigV4 signing to work properly.
type regionAwareMSKIAM struct {
	inner  sasl.Mechanism
	region string
}

func newRegionAwareMSKIAM(inner sasl.Mechanism, region string) sasl.Mechanism {
	return &regionAwareMSKIAM{inner: inner, region: region}
}

func (r *regionAwareMSKIAM) Name() string {
	return r.inner.Name()
}

func (r *regionAwareMSKIAM) Authenticate(ctx context.Context, host string) (sasl.Session, []byte, error) {
	// If the host already contains an amazonaws.com suffix, let the inner
	// mechanism parse the region itself — no rewriting needed.
	if strings.Contains(host, ".amazonaws.com") {
		return r.inner.Authenticate(ctx, host)
	}

	// Rewrite host to embed the region so franz-go's identifyRegion() can find it.
	// The format follows MSK's hostname pattern: <broker>.kafka.<region>.amazonaws.com
	// We preserve the original host for TLS SNI/handshake via the inner mechanism's
	// Authenticate, which only uses host for region extraction + signing.
	//
	// Strip port if present, add fake suffix, re-add port.
	hostOnly := host
	port := ""
	if idx := strings.LastIndex(host, ":"); idx != -1 {
		hostOnly = host[:idx]
		port = host[idx:]
	}

	fakeHost := fmt.Sprintf("%s.kafka.%s.amazonaws.com%s", hostOnly, r.region, port)
	return r.inner.Authenticate(ctx, fakeHost)
}
