package updater

// UpdateInfo holds metadata about an available update from GitHub Releases.
type UpdateInfo struct {
	Available    bool   `json:"available"`
	Skipped      bool   `json:"skipped"`
	CurrentVer   string `json:"currentVersion"`
	LatestVer    string `json:"latestVersion"`
	ReleaseURL   string `json:"releaseUrl"`
	ReleaseNotes string `json:"releaseNotes"`
	PublishedAt  string `json:"publishedAt"`
}

// ReleaseNote represents one version entry from CHANGELOG.md.
type ReleaseNote struct {
	Version string `json:"version"` // "1.5.0" (no "v" prefix)
	Date    string `json:"date"`    // "2026-03-15"
	Notes   string `json:"notes"`   // markdown body (### Added, ### Fixed, etc.)
}

// UpdateStatus represents the current phase of an ongoing update operation.
type UpdateStatus struct {
	Phase    string  `json:"phase"`    // "checking", "downloading", "verifying", "applying", "re-signing", "done", "error"
	Progress float64 `json:"progress"` // 0.0 – 1.0
	Error    string  `json:"error,omitempty"`
}
