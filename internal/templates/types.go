package templates

// TopicTemplate represents a reusable Kafka topic configuration template.
type TopicTemplate struct {
	ID                string            `json:"id"`
	Name              string            `json:"name"`
	Description       string            `json:"description,omitempty"`
	Pattern           string            `json:"pattern,omitempty"`     // glob pattern for auto-match
	Partitions        int32             `json:"partitions"`
	ReplicationFactor int16             `json:"replicationFactor"`
	Configs           map[string]string `json:"configs"`              // overridden configs only
	CreatedAt         string            `json:"createdAt"`
	UpdatedAt         string            `json:"updatedAt"`
}

// TemplateStore holds all templates persisted to ~/.watermark/templates.json
type TemplateStore struct {
	Version   int                                 `json:"version"`
	Templates map[string]map[string]TopicTemplate `json:"templates"` // clusterID → templateID → template
}
