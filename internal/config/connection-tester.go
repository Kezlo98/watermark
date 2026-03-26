package config

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"

	"watermark-01/internal/kafkautil"

	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kgo"
)

const (
	tcpDialTimeout  = 5 * time.Second
	pingTimeout     = 10 * time.Second
	metadataTimeout = 5 * time.Second
)

// TestConnection performs a progressive 3-step connectivity test against a Kafka cluster.
// Accepts an optional clusterID — if non-empty and profile.Password is empty, fetches
// the saved encrypted password from the stored profile (edit mode support).
//
// Steps: TCP dial → SASL auth (Ping) → Metadata fetch (ACL check).
func (s *ConfigService) TestConnection(profile ClusterProfile, clusterID string) (*ConnectionTestResult, error) {
	// Step 1: TCP dial (5s timeout) — test basic network reachability.
	servers := strings.Split(profile.BootstrapServers, ",")
	tcpOk := false
	for _, server := range servers {
		server = strings.TrimSpace(server)
		if server == "" {
			continue
		}
		conn, err := net.DialTimeout("tcp", server, tcpDialTimeout)
		if err != nil {
			continue
		}
		conn.Close()
		tcpOk = true
		break
	}
	if !tcpOk {
		return &ConnectionTestResult{
			Status:  "unreachable",
			Message: fmt.Sprintf("Cannot reach any broker: %s", profile.BootstrapServers),
		}, nil
	}

	// Resolve password: form value → saved profile → empty
	password, err := s.resolveTestPassword(profile, clusterID)
	if err != nil {
		return nil, fmt.Errorf("test connection: %w", err)
	}

	// Step 2: Build client opts via shared kafkautil, create temp client, Ping (10s timeout).
	opts, err := kafkautil.BuildClientOpts(kafkautil.ProfileOpts{
		BootstrapServers: profile.BootstrapServers,
		SecurityProtocol: profile.SecurityProtocol,
		SASLMechanism:    profile.SASLMechanism,
		Username:         profile.Username,
		AwsProfile:       profile.AwsProfile,
		AwsRegion:        profile.AwsRegion,
	}, password)
	if err != nil {
		return &ConnectionTestResult{
			Status:  "auth_error",
			Message: fmt.Sprintf("Failed to build client config: %s", err),
		}, nil
	}

	client, err := kgo.NewClient(opts...)
	if err != nil {
		return &ConnectionTestResult{
			Status:  "auth_error",
			Message: fmt.Sprintf("Client creation failed: %s", err),
		}, nil
	}
	defer client.Close()

	pingCtx, pingCancel := context.WithTimeout(context.Background(), pingTimeout)
	defer pingCancel()

	if err := client.Ping(pingCtx); err != nil {
		return &ConnectionTestResult{
			Status:  "auth_error",
			Message: classifyAuthError(err, profile.SecurityProtocol),
		}, nil
	}

	// Step 3: Metadata fetch — tests ACL permissions (5s timeout).
	metaCtx, metaCancel := context.WithTimeout(context.Background(), metadataTimeout)
	defer metaCancel()

	adm := kadm.NewClient(client)
	metadata, err := adm.Metadata(metaCtx)
	if err != nil {
		return classifyMetadataError(err), nil
	}

	topicCount := 0
	for _, t := range metadata.Topics {
		if !t.IsInternal {
			topicCount++
		}
	}

	return &ConnectionTestResult{
		Status:  "ok",
		Message: fmt.Sprintf("Connected — %d brokers, %d topics", len(metadata.Brokers), topicCount),
	}, nil
}

// resolveTestPassword determines the password to use for test connection.
// Priority: form password (if non-empty) → saved encrypted password (if clusterID provided) → empty.
func (s *ConfigService) resolveTestPassword(profile ClusterProfile, clusterID string) (string, error) {
	// If form has a password, use it directly (plaintext from user input)
	if profile.Password != "" {
		if IsEncrypted(profile.Password) {
			return Decrypt(profile.Password, s.key)
		}
		return profile.Password, nil
	}

	// Edit mode: fetch saved encrypted password via clusterID
	if clusterID != "" {
		saved, err := s.GetCluster(clusterID)
		if err != nil {
			return "", nil // cluster not found, proceed without password
		}
		if saved.Password != "" {
			return Decrypt(saved.Password, s.key)
		}
	}

	return "", nil // no auth
}

// classifyAuthError produces a user-friendly message from a Ping failure.
func classifyAuthError(err error, protocol string) string {
	msg := err.Error()
	if strings.Contains(msg, "SASL") {
		return "SASL authentication failed — check mechanism and credentials"
	}
	if protocol == "AWS_MSK_IAM" {
		return fmt.Sprintf("AWS MSK IAM auth failed: %s — verify credentials and IAM policy", msg)
	}
	if strings.Contains(msg, "tls") || strings.Contains(msg, "TLS") {
		return fmt.Sprintf("TLS handshake failed: %s", msg)
	}
	return fmt.Sprintf("Authentication failed: %s", msg)
}

// classifyMetadataError checks if a Metadata error is authorization-related.
// Only returns "forbidden" if error contains AUTHORIZATION keywords;
// otherwise falls back to "auth_error" with the raw message.
func classifyMetadataError(err error) *ConnectionTestResult {
	msg := strings.ToUpper(err.Error())
	if strings.Contains(msg, "AUTHORIZATION") ||
		strings.Contains(msg, "CLUSTER_AUTHORIZATION_FAILED") ||
		strings.Contains(msg, "TOPIC_AUTHORIZATION_FAILED") {
		return &ConnectionTestResult{
			Status:  "forbidden",
			Message: fmt.Sprintf("Authenticated but insufficient permissions: %s", err),
		}
	}
	// Non-authorization Metadata failure — don't mislead user
	return &ConnectionTestResult{
		Status:  "auth_error",
		Message: fmt.Sprintf("Authenticated but metadata fetch failed: %s", err),
	}
}
