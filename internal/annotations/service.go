package annotations

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

const annotationsFileName = "annotations.json"

// AnnotationService manages topic annotations persisted to ~/.watermark/annotations.json.
// All public methods are exposed to the frontend via Wails bindings.
type AnnotationService struct {
	configDir string
	store     AnnotationStore
	mu        sync.RWMutex
	ctx       context.Context
}

// NewAnnotationService initializes the annotation service, loading from disk or creating defaults.
func NewAnnotationService(configDir string) (*AnnotationService, error) {
	svc := &AnnotationService{configDir: configDir}
	if err := svc.loadStore(); err != nil {
		svc.store = AnnotationStore{
			Version:     1,
			Annotations: make(map[string]map[string]TopicAnnotation),
		}
		if saveErr := svc.saveStore(); saveErr != nil {
			return nil, fmt.Errorf("annotations: save default: %w", saveErr)
		}
	}
	return svc, nil
}

// SetContext sets the Wails runtime context (needed for file dialogs).
func (s *AnnotationService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// GetAnnotations returns all annotations for a cluster.
func (s *AnnotationService) GetAnnotations(clusterID string) map[string]TopicAnnotation {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cluster, ok := s.store.Annotations[clusterID]
	if !ok {
		return map[string]TopicAnnotation{}
	}

	// Return a copy to prevent mutation
	result := make(map[string]TopicAnnotation, len(cluster))
	for k, v := range cluster {
		result[k] = v
	}
	return result
}

// GetAnnotation returns annotations for a single topic in a cluster.
func (s *AnnotationService) GetAnnotation(clusterID, topicName string) *TopicAnnotation {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cluster, ok := s.store.Annotations[clusterID]
	if !ok {
		return nil
	}
	ann, ok := cluster[topicName]
	if !ok {
		return nil
	}
	return &ann
}

// SetAnnotation creates or updates an annotation for a single topic.
func (s *AnnotationService) SetAnnotation(clusterID, topicName string, ann TopicAnnotation) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.ensureCluster(clusterID)
	ann.UpdatedAt = nowTimestamp()
	s.store.Annotations[clusterID][topicName] = ann
	return s.saveStore()
}

// BatchSetAnnotation applies the same annotation to multiple topics at once.
// Uses the same timestamp for all topics (KISS).
func (s *AnnotationService) BatchSetAnnotation(clusterID string, topicNames []string, ann TopicAnnotation) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.ensureCluster(clusterID)
	ts := nowTimestamp()
	ann.UpdatedAt = ts

	for _, name := range topicNames {
		s.store.Annotations[clusterID][name] = ann
	}

	return s.saveStore()
}

// DeleteAnnotation removes an annotation for a single topic.
func (s *AnnotationService) DeleteAnnotation(clusterID, topicName string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	cluster, ok := s.store.Annotations[clusterID]
	if !ok {
		return nil // nothing to delete
	}
	delete(cluster, topicName)
	return s.saveStore()
}

// GetServiceNames returns a sorted, unique list of all service names used in annotations
// for a given cluster. Used for autocomplete suggestions.
func (s *AnnotationService) GetServiceNames(clusterID string) []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	nameSet := make(map[string]struct{})
	cluster, ok := s.store.Annotations[clusterID]
	if !ok {
		return []string{}
	}

	for _, ann := range cluster {
		for _, p := range ann.Producers {
			nameSet[p] = struct{}{}
		}
		for _, c := range ann.Consumers {
			nameSet[c] = struct{}{}
		}
	}

	names := make([]string, 0, len(nameSet))
	for n := range nameSet {
		names = append(names, n)
	}
	sort.Strings(names)
	return names
}

// ExportAnnotations exports annotations for a single cluster as a JSON string.
func (s *AnnotationService) ExportAnnotations(clusterID string) (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cluster, ok := s.store.Annotations[clusterID]
	if !ok {
		cluster = map[string]TopicAnnotation{}
	}

	exportStore := AnnotationStore{
		Version:     s.store.Version,
		Annotations: map[string]map[string]TopicAnnotation{clusterID: cluster},
	}

	data, err := json.MarshalIndent(exportStore, "", "  ")
	if err != nil {
		return "", fmt.Errorf("export annotations: %w", err)
	}
	return string(data), nil
}

// ExportAllAnnotations exports the entire annotation store as a JSON string.
func (s *AnnotationService) ExportAllAnnotations() (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := json.MarshalIndent(s.store, "", "  ")
	if err != nil {
		return "", fmt.Errorf("export all annotations: %w", err)
	}
	return string(data), nil
}

// ImportAnnotations imports annotations from a JSON string into a specific target cluster.
// All annotations in the file (regardless of source cluster ID) are remapped to targetClusterID.
// If merge is true, existing annotations are preserved and new ones are added.
// If merge is false, all annotations for the target cluster are replaced.
func (s *AnnotationService) ImportAnnotations(targetClusterID string, jsonData string, merge bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var imported AnnotationStore
	if err := json.Unmarshal([]byte(jsonData), &imported); err != nil {
		return fmt.Errorf("import annotations: invalid JSON: %w", err)
	}

	// Collect all topic annotations from every source cluster in the file
	allTopics := make(map[string]TopicAnnotation)
	for _, topics := range imported.Annotations {
		for topicName, ann := range topics {
			allTopics[topicName] = ann
		}
	}

	s.ensureCluster(targetClusterID)

	if !merge {
		// Replace mode: clear target cluster and set imported topics
		s.store.Annotations[targetClusterID] = allTopics
		return s.saveStore()
	}

	// Merge mode: add new annotations, skip existing
	for topicName, ann := range allTopics {
		if _, exists := s.store.Annotations[targetClusterID][topicName]; !exists {
			s.store.Annotations[targetClusterID][topicName] = ann
		}
	}

	return s.saveStore()
}

// --- Private helpers ---

// loadStore reads annotations.json from disk.
func (s *AnnotationService) loadStore() error {
	path := filepath.Join(s.configDir, annotationsFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read annotations: %w", err)
	}

	if err := json.Unmarshal(data, &s.store); err != nil {
		return fmt.Errorf("parse annotations: %w", err)
	}

	// Ensure map is initialized
	if s.store.Annotations == nil {
		s.store.Annotations = make(map[string]map[string]TopicAnnotation)
	}
	return nil
}

// saveStore writes annotations.json to disk.
func (s *AnnotationService) saveStore() error {
	data, err := json.MarshalIndent(s.store, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal annotations: %w", err)
	}

	path := filepath.Join(s.configDir, annotationsFileName)
	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("write annotations: %w", err)
	}
	return nil
}

// ensureCluster lazy-initializes the cluster map entry.
func (s *AnnotationService) ensureCluster(clusterID string) {
	if s.store.Annotations == nil {
		s.store.Annotations = make(map[string]map[string]TopicAnnotation)
	}
	if _, ok := s.store.Annotations[clusterID]; !ok {
		s.store.Annotations[clusterID] = make(map[string]TopicAnnotation)
	}
}

// nowTimestamp returns the current UTC time as an RFC3339 string.
func nowTimestamp() string {
	return time.Now().UTC().Format(time.RFC3339)
}
