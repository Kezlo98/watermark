package schema

// SchemaSubject matches frontend SchemaSubject interface.
type SchemaSubject struct {
	Name          string `json:"name"`
	LatestVersion int    `json:"latestVersion"`
	Type          string `json:"type"`          // AVRO, JSON, PROTOBUF
	Compatibility string `json:"compatibility"` // BACKWARD, FORWARD, FULL, NONE
}

// SchemaVersion matches frontend SchemaVersion interface.
type SchemaVersion struct {
	Version     int    `json:"version"`
	ID          int    `json:"id"`
	Schema      string `json:"schema"`
	Type        string `json:"type"`
	Date        string `json:"date,omitempty"`
	Description string `json:"description,omitempty"`
}

// subjectVersionResponse is the REST API response for a specific version (internal).
type subjectVersionResponse struct {
	Subject    string `json:"subject"`
	Version    int    `json:"version"`
	ID         int    `json:"id"`
	Schema     string `json:"schema"`
	SchemaType string `json:"schemaType"` // defaults to AVRO if empty
}

// configResponse is the REST API response for compatibility config (internal).
type configResponse struct {
	CompatibilityLevel string `json:"compatibilityLevel"`
}
