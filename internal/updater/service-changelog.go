package updater

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/Masterminds/semver/v3"
)

const changelogURL = "https://raw.githubusercontent.com/Kezlo98/watermark/main/CHANGELOG.md"

// versionHeaderRe matches lines like: ## [1.2.3] - 2026-01-15
var versionHeaderRe = regexp.MustCompile(`^## \[(\d+\.\d+\.\d+)\]\s*[-–—]\s*(.+)$`)

// fetchChangelogRaw fetches the raw CHANGELOG.md content from GitHub.
func fetchChangelogRaw() (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(changelogURL)
	if err != nil {
		return "", fmt.Errorf("fetch changelog: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("fetch changelog: HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read changelog body: %w", err)
	}
	return string(body), nil
}

// parseChangelog splits raw CHANGELOG.md content into ReleaseNote entries.
// Returns entries in descending version order (newest first).
func parseChangelog(raw string) []ReleaseNote {
	lines := strings.Split(raw, "\n")
	var notes []ReleaseNote
	var current *ReleaseNote
	var bodyLines []string

	for _, line := range lines {
		if m := versionHeaderRe.FindStringSubmatch(line); m != nil {
			// Save previous entry
			if current != nil {
				current.Notes = strings.TrimSpace(strings.Join(bodyLines, "\n"))
				notes = append(notes, *current)
			}
			current = &ReleaseNote{Version: m[1], Date: strings.TrimSpace(m[2])}
			bodyLines = nil
		} else if current != nil {
			bodyLines = append(bodyLines, line)
		}
	}
	// Save last entry
	if current != nil {
		current.Notes = strings.TrimSpace(strings.Join(bodyLines, "\n"))
		notes = append(notes, *current)
	}
	return notes
}

// filterByVersionRange returns notes where current < version <= latest.
func filterByVersionRange(notes []ReleaseNote, current, latest string) []ReleaseNote {
	// Strip leading "v" for semver parsing
	currentClean := strings.TrimPrefix(current, "v")
	latestClean := strings.TrimPrefix(latest, "v")

	currentSV, err := semver.NewVersion(currentClean)
	if err != nil {
		log.Printf("changelog: invalid current version %q: %v", current, err)
		return nil
	}
	latestSV, err := semver.NewVersion(latestClean)
	if err != nil {
		log.Printf("changelog: invalid latest version %q: %v", latest, err)
		return nil
	}

	var filtered []ReleaseNote
	for _, n := range notes {
		v, err := semver.NewVersion(n.Version)
		if err != nil {
			continue
		}
		if v.GreaterThan(currentSV) && (v.LessThan(latestSV) || v.Equal(latestSV)) {
			filtered = append(filtered, n)
		}
	}
	return filtered
}

// GetChangelog fetches, parses, and returns release notes between current and latest version.
// Results are cached in memory for the session. Called as a Wails binding.
func (u *UpdaterService) GetChangelog() ([]ReleaseNote, error) {
	// Return cached result if available
	u.mu.RLock()
	if u.changelog != nil {
		cached := u.changelog
		latestVer := ""
		if u.latest != nil {
			latestVer = u.latest.Version()
		}
		u.mu.RUnlock()
		return filterByVersionRange(cached, u.version, latestVer), nil
	}
	u.mu.RUnlock()

	raw, err := fetchChangelogRaw()
	if err != nil {
		return nil, err
	}

	parsed := parseChangelog(raw)

	u.mu.Lock()
	u.changelog = parsed
	latestVer := ""
	if u.latest != nil {
		latestVer = u.latest.Version()
	}
	u.mu.Unlock()

	return filterByVersionRange(parsed, u.version, latestVer), nil
}
