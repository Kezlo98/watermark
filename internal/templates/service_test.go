package templates

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

// setupTestService creates a TemplateService with a temp directory.
func setupTestService(t *testing.T) *TemplateService {
	t.Helper()
	dir := t.TempDir()
	svc, err := NewTemplateService(dir)
	if err != nil {
		t.Fatalf("NewTemplateService: %v", err)
	}
	return svc
}

func TestNewTemplateService_CreatesMissingFile(t *testing.T) {
	dir := t.TempDir()
	svc, err := NewTemplateService(dir)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// File should exist
	path := filepath.Join(dir, templatesFileName)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		t.Error("expected templates.json to be created")
	}

	// Should have default empty store
	if svc.store.Version != 1 {
		t.Errorf("expected version 1, got %d", svc.store.Version)
	}
	if len(svc.store.Templates) != 0 {
		t.Errorf("expected empty templates, got %d", len(svc.store.Templates))
	}
}

func TestSaveTemplate_GeneratesID(t *testing.T) {
	svc := setupTestService(t)

	tmpl := TopicTemplate{
		Name:              "Payment Topics",
		Description:       "Standard config for payment topics",
		Pattern:           "payment.*",
		Partitions:        3,
		ReplicationFactor: 2,
		Configs:           map[string]string{"retention.ms": "604800000"},
	}

	id, err := svc.SaveTemplate("cluster-1", tmpl)
	if err != nil {
		t.Fatalf("SaveTemplate: %v", err)
	}

	if id == "" {
		t.Error("expected generated ID, got empty string")
	}

	// Verify it was saved
	got := svc.GetTemplate("cluster-1", id)
	if got == nil {
		t.Fatal("expected template, got nil")
	}
	if got.Name != "Payment Topics" {
		t.Errorf("name mismatch: %s", got.Name)
	}
	if got.Pattern != "payment.*" {
		t.Errorf("pattern mismatch: %s", got.Pattern)
	}
	if got.CreatedAt == "" || got.UpdatedAt == "" {
		t.Error("expected timestamps to be set")
	}
}

func TestGetTemplate_NotFound(t *testing.T) {
	svc := setupTestService(t)

	got := svc.GetTemplate("cluster-1", "nonexistent")
	if got != nil {
		t.Errorf("expected nil, got %v", got)
	}
}

func TestGetTemplates_EmptyCluster(t *testing.T) {
	svc := setupTestService(t)

	templates := svc.GetTemplates("cluster-1")
	if len(templates) != 0 {
		t.Errorf("expected empty map, got %d templates", len(templates))
	}
}

func TestGetTemplates_ReturnsAll(t *testing.T) {
	svc := setupTestService(t)

	// Save two templates
	tmpl1 := TopicTemplate{Name: "Template 1", Partitions: 3, ReplicationFactor: 2, Configs: map[string]string{}}
	tmpl2 := TopicTemplate{Name: "Template 2", Partitions: 6, ReplicationFactor: 3, Configs: map[string]string{}}

	id1, _ := svc.SaveTemplate("cluster-1", tmpl1)
	id2, _ := svc.SaveTemplate("cluster-1", tmpl2)

	templates := svc.GetTemplates("cluster-1")
	if len(templates) != 2 {
		t.Fatalf("expected 2 templates, got %d", len(templates))
	}

	if _, ok := templates[id1]; !ok {
		t.Error("template 1 not found")
	}
	if _, ok := templates[id2]; !ok {
		t.Error("template 2 not found")
	}
}

func TestUpdateTemplate(t *testing.T) {
	svc := setupTestService(t)

	// Create initial template
	tmpl := TopicTemplate{
		Name:              "Original",
		Partitions:        3,
		ReplicationFactor: 2,
		Configs:           map[string]string{},
	}
	id, _ := svc.SaveTemplate("cluster-1", tmpl)
	original := svc.GetTemplate("cluster-1", id)

	// Update it
	updated := TopicTemplate{
		Name:              "Updated",
		Partitions:        6,
		ReplicationFactor: 3,
		Configs:           map[string]string{"retention.ms": "86400000"},
	}
	if err := svc.UpdateTemplate("cluster-1", id, updated); err != nil {
		t.Fatalf("UpdateTemplate: %v", err)
	}

	// Verify changes
	got := svc.GetTemplate("cluster-1", id)
	if got == nil {
		t.Fatal("expected template after update")
	}
	if got.Name != "Updated" {
		t.Errorf("name not updated: %s", got.Name)
	}
	if got.Partitions != 6 {
		t.Errorf("partitions not updated: %d", got.Partitions)
	}
	// CreatedAt should be preserved
	if got.CreatedAt != original.CreatedAt {
		t.Error("CreatedAt should not change on update")
	}
	// UpdatedAt should be set (might be same if update is very fast, so just check it's not empty)
	if got.UpdatedAt == "" {
		t.Error("UpdatedAt should be set")
	}
}

func TestUpdateTemplate_NotFound(t *testing.T) {
	svc := setupTestService(t)

	tmpl := TopicTemplate{Name: "Test", Partitions: 3, ReplicationFactor: 2, Configs: map[string]string{}}
	err := svc.UpdateTemplate("cluster-1", "nonexistent", tmpl)
	if err == nil {
		t.Error("expected error for missing template")
	}
}

func TestDeleteTemplate(t *testing.T) {
	svc := setupTestService(t)

	tmpl := TopicTemplate{Name: "To Delete", Partitions: 3, ReplicationFactor: 2, Configs: map[string]string{}}
	id, _ := svc.SaveTemplate("cluster-1", tmpl)

	// Delete it
	if err := svc.DeleteTemplate("cluster-1", id); err != nil {
		t.Fatalf("DeleteTemplate: %v", err)
	}

	// Verify it's gone
	if got := svc.GetTemplate("cluster-1", id); got != nil {
		t.Error("expected template to be deleted")
	}
}

func TestDeleteTemplate_NotFound(t *testing.T) {
	svc := setupTestService(t)

	// Should not error on missing template
	if err := svc.DeleteTemplate("cluster-1", "nonexistent"); err != nil {
		t.Errorf("expected no error for missing template, got: %v", err)
	}
}

func TestExportTemplates(t *testing.T) {
	svc := setupTestService(t)

	// Save a template
	tmpl := TopicTemplate{
		Name:              "Export Test",
		Pattern:           "events.*",
		Partitions:        3,
		ReplicationFactor: 2,
		Configs:           map[string]string{"retention.ms": "604800000"},
	}
	svc.SaveTemplate("cluster-1", tmpl)

	// Export
	jsonData, err := svc.ExportTemplates("cluster-1")
	if err != nil {
		t.Fatalf("ExportTemplates: %v", err)
	}

	// Verify it's valid JSON
	var exported TemplateStore
	if err := json.Unmarshal([]byte(jsonData), &exported); err != nil {
		t.Fatalf("exported JSON invalid: %v", err)
	}

	if exported.Version != 1 {
		t.Errorf("version mismatch: %d", exported.Version)
	}
	if len(exported.Templates["cluster-1"]) != 1 {
		t.Errorf("expected 1 template in export, got %d", len(exported.Templates["cluster-1"]))
	}
}

func TestImportTemplates_Merge(t *testing.T) {
	svc := setupTestService(t)

	// Add existing template
	existing := TopicTemplate{Name: "Existing", Partitions: 3, ReplicationFactor: 2, Configs: map[string]string{}}
	existingID, _ := svc.SaveTemplate("cluster-1", existing)

	// Create import data with new template
	importStore := TemplateStore{
		Version: 1,
		Templates: map[string]map[string]TopicTemplate{
			"cluster-1": {
				"new-id": {
					ID:                "new-id",
					Name:              "Imported",
					Partitions:        6,
					ReplicationFactor: 3,
					Configs:           map[string]string{},
					CreatedAt:         "2024-01-01T00:00:00Z",
					UpdatedAt:         "2024-01-01T00:00:00Z",
				},
			},
		},
	}
	jsonData, _ := json.Marshal(importStore)

	// Import with merge=true
	if err := svc.ImportTemplates("cluster-1", string(jsonData), true); err != nil {
		t.Fatalf("ImportTemplates: %v", err)
	}

	// Both should exist
	templates := svc.GetTemplates("cluster-1")
	if len(templates) != 2 {
		t.Fatalf("expected 2 templates after merge, got %d", len(templates))
	}
	if _, ok := templates[existingID]; !ok {
		t.Error("existing template should be preserved")
	}
	if _, ok := templates["new-id"]; !ok {
		t.Error("imported template not found")
	}
}

func TestImportTemplates_Replace(t *testing.T) {
	svc := setupTestService(t)

	// Add existing template
	existing := TopicTemplate{Name: "Existing", Partitions: 3, ReplicationFactor: 2, Configs: map[string]string{}}
	existingID, _ := svc.SaveTemplate("cluster-1", existing)

	// Create import data
	importStore := TemplateStore{
		Version: 1,
		Templates: map[string]map[string]TopicTemplate{
			"cluster-1": {
				"new-id": {
					ID:                "new-id",
					Name:              "Imported",
					Partitions:        6,
					ReplicationFactor: 3,
					Configs:           map[string]string{},
					CreatedAt:         "2024-01-01T00:00:00Z",
					UpdatedAt:         "2024-01-01T00:00:00Z",
				},
			},
		},
	}
	jsonData, _ := json.Marshal(importStore)

	// Import with merge=false (replace)
	if err := svc.ImportTemplates("cluster-1", string(jsonData), false); err != nil {
		t.Fatalf("ImportTemplates: %v", err)
	}

	// Only imported should exist
	templates := svc.GetTemplates("cluster-1")
	if len(templates) != 1 {
		t.Fatalf("expected 1 template after replace, got %d", len(templates))
	}
	if _, ok := templates[existingID]; ok {
		t.Error("existing template should be replaced")
	}
	if _, ok := templates["new-id"]; !ok {
		t.Error("imported template not found")
	}
}

func TestImportTemplates_Strict1to1(t *testing.T) {
	svc := setupTestService(t)

	// Import data with templates for cluster-2, importing into cluster-1
	importStore := TemplateStore{
		Version: 1,
		Templates: map[string]map[string]TopicTemplate{
			"cluster-2": {
				"id-1": {
					ID:                "id-1",
					Name:              "From Cluster 2",
					Partitions:        3,
					ReplicationFactor: 2,
					Configs:           map[string]string{},
					CreatedAt:         "2024-01-01T00:00:00Z",
					UpdatedAt:         "2024-01-01T00:00:00Z",
				},
			},
		},
	}
	jsonData, _ := json.Marshal(importStore)

	// Import into cluster-1 (strict 1:1 means cluster-2 templates are ignored)
	if err := svc.ImportTemplates("cluster-1", string(jsonData), false); err != nil {
		t.Fatalf("ImportTemplates: %v", err)
	}

	// cluster-1 should be empty (no cross-cluster import)
	templates := svc.GetTemplates("cluster-1")
	if len(templates) != 0 {
		t.Errorf("expected 0 templates in cluster-1 (strict 1:1), got %d", len(templates))
	}
}

func TestPersistence(t *testing.T) {
	dir := t.TempDir()

	// Create service and save template
	svc1, _ := NewTemplateService(dir)
	tmpl := TopicTemplate{
		Name:              "Persistent",
		Partitions:        3,
		ReplicationFactor: 2,
		Configs:           map[string]string{},
	}
	id, _ := svc1.SaveTemplate("cluster-1", tmpl)

	// Create new service instance (simulates app restart)
	svc2, err := NewTemplateService(dir)
	if err != nil {
		t.Fatalf("reload service: %v", err)
	}

	// Template should still exist
	got := svc2.GetTemplate("cluster-1", id)
	if got == nil {
		t.Fatal("template not persisted across reload")
	}
	if got.Name != "Persistent" {
		t.Errorf("persisted name mismatch: %s", got.Name)
	}
}
