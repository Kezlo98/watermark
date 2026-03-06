package config

import (
	"encoding/json"
	"strings"
	"sync"
	"testing"
)

func TestExportConfigWithPasswords(t *testing.T) {
	svc := newTestService(t)

	svc.SaveCluster(ClusterProfile{
		Name:             "Test",
		BootstrapServers: "localhost:9092",
		SecurityProtocol: "SASL_PLAIN",
		Password:         "secret",
	})

	exported, err := svc.ExportConfig(true)
	if err != nil {
		t.Fatal(err)
	}

	// Should contain encrypted password
	if !strings.Contains(exported, "enc:v1:aes256gcm:") {
		t.Fatal("expected encrypted password in export")
	}
}

func TestExportConfigWithoutPasswords(t *testing.T) {
	svc := newTestService(t)

	svc.SaveCluster(ClusterProfile{
		Name:             "Test",
		BootstrapServers: "localhost:9092",
		SecurityProtocol: "SASL_PLAIN",
		Password:         "secret",
	})

	exported, err := svc.ExportConfig(false)
	if err != nil {
		t.Fatal(err)
	}

	// Should NOT contain any password data
	if strings.Contains(exported, "enc:v1:") {
		t.Fatal("expected no encrypted password in export without passwords")
	}

	// Parse and verify password field is empty
	var cfg AppConfig
	json.Unmarshal([]byte(exported), &cfg)
	if cfg.Clusters[0].Password != "" {
		t.Fatal("expected empty password in stripped export")
	}
}

func TestImportConfig(t *testing.T) {
	svc := newTestService(t)

	importJSON := `{
		"clusters": [
			{
				"id": "imported-1",
				"name": "Imported Cluster",
				"bootstrapServers": "kafka:9092",
				"color": "red",
				"securityProtocol": "SASL_PLAIN",
				"password": "plaintext-pw"
			}
		],
		"settings": {
			"theme": "light",
			"density": "compact",
			"codeFont": "Fira Code",
			"codeFontSize": 16,
			"launchOnStartup": false,
			"minimizeToTray": false
		},
		"activeClusterId": ""
	}`

	if err := svc.ImportConfig(importJSON); err != nil {
		t.Fatal(err)
	}

	clusters := svc.GetClusters()
	if len(clusters) != 1 {
		t.Fatalf("expected 1 cluster, got %d", len(clusters))
	}

	// Password should be auto-encrypted during import
	if !IsEncrypted(clusters[0].Password) {
		t.Fatal("expected password to be encrypted after import")
	}

	settings := svc.GetSettings()
	if settings.Theme != "light" {
		t.Fatalf("expected 'light' theme, got %s", settings.Theme)
	}
}

func TestImportConfigInvalidJSON(t *testing.T) {
	svc := newTestService(t)
	err := svc.ImportConfig("not json")
	if err == nil {
		t.Fatal("expected error for invalid JSON")
	}
}

func TestConcurrentAccess(t *testing.T) {
	svc := newTestService(t)

	var wg sync.WaitGroup
	errCh := make(chan error, 20)

	// Write operations
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			profile := ClusterProfile{
				Name:             "Concurrent",
				BootstrapServers: "localhost:9092",
				SecurityProtocol: "NONE",
			}
			if err := svc.SaveCluster(profile); err != nil {
				errCh <- err
			}
		}(i)
	}

	// Read operations
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = svc.GetClusters()
			_ = svc.GetSettings()
		}()
	}

	wg.Wait()
	close(errCh)

	for err := range errCh {
		t.Fatalf("concurrent error: %v", err)
	}
}

func TestSetActiveClusterNotFound(t *testing.T) {
	svc := newTestService(t)
	err := svc.SetActiveCluster("nonexistent")
	if err == nil {
		t.Fatal("expected error for nonexistent cluster")
	}
}

func TestTestConnectionInvalidServer(t *testing.T) {
	svc := newTestService(t)
	err := svc.TestConnection("invalid-host:99999")
	if err == nil {
		t.Fatal("expected error for invalid server")
	}
}

func TestTestConnectionEmptyServers(t *testing.T) {
	svc := newTestService(t)
	err := svc.TestConnection("")
	if err == nil {
		t.Fatal("expected error for empty servers")
	}
}

func TestConfigPersistence(t *testing.T) {
	dir := t.TempDir()

	// Create service and save data
	svc1, err := NewConfigServiceWithDir(dir)
	if err != nil {
		t.Fatal(err)
	}

	svc1.SaveCluster(ClusterProfile{
		Name:             "Persistent",
		BootstrapServers: "localhost:9092",
		SecurityProtocol: "NONE",
	})
	svc1.SaveSettings(AppSettings{
		Theme:        "light",
		Density:      "spacious",
		CodeFont:     "Monospace",
		CodeFontSize: 16,
	})

	// Create new service with same dir — should load saved data
	svc2, err := NewConfigServiceWithDir(dir)
	if err != nil {
		t.Fatal(err)
	}

	clusters := svc2.GetClusters()
	if len(clusters) != 1 {
		t.Fatalf("expected 1 cluster after reload, got %d", len(clusters))
	}
	if clusters[0].Name != "Persistent" {
		t.Fatalf("expected 'Persistent', got %s", clusters[0].Name)
	}

	settings := svc2.GetSettings()
	if settings.Theme != "light" {
		t.Fatalf("expected 'light', got %s", settings.Theme)
	}
}
