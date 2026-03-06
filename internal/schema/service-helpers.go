package schema

import (
	"context"
	"fmt"
	"io"
	"net/http"
)

// doRequest executes an HTTP request with optional Basic Auth using the service context.
func (s *SchemaService) doRequest(ctx context.Context, method, path string) ([]byte, error) {
	return s.doRequestCtx(ctx, method, path)
}

// doRequestCtx executes an HTTP request with a specific context.
func (s *SchemaService) doRequestCtx(ctx context.Context, method, path string) ([]byte, error) {
	s.mu.RLock()
	baseURL := s.baseURL
	username := s.username
	password := s.password
	s.mu.RUnlock()

	if baseURL == "" {
		return nil, fmt.Errorf("schema registry not configured")
	}

	req, err := http.NewRequestWithContext(ctx, method, baseURL+path, nil)
	if err != nil {
		return nil, fmt.Errorf("schema request: %w", err)
	}

	if username != "" {
		req.SetBasicAuth(username, password)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("schema request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("schema request: read body: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("schema registry error %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// getCtx returns the Wails context or a background context.
func (s *SchemaService) getCtx() context.Context {
	if s.ctx != nil {
		return s.ctx
	}
	return context.Background()
}
