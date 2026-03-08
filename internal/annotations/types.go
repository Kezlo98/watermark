package annotations

// TopicAnnotation holds producer/consumer metadata for a single topic.
type TopicAnnotation struct {
	Producers []string `json:"producers"`
	Consumers []string `json:"consumers"`
	Notes     string   `json:"notes,omitempty"`
	UpdatedAt string   `json:"updatedAt"`
}

// AnnotationStore is the root structure persisted to ~/.watermark/annotations.json.
type AnnotationStore struct {
	Version     int                                   `json:"version"`
	Annotations map[string]map[string]TopicAnnotation `json:"annotations"` // clusterID -> topicName -> annotation
}
