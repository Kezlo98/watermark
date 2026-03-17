package templates

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const templatesFileName = "templates.json"

// TemplateService manages topic templates persisted to ~/.watermark/templates.json.
// All public methods are exposed to the frontend via Wails bindings.
type TemplateService struct {
	configDir string
	store     TemplateStore
	mu        sync.RWMutex
	ctx       context.Context
}

// NewTemplateService initializes the template service, loading from disk or creating defaults.
func NewTemplateService(configDir string) (*TemplateService, error) {
	svc := &TemplateService{configDir: configDir}
	if err := svc.loadStore(); err != nil {
		svc.store = TemplateStore{
			Version:   1,
			Templates: make(map[string]map[string]TopicTemplate),
		}
		if saveErr := svc.saveStore(); saveErr != nil {
			return nil, fmt.Errorf("templates: save default: %w", saveErr)
		}
	}
	return svc, nil
}

// SetContext sets the Wails runtime context (needed for file dialogs).
func (s *TemplateService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// GetTemplates returns all templates for a cluster.
func (s *TemplateService) GetTemplates(clusterID string) map[string]TopicTemplate {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cluster, ok := s.store.Templates[clusterID]
	if !ok {
		return map[string]TopicTemplate{}
	}

	// Return a copy to prevent mutation
	result := make(map[string]TopicTemplate, len(cluster))
	for k, v := range cluster {
		result[k] = v
	}
	return result
}

// GetTemplate returns a single template by ID.
func (s *TemplateService) GetTemplate(clusterID, templateID string) *TopicTemplate {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cluster, ok := s.store.Templates[clusterID]
	if !ok {
		return nil
	}
	tmpl, ok := cluster[templateID]
	if !ok {
		return nil
	}
	return &tmpl
}

// SaveTemplate creates or updates a template. Returns the generated UUID if ID is empty.
func (s *TemplateService) SaveTemplate(clusterID string, tmpl TopicTemplate) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.ensureCluster(clusterID)

	// Generate ID if not provided
	if tmpl.ID == "" {
		tmpl.ID = generateID()
		tmpl.CreatedAt = nowTimestamp()
	}
	tmpl.UpdatedAt = nowTimestamp()

	s.store.Templates[clusterID][tmpl.ID] = tmpl
	if err := s.saveStore(); err != nil {
		return "", err
	}
	return tmpl.ID, nil
}

// UpdateTemplate updates an existing template.
func (s *TemplateService) UpdateTemplate(clusterID, templateID string, tmpl TopicTemplate) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	cluster, ok := s.store.Templates[clusterID]
	if !ok {
		return fmt.Errorf("template not found: cluster %s", clusterID)
	}
	existing, ok := cluster[templateID]
	if !ok {
		return fmt.Errorf("template not found: %s", templateID)
	}

	// Preserve ID and CreatedAt
	tmpl.ID = templateID
	tmpl.CreatedAt = existing.CreatedAt
	tmpl.UpdatedAt = nowTimestamp()

	s.store.Templates[clusterID][templateID] = tmpl
	return s.saveStore()
}

// DeleteTemplate removes a template.
func (s *TemplateService) DeleteTemplate(clusterID, templateID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	cluster, ok := s.store.Templates[clusterID]
	if !ok {
		return nil // nothing to delete
	}
	delete(cluster, templateID)
	return s.saveStore()
}

// --- Private helpers ---

// loadStore reads templates.json from disk.
func (s *TemplateService) loadStore() error {
	path := filepath.Join(s.configDir, templatesFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read templates: %w", err)
	}

	if err := json.Unmarshal(data, &s.store); err != nil {
		return fmt.Errorf("parse templates: %w", err)
	}

	// Ensure map is initialized
	if s.store.Templates == nil {
		s.store.Templates = make(map[string]map[string]TopicTemplate)
	}
	return nil
}

// saveStore writes templates.json to disk.
func (s *TemplateService) saveStore() error {
	data, err := json.MarshalIndent(s.store, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal templates: %w", err)
	}

	path := filepath.Join(s.configDir, templatesFileName)
	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("write templates: %w", err)
	}
	return nil
}

// ensureCluster lazy-initializes the cluster map entry.
func (s *TemplateService) ensureCluster(clusterID string) {
	if s.store.Templates == nil {
		s.store.Templates = make(map[string]map[string]TopicTemplate)
	}
	if _, ok := s.store.Templates[clusterID]; !ok {
		s.store.Templates[clusterID] = make(map[string]TopicTemplate)
	}
}

// generateID creates a random 8-byte hex ID (16 characters).
func generateID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		// crypto/rand is not available; fall back to a timestamp-based ID
		return fmt.Sprintf("%x", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

// nowTimestamp returns the current UTC time as an RFC3339 string.
func nowTimestamp() string {
	return time.Now().UTC().Format(time.RFC3339)
}
