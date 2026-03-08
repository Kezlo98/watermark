package annotations

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

// setupTestService creates an AnnotationService with a temp directory.
func setupTestService(t *testing.T) *AnnotationService {
	t.Helper()
	dir := t.TempDir()
	svc, err := NewAnnotationService(dir)
	if err != nil {
		t.Fatalf("NewAnnotationService: %v", err)
	}
	return svc
}

func TestNewAnnotationService_CreatesMissingFile(t *testing.T) {
	dir := t.TempDir()
	svc, err := NewAnnotationService(dir)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// File should exist
	path := filepath.Join(dir, annotationsFileName)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		t.Error("expected annotations.json to be created")
	}

	// Should have default empty store
	if svc.store.Version != 1 {
		t.Errorf("expected version 1, got %d", svc.store.Version)
	}
	if len(svc.store.Annotations) != 0 {
		t.Errorf("expected empty annotations, got %d", len(svc.store.Annotations))
	}
}

func TestSetAndGetAnnotation(t *testing.T) {
	svc := setupTestService(t)

	ann := TopicAnnotation{
		Producers: []string{"order-service"},
		Consumers: []string{"analytics"},
		Notes:     "Test topic",
	}

	if err := svc.SetAnnotation("cluster-1", "orders", ann); err != nil {
		t.Fatalf("SetAnnotation: %v", err)
	}

	got := svc.GetAnnotation("cluster-1", "orders")
	if got == nil {
		t.Fatal("expected annotation, got nil")
	}
	if len(got.Producers) != 1 || got.Producers[0] != "order-service" {
		t.Errorf("producers mismatch: %v", got.Producers)
	}
	if len(got.Consumers) != 1 || got.Consumers[0] != "analytics" {
		t.Errorf("consumers mismatch: %v", got.Consumers)
	}
	if got.Notes != "Test topic" {
		t.Errorf("notes mismatch: %s", got.Notes)
	}
	if got.UpdatedAt == "" {
		t.Error("expected updatedAt to be set")
	}
}

func TestGetAnnotation_NotFound(t *testing.T) {
	svc := setupTestService(t)

	got := svc.GetAnnotation("cluster-1", "nonexistent")
	if got != nil {
		t.Errorf("expected nil, got %v", got)
	}
}

func TestGetAnnotations_ReturnsCluster(t *testing.T) {
	svc := setupTestService(t)

	ann1 := TopicAnnotation{Producers: []string{"svc-a"}}
	ann2 := TopicAnnotation{Producers: []string{"svc-b"}}

	svc.SetAnnotation("cluster-1", "topic-a", ann1)
	svc.SetAnnotation("cluster-1", "topic-b", ann2)

	all := svc.GetAnnotations("cluster-1")
	if len(all) != 2 {
		t.Fatalf("expected 2 annotations, got %d", len(all))
	}

	// Empty cluster
	empty := svc.GetAnnotations("cluster-nonexistent")
	if len(empty) != 0 {
		t.Errorf("expected 0 annotations for unknown cluster, got %d", len(empty))
	}
}

func TestBatchSetAnnotation(t *testing.T) {
	svc := setupTestService(t)

	ann := TopicAnnotation{
		Producers: []string{"batch-svc"},
		Consumers: []string{"batch-consumer"},
	}

	topics := []string{"topic-1", "topic-2", "topic-3"}
	if err := svc.BatchSetAnnotation("cluster-1", topics, ann); err != nil {
		t.Fatalf("BatchSetAnnotation: %v", err)
	}

	all := svc.GetAnnotations("cluster-1")
	if len(all) != 3 {
		t.Fatalf("expected 3, got %d", len(all))
	}

	// All should have same timestamp
	var ts string
	for _, a := range all {
		if ts == "" {
			ts = a.UpdatedAt
		}
		if a.UpdatedAt != ts {
			t.Error("expected same timestamp for batch ops")
		}
	}
}

func TestDeleteAnnotation(t *testing.T) {
	svc := setupTestService(t)

	svc.SetAnnotation("cluster-1", "to-delete", TopicAnnotation{Producers: []string{"x"}})

	if err := svc.DeleteAnnotation("cluster-1", "to-delete"); err != nil {
		t.Fatalf("DeleteAnnotation: %v", err)
	}

	got := svc.GetAnnotation("cluster-1", "to-delete")
	if got != nil {
		t.Error("expected nil after delete")
	}
}

func TestDeleteAnnotation_NonExisting(t *testing.T) {
	svc := setupTestService(t)

	// Should not error on non-existing
	if err := svc.DeleteAnnotation("cluster-1", "nonexistent"); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestGetServiceNames(t *testing.T) {
	svc := setupTestService(t)

	svc.SetAnnotation("cluster-1", "topic-1", TopicAnnotation{
		Producers: []string{"order-svc", "checkout-svc"},
		Consumers: []string{"analytics"},
	})
	svc.SetAnnotation("cluster-1", "topic-2", TopicAnnotation{
		Producers: []string{"order-svc"},
		Consumers: []string{"notifications", "analytics"},
	})

	names := svc.GetServiceNames("cluster-1")
	expected := []string{"analytics", "checkout-svc", "notifications", "order-svc"}

	if len(names) != len(expected) {
		t.Fatalf("expected %d names, got %d: %v", len(expected), len(names), names)
	}
	for i, name := range names {
		if name != expected[i] {
			t.Errorf("name[%d]: expected %s, got %s", i, expected[i], name)
		}
	}
}

func TestExportAnnotations_SingleCluster(t *testing.T) {
	svc := setupTestService(t)

	svc.SetAnnotation("cluster-1", "topic-a", TopicAnnotation{Producers: []string{"svc-a"}})
	svc.SetAnnotation("cluster-2", "topic-b", TopicAnnotation{Producers: []string{"svc-b"}})

	data, err := svc.ExportAnnotations("cluster-1")
	if err != nil {
		t.Fatalf("ExportAnnotations: %v", err)
	}

	var exported AnnotationStore
	if err := json.Unmarshal([]byte(data), &exported); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	// Should only contain cluster-1
	if len(exported.Annotations) != 1 {
		t.Errorf("expected 1 cluster, got %d", len(exported.Annotations))
	}
	if _, ok := exported.Annotations["cluster-1"]; !ok {
		t.Error("expected cluster-1 in export")
	}
}

func TestExportAllAnnotations(t *testing.T) {
	svc := setupTestService(t)

	svc.SetAnnotation("cluster-1", "topic-a", TopicAnnotation{Producers: []string{"svc-a"}})
	svc.SetAnnotation("cluster-2", "topic-b", TopicAnnotation{Producers: []string{"svc-b"}})

	data, err := svc.ExportAllAnnotations()
	if err != nil {
		t.Fatalf("ExportAllAnnotations: %v", err)
	}

	var exported AnnotationStore
	if err := json.Unmarshal([]byte(data), &exported); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if len(exported.Annotations) != 2 {
		t.Errorf("expected 2 clusters, got %d", len(exported.Annotations))
	}
}

func TestImportAnnotations_Merge(t *testing.T) {
	svc := setupTestService(t)

	// Pre-existing annotation
	svc.SetAnnotation("cluster-1", "existing-topic", TopicAnnotation{Producers: []string{"existing-svc"}})

	// Import data with a new topic (merge should keep existing)
	importData := AnnotationStore{
		Version: 1,
		Annotations: map[string]map[string]TopicAnnotation{
			"cluster-1": {
				"existing-topic": {Producers: []string{"new-svc"}, UpdatedAt: "2026-01-01T00:00:00Z"},
				"new-topic":      {Producers: []string{"imported-svc"}, UpdatedAt: "2026-01-01T00:00:00Z"},
			},
		},
	}

	jsonBytes, _ := json.Marshal(importData)
	if err := svc.ImportAnnotations("cluster-1", string(jsonBytes), true); err != nil {
		t.Fatalf("ImportAnnotations merge: %v", err)
	}

	// Existing topic should keep original data
	existing := svc.GetAnnotation("cluster-1", "existing-topic")
	if existing == nil {
		t.Fatal("expected existing annotation")
	}
	if existing.Producers[0] != "existing-svc" {
		t.Errorf("merge should keep existing, got: %v", existing.Producers)
	}

	// New topic should be added
	newTopic := svc.GetAnnotation("cluster-1", "new-topic")
	if newTopic == nil {
		t.Fatal("expected new annotation from import")
	}
	if newTopic.Producers[0] != "imported-svc" {
		t.Errorf("expected imported-svc, got %v", newTopic.Producers)
	}
}

func TestImportAnnotations_Replace(t *testing.T) {
	svc := setupTestService(t)

	// Pre-existing
	svc.SetAnnotation("cluster-1", "old-topic", TopicAnnotation{Producers: []string{"old-svc"}})

	importData := AnnotationStore{
		Version: 1,
		Annotations: map[string]map[string]TopicAnnotation{
			"cluster-1": {
				"new-topic": {Producers: []string{"new-svc"}, UpdatedAt: "2026-01-01T00:00:00Z"},
			},
		},
	}

	jsonBytes, _ := json.Marshal(importData)
	if err := svc.ImportAnnotations("cluster-1", string(jsonBytes), false); err != nil {
		t.Fatalf("ImportAnnotations replace: %v", err)
	}

	// Old topic should be gone
	old := svc.GetAnnotation("cluster-1", "old-topic")
	if old != nil {
		t.Error("replace mode should remove old annotation")
	}

	// New topic should exist
	newTopic := svc.GetAnnotation("cluster-1", "new-topic")
	if newTopic == nil {
		t.Fatal("expected new annotation")
	}
}

func TestImportAnnotations_InvalidJSON(t *testing.T) {
	svc := setupTestService(t)

	err := svc.ImportAnnotations("cluster-1", "{invalid json", true)
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestImportAnnotations_CrossCluster(t *testing.T) {
	svc := setupTestService(t)

	// Simulate: export from "local-cluster", import into "dev-cluster"
	exportData := AnnotationStore{
		Version: 1,
		Annotations: map[string]map[string]TopicAnnotation{
			"local-cluster-uuid": {
				"SPI_EVENT_DEV": {Producers: []string{"aml-name-screening"}, Consumers: []string{"aml-spi-engine"}, UpdatedAt: "2026-03-06T16:51:02Z"},
			},
		},
	}

	jsonBytes, _ := json.Marshal(exportData)
	if err := svc.ImportAnnotations("dev-cluster-uuid", string(jsonBytes), true); err != nil {
		t.Fatalf("ImportAnnotations cross-cluster: %v", err)
	}

	// Annotations should appear under the dev cluster, not the local cluster
	devAnns := svc.GetAnnotations("dev-cluster-uuid")
	if len(devAnns) != 1 {
		t.Fatalf("expected 1 annotation in dev-cluster, got %d", len(devAnns))
	}
	if _, ok := devAnns["SPI_EVENT_DEV"]; !ok {
		t.Error("expected SPI_EVENT_DEV in dev-cluster annotations")
	}

	// Local cluster should have nothing
	localAnns := svc.GetAnnotations("local-cluster-uuid")
	if len(localAnns) != 0 {
		t.Errorf("expected 0 annotations in local-cluster, got %d", len(localAnns))
	}
}

func TestConcurrentReadWrite(t *testing.T) {
	svc := setupTestService(t)

	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(2)

		// Writer
		go func(idx int) {
			defer wg.Done()
			ann := TopicAnnotation{Producers: []string{"svc"}}
			svc.SetAnnotation("cluster-1", "topic", ann)
		}(i)

		// Reader
		go func(idx int) {
			defer wg.Done()
			svc.GetAnnotations("cluster-1")
		}(i)
	}

	wg.Wait()
	// If we get here without panic/deadlock, concurrent safety is OK
}

func TestPersistenceAcrossRestarts(t *testing.T) {
	dir := t.TempDir()

	// First instance
	svc1, err := NewAnnotationService(dir)
	if err != nil {
		t.Fatalf("first init: %v", err)
	}
	svc1.SetAnnotation("cluster-1", "persist-test", TopicAnnotation{Producers: []string{"persist-svc"}})

	// Second instance (simulates restart)
	svc2, err := NewAnnotationService(dir)
	if err != nil {
		t.Fatalf("second init: %v", err)
	}

	got := svc2.GetAnnotation("cluster-1", "persist-test")
	if got == nil {
		t.Fatal("expected annotation to persist across restarts")
	}
	if got.Producers[0] != "persist-svc" {
		t.Errorf("expected persist-svc, got %v", got.Producers)
	}
}
