package updater

// UpdateInfo holds metadata about an available update from GitHub Releases.
type UpdateInfo struct {
	Available    bool   `json:"available"`
	CurrentVer   string `json:"currentVersion"`
	LatestVer    string `json:"latestVersion"`
	ReleaseURL   string `json:"releaseUrl"`
	ReleaseNotes string `json:"releaseNotes"`
	PublishedAt  string `json:"publishedAt"`
}

// UpdateStatus represents the current phase of an ongoing update operation.
type UpdateStatus struct {
	Phase    string  `json:"phase"`    // "checking", "downloading", "verifying", "applying", "re-signing", "done", "error"
	Progress float64 `json:"progress"` // 0.0 – 1.0
	Error    string  `json:"error,omitempty"`
}
