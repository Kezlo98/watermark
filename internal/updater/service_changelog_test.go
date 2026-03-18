package updater

import (
	"testing"
)

const sampleChangelog = `# Changelog

## [Unreleased]

## [1.0.3] - 2026-03-13
### Added
- Topic templates

### Fixed
- Some bug

## [1.0.2] - 2026-03-12
### Added
- Manual update check

## [1.0.1] - 2026-03-12
### Fixed
- Misleading label

## [1.0.0] - 2026-03-10
### Added
- Auto-update
`

func TestParseChangelog(t *testing.T) {
	notes := parseChangelog(sampleChangelog)
	if len(notes) != 4 {
		t.Fatalf("expected 4 entries, got %d", len(notes))
	}
	if notes[0].Version != "1.0.3" {
		t.Errorf("expected first version 1.0.3, got %s", notes[0].Version)
	}
	if notes[0].Date != "2026-03-13" {
		t.Errorf("expected date 2026-03-13, got %s", notes[0].Date)
	}
	if notes[0].Notes == "" {
		t.Error("expected non-empty notes for 1.0.3")
	}
}

func TestParseChangelogEmpty(t *testing.T) {
	notes := parseChangelog("")
	if len(notes) != 0 {
		t.Errorf("expected 0 entries for empty input, got %d", len(notes))
	}
}

func TestParseChangelogMalformed(t *testing.T) {
	// Malformed headers should be skipped gracefully
	raw := "## not a version\n## [bad] - date\n## [1.0.0] - 2026-01-01\n### Added\n- thing\n"
	notes := parseChangelog(raw)
	if len(notes) != 1 {
		t.Fatalf("expected 1 valid entry, got %d", len(notes))
	}
	if notes[0].Version != "1.0.0" {
		t.Errorf("expected 1.0.0, got %s", notes[0].Version)
	}
}

func TestFilterByVersionRange(t *testing.T) {
	notes := parseChangelog(sampleChangelog)

	// current=1.0.0, latest=1.0.3 → should return 1.0.1, 1.0.2, 1.0.3
	filtered := filterByVersionRange(notes, "v1.0.0", "v1.0.3")
	if len(filtered) != 3 {
		t.Fatalf("expected 3 entries, got %d", len(filtered))
	}

	// current=1.0.2, latest=1.0.3 → should return only 1.0.3
	filtered = filterByVersionRange(notes, "1.0.2", "1.0.3")
	if len(filtered) != 1 {
		t.Errorf("expected 1 entry, got %d", len(filtered))
	}
	if filtered[0].Version != "1.0.3" {
		t.Errorf("expected 1.0.3, got %s", filtered[0].Version)
	}
}

func TestFilterByVersionRangeInvalidVersion(t *testing.T) {
	notes := parseChangelog(sampleChangelog)
	// Invalid current version → returns all notes (graceful fallback)
	filtered := filterByVersionRange(notes, "invalid", "1.0.3")
	if len(filtered) != len(notes) {
		t.Errorf("expected fallback to all notes, got %d", len(filtered))
	}
}
