package schema

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"watermark-01/internal/config"

	"golang.org/x/sync/errgroup"
)

// SchemaService manages Schema Registry REST API interactions.
// All public methods are exposed to the frontend via Wails bindings.
type SchemaService struct {
	configSvc  *config.ConfigService
	httpClient *http.Client
	baseURL    string
	username   string
	password   string
	mu         sync.RWMutex
	ctx        context.Context
}

// NewSchemaService creates a new SchemaService.
func NewSchemaService(configSvc *config.ConfigService) *SchemaService {
	return &SchemaService{
		configSvc: configSvc,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SetContext sets the Wails runtime context.
func (s *SchemaService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// Configure sets Schema Registry URL + credentials from active cluster profile.
func (s *SchemaService) Configure(profileID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	profile, err := s.configSvc.GetCluster(profileID)
	if err != nil {
		return fmt.Errorf("schema configure: %w", err)
	}

	s.baseURL = profile.SchemaRegistryURL
	s.username = profile.Username

	if profile.SchemaRegistryPassword != "" {
		pw, err := s.configSvc.GetDecryptedSchemaRegistryPassword(profileID)
		if err != nil {
			return fmt.Errorf("schema configure: decrypt: %w", err)
		}
		s.password = pw
	} else {
		s.password = ""
	}

	return nil
}

// GetSubjects returns all schema subjects with latest version + compatibility.
func (s *SchemaService) GetSubjects() ([]SchemaSubject, error) {
	s.mu.RLock()
	baseURL := s.baseURL
	s.mu.RUnlock()

	if baseURL == "" {
		return []SchemaSubject{}, nil // not configured
	}

	ctx := s.getCtx()

	// 1. Get subject names
	body, err := s.doRequest(ctx, "GET", "/subjects")
	if err != nil {
		return nil, fmt.Errorf("get subjects: %w", err)
	}

	var subjectNames []string
	if err := json.Unmarshal(body, &subjectNames); err != nil {
		return nil, fmt.Errorf("get subjects: parse: %w", err)
	}

	if len(subjectNames) == 0 {
		return []SchemaSubject{}, nil
	}

	// 2. Parallel fetch details for each subject (max 10 concurrent)
	subjects := make([]SchemaSubject, len(subjectNames))
	g, gCtx := errgroup.WithContext(ctx)
	g.SetLimit(10)

	for i, name := range subjectNames {
		i, name := i, name
		g.Go(func() error {
			sub := SchemaSubject{Name: name}

			// Get latest version
			latestBody, err := s.doRequestCtx(gCtx, "GET", fmt.Sprintf("/subjects/%s/versions/latest", name))
			if err == nil {
				var resp subjectVersionResponse
				if json.Unmarshal(latestBody, &resp) == nil {
					sub.LatestVersion = resp.Version
					sub.Type = resp.SchemaType
					if sub.Type == "" {
						sub.Type = "AVRO"
					}
				}
			}

			// Get compatibility
			compBody, err := s.doRequestCtx(gCtx, "GET", fmt.Sprintf("/config/%s", name))
			if err == nil {
				var cfgResp configResponse
				if json.Unmarshal(compBody, &cfgResp) == nil {
					sub.Compatibility = cfgResp.CompatibilityLevel
				}
			}

			subjects[i] = sub
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("get subjects: parallel: %w", err)
	}

	return subjects, nil
}
