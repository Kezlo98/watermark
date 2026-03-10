package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

// ListAWSProfiles reads ~/.aws/config and ~/.aws/credentials to return
// available AWS profile names. Always includes "(Default)" as the first entry.
// If neither file exists, returns just ["(Default)"].
func (s *ConfigService) ListAWSProfiles() []string {
	home, err := os.UserHomeDir()
	if err != nil {
		return []string{"(Default)"}
	}

	seen := map[string]bool{"default": true} // "(Default)" always included
	profiles := []string{"(Default)"}

	// ~/.aws/config — profiles are [profile name] sections (except [default])
	parseAWSFile(filepath.Join(home, ".aws", "config"), true, seen, &profiles)
	// ~/.aws/credentials — profiles are [name] sections (no "profile " prefix)
	parseAWSFile(filepath.Join(home, ".aws", "credentials"), false, seen, &profiles)

	return profiles
}

// parseAWSFile scans an INI file for section headers and extracts profile names.
// isConfigFile controls the parsing logic:
//   - true  → expects "[profile name]" format (config file), also handles "[default]"
//   - false → expects "[name]" format (credentials file)
func parseAWSFile(path string, isConfigFile bool, seen map[string]bool, profiles *[]string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if !strings.HasPrefix(line, "[") || !strings.HasSuffix(line, "]") {
			continue
		}

		// Strip brackets: [profile staging] → "profile staging" or [staging] → "staging"
		inner := line[1 : len(line)-1]
		inner = strings.TrimSpace(inner)

		name := inner
		if isConfigFile {
			// In ~/.aws/config, profiles are "[profile name]" except "[default]"
			if strings.HasPrefix(inner, "profile ") {
				name = strings.TrimPrefix(inner, "profile ")
				name = strings.TrimSpace(name)
			}
			// [default] is handled — already in seen map
		}

		if name != "" && !seen[name] {
			seen[name] = true
			*profiles = append(*profiles, name)
		}
	}
}
