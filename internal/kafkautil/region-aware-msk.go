package kafkautil

import (
	"context"
	"fmt"
	"strings"

	"github.com/twmb/franz-go/pkg/sasl"
)

// RegionAwareMSKIAM wraps a SASL mechanism to inject the AWS region into
// the host string when franz-go's identifyRegion() can't extract it from
// the actual broker hostname (e.g., VPC endpoints or custom DNS).
type regionAwareMSKIAM struct {
	inner  sasl.Mechanism
	region string
}

// NewRegionAwareMSKIAM creates a region-aware SASL wrapper for AWS MSK IAM.
func NewRegionAwareMSKIAM(inner sasl.Mechanism, region string) sasl.Mechanism {
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
	hostOnly := host
	port := ""
	if idx := strings.LastIndex(host, ":"); idx != -1 {
		hostOnly = host[:idx]
		port = host[idx:]
	}

	fakeHost := fmt.Sprintf("%s.kafka.%s.amazonaws.com%s", hostOnly, r.region, port)
	return r.inner.Authenticate(ctx, fakeHost)
}
