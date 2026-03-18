package config

import "fmt"

// GetSettings returns current app settings.
func (s *ConfigService) GetSettings() AppSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config.Settings
}

// SaveSettings updates app settings.
func (s *ConfigService) SaveSettings(settings AppSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.config.Settings = settings
	return s.saveConfig()
}

// GetActiveClusterID returns the currently active cluster profile ID.
func (s *ConfigService) GetActiveClusterID() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config.ActiveClusterID
}

// SetActiveCluster sets the active cluster profile.
func (s *ConfigService) SetActiveCluster(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	found := false
	for _, c := range s.config.Clusters {
		if c.ID == id {
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("cluster not found: %s", id)
	}

	s.config.ActiveClusterID = id
	return s.saveConfig()
}

// GetSkippedVersion returns the currently skipped update version.
func (s *ConfigService) GetSkippedVersion() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config.SkippedVersion
}

// SkipVersion persists the version to skip to config. Called as a Wails binding.
func (s *ConfigService) SkipVersion(version string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.config.SkippedVersion = version
	return s.saveConfig()
}

// GetDecryptedPassword decrypts and returns the Kafka password for a cluster.
func (s *ConfigService) GetDecryptedPassword(id string) (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, c := range s.config.Clusters {
		if c.ID == id {
			return Decrypt(c.Password, s.key)
		}
	}
	return "", fmt.Errorf("cluster not found: %s", id)
}

// GetDecryptedSchemaRegistryPassword decrypts the schema registry password.
func (s *ConfigService) GetDecryptedSchemaRegistryPassword(id string) (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, c := range s.config.Clusters {
		if c.ID == id {
			return Decrypt(c.SchemaRegistryPassword, s.key)
		}
	}
	return "", fmt.Errorf("cluster not found: %s", id)
}
