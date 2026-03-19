package templates

import (
	"encoding/json"
	"fmt"
)

// ExportTemplates exports templates for a single cluster as a JSON string.
func (s *TemplateService) ExportTemplates(clusterID string) (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cluster, ok := s.store.Templates[clusterID]
	if !ok {
		cluster = map[string]TopicTemplate{}
	}

	exportStore := TemplateStore{
		Version:   s.store.Version,
		Templates: map[string]map[string]TopicTemplate{clusterID: cluster},
	}

	data, err := json.MarshalIndent(exportStore, "", "  ")
	if err != nil {
		return "", fmt.Errorf("export templates: %w", err)
	}
	return string(data), nil
}

// ImportTemplates imports templates from a JSON string into a specific cluster.
// NOTE: Strict 1:1 import — only imports templates keyed to clusterID. No cross-cluster remapping (KISS).
// If merge is true, existing templates are preserved and new ones are added.
// If merge is false, all templates for the cluster are replaced.
func (s *TemplateService) ImportTemplates(clusterID string, jsonData string, merge bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var imported TemplateStore
	if err := json.Unmarshal([]byte(jsonData), &imported); err != nil {
		return fmt.Errorf("import templates: invalid JSON: %w", err)
	}

	// Strict 1:1: only import templates for the target cluster
	importedClusterTemplates, ok := imported.Templates[clusterID]
	if !ok {
		// No templates for this cluster in the import file
		importedClusterTemplates = map[string]TopicTemplate{}
	}

	s.ensureCluster(clusterID)

	if !merge {
		// Replace mode: clear target cluster and set imported templates
		s.store.Templates[clusterID] = importedClusterTemplates
		return s.saveStore()
	}

	// Merge mode: add new templates, skip existing
	for templateID, tmpl := range importedClusterTemplates {
		if _, exists := s.store.Templates[clusterID][templateID]; !exists {
			s.store.Templates[clusterID][templateID] = tmpl
		}
	}

	return s.saveStore()
}
