package config

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/google/uuid"
)

// ConfigService manages cluster profiles and app settings.
// All public methods are exposed to the frontend via Wails bindings.
type ConfigService struct {
	configDir string
	key       []byte
	config    AppConfig
	mu        sync.RWMutex
}

// NewConfigService initializes the config service. Loads key + config from ~/.watermark/.
func NewConfigService() (*ConfigService, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("config: get home dir: %w", err)
	}

	configDir := filepath.Join(homeDir, ".watermark")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return nil, fmt.Errorf("config: create dir: %w", err)
	}

	key, err := LoadOrCreateKey(configDir)
	if err != nil {
		return nil, fmt.Errorf("config: key: %w", err)
	}

	svc := &ConfigService{configDir: configDir, key: key}
	if err := svc.loadConfig(); err != nil {
		svc.config = svc.defaultConfig()
		if saveErr := svc.saveConfig(); saveErr != nil {
			return nil, fmt.Errorf("config: save default: %w", saveErr)
		}
	}

	return svc, nil
}

// NewConfigServiceWithDir creates a ConfigService with a custom config directory (for testing).
func NewConfigServiceWithDir(configDir string) (*ConfigService, error) {
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return nil, fmt.Errorf("config: create dir: %w", err)
	}

	key, err := LoadOrCreateKey(configDir)
	if err != nil {
		return nil, fmt.Errorf("config: key: %w", err)
	}

	svc := &ConfigService{configDir: configDir, key: key}
	if err := svc.loadConfig(); err != nil {
		svc.config = svc.defaultConfig()
		if saveErr := svc.saveConfig(); saveErr != nil {
			return nil, fmt.Errorf("config: save default: %w", saveErr)
		}
	}

	return svc, nil
}

// GetClusters returns all cluster profiles (passwords remain encrypted).
func (s *ConfigService) GetClusters() []ClusterProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]ClusterProfile, len(s.config.Clusters))
	copy(result, s.config.Clusters)
	return result
}

// GetCluster returns a single cluster profile by ID.
func (s *ConfigService) GetCluster(id string) (*ClusterProfile, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := range s.config.Clusters {
		if s.config.Clusters[i].ID == id {
			cp := s.config.Clusters[i]
			return &cp, nil
		}
	}
	return nil, fmt.Errorf("cluster not found: %s", id)
}

// SaveCluster creates or updates a cluster profile. Auto-encrypts password fields.
func (s *ConfigService) SaveCluster(profile ClusterProfile) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if err := s.encryptProfilePasswords(&profile); err != nil {
		return fmt.Errorf("save cluster: %w", err)
	}

	if profile.ID == "" {
		profile.ID = uuid.New().String()
	}

	for i, c := range s.config.Clusters {
		if c.ID == profile.ID {
			s.config.Clusters[i] = profile
			return s.saveConfig()
		}
	}

	s.config.Clusters = append(s.config.Clusters, profile)
	return s.saveConfig()
}

// DeleteCluster removes a cluster profile by ID.
func (s *ConfigService) DeleteCluster(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, c := range s.config.Clusters {
		if c.ID == id {
			s.config.Clusters = append(s.config.Clusters[:i], s.config.Clusters[i+1:]...)
			if s.config.ActiveClusterID == id {
				s.config.ActiveClusterID = ""
			}
			return s.saveConfig()
		}
	}
	return fmt.Errorf("cluster not found: %s", id)
}

// DuplicateCluster copies a cluster profile with a new ID and "(copy)" suffix.
func (s *ConfigService) DuplicateCluster(id string) (*ClusterProfile, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var source *ClusterProfile
	for i := range s.config.Clusters {
		if s.config.Clusters[i].ID == id {
			cp := s.config.Clusters[i]
			source = &cp
			break
		}
	}
	if source == nil {
		return nil, fmt.Errorf("cluster not found: %s", id)
	}

	dup := *source
	dup.ID = uuid.New().String()
	dup.Name = source.Name + " (copy)"
	s.config.Clusters = append(s.config.Clusters, dup)

	if err := s.saveConfig(); err != nil {
		return nil, err
	}

	return &dup, nil
}

// GetConfigDir returns the config directory path.
func (s *ConfigService) GetConfigDir() string {
	return s.configDir
}
