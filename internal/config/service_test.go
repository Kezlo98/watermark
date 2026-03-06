package config

import (
	"testing"
)

func newTestService(t *testing.T) *ConfigService {
	t.Helper()
	dir := t.TempDir()
	svc, err := NewConfigServiceWithDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	return svc
}

func TestNewConfigServiceCreatesDefault(t *testing.T) {
	svc := newTestService(t)

	clusters := svc.GetClusters()
	if len(clusters) != 0 {
		t.Fatalf("expected 0 clusters, got %d", len(clusters))
	}

	settings := svc.GetSettings()
	if settings.Theme != "dark" {
		t.Fatalf("expected dark theme, got %s", settings.Theme)
	}
	if settings.CodeFont != "JetBrains Mono" {
		t.Fatalf("expected JetBrains Mono, got %s", settings.CodeFont)
	}
}

func TestSaveAndGetCluster(t *testing.T) {
	svc := newTestService(t)

	profile := ClusterProfile{
		Name:             "Test Cluster",
		BootstrapServers: "localhost:9092",
		Color:            "purple",
		SecurityProtocol: "NONE",
		Password:         "secret123",
	}

	if err := svc.SaveCluster(profile); err != nil {
		t.Fatal(err)
	}

	clusters := svc.GetClusters()
	if len(clusters) != 1 {
		t.Fatalf("expected 1 cluster, got %d", len(clusters))
	}

	// ID should be auto-generated
	if clusters[0].ID == "" {
		t.Fatal("expected auto-generated ID")
	}

	// Password should be encrypted
	if !IsEncrypted(clusters[0].Password) {
		t.Fatal("expected encrypted password")
	}

	// Get by ID
	got, err := svc.GetCluster(clusters[0].ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.Name != "Test Cluster" {
		t.Fatalf("expected 'Test Cluster', got %s", got.Name)
	}
}

func TestUpdateCluster(t *testing.T) {
	svc := newTestService(t)

	profile := ClusterProfile{
		Name:             "Original",
		BootstrapServers: "localhost:9092",
		SecurityProtocol: "NONE",
	}
	svc.SaveCluster(profile)

	clusters := svc.GetClusters()
	updated := clusters[0]
	updated.Name = "Updated"
	svc.SaveCluster(updated)

	clusters = svc.GetClusters()
	if len(clusters) != 1 {
		t.Fatalf("expected 1 cluster, got %d", len(clusters))
	}
	if clusters[0].Name != "Updated" {
		t.Fatalf("expected 'Updated', got %s", clusters[0].Name)
	}
}

func TestDeleteCluster(t *testing.T) {
	svc := newTestService(t)

	profile := ClusterProfile{
		Name:             "ToDelete",
		BootstrapServers: "localhost:9092",
		SecurityProtocol: "NONE",
	}
	svc.SaveCluster(profile)
	clusters := svc.GetClusters()
	id := clusters[0].ID

	svc.SetActiveCluster(id)
	if svc.GetActiveClusterID() != id {
		t.Fatal("expected active cluster to be set")
	}

	if err := svc.DeleteCluster(id); err != nil {
		t.Fatal(err)
	}

	clusters = svc.GetClusters()
	if len(clusters) != 0 {
		t.Fatalf("expected 0 clusters, got %d", len(clusters))
	}

	// Active cluster should be cleared
	if svc.GetActiveClusterID() != "" {
		t.Fatal("expected active cluster to be cleared on delete")
	}
}

func TestDeleteClusterNotFound(t *testing.T) {
	svc := newTestService(t)

	err := svc.DeleteCluster("nonexistent")
	if err == nil {
		t.Fatal("expected error for nonexistent cluster")
	}
}

func TestDuplicateCluster(t *testing.T) {
	svc := newTestService(t)

	profile := ClusterProfile{
		Name:             "Original",
		BootstrapServers: "localhost:9092",
		Color:            "green",
		SecurityProtocol: "NONE",
		Password:         "secret",
	}
	svc.SaveCluster(profile)
	clusters := svc.GetClusters()

	dup, err := svc.DuplicateCluster(clusters[0].ID)
	if err != nil {
		t.Fatal(err)
	}

	if dup.Name != "Original (copy)" {
		t.Fatalf("expected 'Original (copy)', got %s", dup.Name)
	}
	if dup.ID == clusters[0].ID {
		t.Fatal("expected different ID for duplicate")
	}
	if dup.Color != "green" {
		t.Fatalf("expected same color, got %s", dup.Color)
	}

	all := svc.GetClusters()
	if len(all) != 2 {
		t.Fatalf("expected 2 clusters, got %d", len(all))
	}
}

func TestSaveAndGetSettings(t *testing.T) {
	svc := newTestService(t)

	settings := AppSettings{
		Theme:           "light",
		Density:         "compact",
		CodeFont:        "Fira Code",
		CodeFontSize:    12,
		LaunchOnStartup: true,
		MinimizeToTray:  true,
	}

	if err := svc.SaveSettings(settings); err != nil {
		t.Fatal(err)
	}

	got := svc.GetSettings()
	if got.Theme != "light" {
		t.Fatalf("expected 'light', got %s", got.Theme)
	}
	if got.CodeFontSize != 12 {
		t.Fatalf("expected 12, got %d", got.CodeFontSize)
	}
}

func TestGetDecryptedPassword(t *testing.T) {
	svc := newTestService(t)

	profile := ClusterProfile{
		Name:             "WithPW",
		BootstrapServers: "localhost:9092",
		SecurityProtocol: "SASL_PLAIN",
		Password:         "my-secret",
	}
	svc.SaveCluster(profile)
	clusters := svc.GetClusters()

	decrypted, err := svc.GetDecryptedPassword(clusters[0].ID)
	if err != nil {
		t.Fatal(err)
	}
	if decrypted != "my-secret" {
		t.Fatalf("expected 'my-secret', got %q", decrypted)
	}
}

func TestGetDecryptedSchemaRegistryPassword(t *testing.T) {
	svc := newTestService(t)

	profile := ClusterProfile{
		Name:                   "WithSRPW",
		BootstrapServers:       "localhost:9092",
		SecurityProtocol:       "NONE",
		SchemaRegistryPassword: "sr-secret",
	}
	svc.SaveCluster(profile)
	clusters := svc.GetClusters()

	decrypted, err := svc.GetDecryptedSchemaRegistryPassword(clusters[0].ID)
	if err != nil {
		t.Fatal(err)
	}
	if decrypted != "sr-secret" {
		t.Fatalf("expected 'sr-secret', got %q", decrypted)
	}
}
