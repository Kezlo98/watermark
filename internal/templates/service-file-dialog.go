package templates

import (
	"encoding/json"
	"fmt"
	"os"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// ExportToFile opens a native Save dialog and writes templates for a single cluster.
func (s *TemplateService) ExportToFile(clusterID string) error {
	s.mu.RLock()
	cluster, ok := s.store.Templates[clusterID]
	if !ok {
		cluster = map[string]TopicTemplate{}
	}
	exportStore := TemplateStore{
		Version:   s.store.Version,
		Templates: map[string]map[string]TopicTemplate{clusterID: cluster},
	}
	s.mu.RUnlock()

	data, err := json.MarshalIndent(exportStore, "", "  ")
	if err != nil {
		return fmt.Errorf("export: marshal: %w", err)
	}

	path, err := wailsRuntime.SaveFileDialog(s.ctx, wailsRuntime.SaveDialogOptions{
		Title:           "Export Templates",
		DefaultFilename: "watermark-templates.json",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil {
		return fmt.Errorf("export: dialog: %w", err)
	}
	if path == "" {
		return nil // user cancelled
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("export: write: %w", err)
	}
	return nil
}

// ImportFromFile opens a native Open dialog and imports templates from a JSON file
// into the specified cluster.
func (s *TemplateService) ImportFromFile(clusterID string, merge bool) error {
	path, err := wailsRuntime.OpenFileDialog(s.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Import Templates",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil {
		return fmt.Errorf("import: dialog: %w", err)
	}
	if path == "" {
		return nil // user cancelled
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("import: read: %w", err)
	}

	return s.ImportTemplates(clusterID, string(data), merge)
}
