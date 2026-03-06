package schema

import (
	"encoding/json"
	"fmt"

	"golang.org/x/sync/errgroup"
)

// GetSchemaVersions returns all versions for a subject.
func (s *SchemaService) GetSchemaVersions(subject string) ([]SchemaVersion, error) {
	ctx := s.getCtx()

	// Get version numbers
	body, err := s.doRequest(ctx, "GET", fmt.Sprintf("/subjects/%s/versions", subject))
	if err != nil {
		return nil, fmt.Errorf("get versions: %w", err)
	}

	var versionNums []int
	if err := json.Unmarshal(body, &versionNums); err != nil {
		return nil, fmt.Errorf("get versions: parse: %w", err)
	}

	// Fetch each version in parallel
	versions := make([]SchemaVersion, len(versionNums))
	g, gCtx := errgroup.WithContext(ctx)
	g.SetLimit(10)

	for i, ver := range versionNums {
		i, ver := i, ver
		g.Go(func() error {
			verBody, err := s.doRequestCtx(gCtx, "GET", fmt.Sprintf("/subjects/%s/versions/%d", subject, ver))
			if err != nil {
				return nil
			}

			var resp subjectVersionResponse
			if json.Unmarshal(verBody, &resp) == nil {
				schemaType := resp.SchemaType
				if schemaType == "" {
					schemaType = "AVRO"
				}
				versions[i] = SchemaVersion{
					Version: resp.Version,
					ID:      resp.ID,
					Schema:  resp.Schema,
					Type:    schemaType,
				}
			}
			return nil
		})
	}

	g.Wait()
	return versions, nil
}

// GetSchemaVersion returns a specific version's schema definition.
func (s *SchemaService) GetSchemaVersion(subject string, version int) (*SchemaVersion, error) {
	ctx := s.getCtx()

	body, err := s.doRequest(ctx, "GET", fmt.Sprintf("/subjects/%s/versions/%d", subject, version))
	if err != nil {
		return nil, fmt.Errorf("get schema version: %w", err)
	}

	var resp subjectVersionResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("get schema version: parse: %w", err)
	}

	schemaType := resp.SchemaType
	if schemaType == "" {
		schemaType = "AVRO"
	}

	return &SchemaVersion{
		Version: resp.Version,
		ID:      resp.ID,
		Schema:  resp.Schema,
		Type:    schemaType,
	}, nil
}

// GetCompatibility returns compatibility level for a subject.
func (s *SchemaService) GetCompatibility(subject string) (string, error) {
	ctx := s.getCtx()

	body, err := s.doRequest(ctx, "GET", fmt.Sprintf("/config/%s", subject))
	if err != nil {
		return "", fmt.Errorf("get compatibility: %w", err)
	}

	var resp configResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return "", fmt.Errorf("get compatibility: parse: %w", err)
	}

	return resp.CompatibilityLevel, nil
}
