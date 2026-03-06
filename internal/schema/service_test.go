package schema

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetSubjects(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/subjects":
			json.NewEncoder(w).Encode([]string{"user-value", "order-value"})
		case "/subjects/user-value/versions/latest":
			json.NewEncoder(w).Encode(subjectVersionResponse{
				Subject: "user-value", Version: 3, ID: 10, Schema: "{}", SchemaType: "AVRO",
			})
		case "/subjects/order-value/versions/latest":
			json.NewEncoder(w).Encode(subjectVersionResponse{
				Subject: "order-value", Version: 1, ID: 5, Schema: "{}", SchemaType: "JSON",
			})
		case "/config/user-value":
			json.NewEncoder(w).Encode(configResponse{CompatibilityLevel: "BACKWARD"})
		case "/config/order-value":
			json.NewEncoder(w).Encode(configResponse{CompatibilityLevel: "FULL"})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	svc := &SchemaService{
		baseURL:    srv.URL,
		httpClient: srv.Client(),
	}

	subjects, err := svc.GetSubjects()
	if err != nil {
		t.Fatal(err)
	}

	if len(subjects) != 2 {
		t.Fatalf("expected 2 subjects, got %d", len(subjects))
	}

	// Verify first subject
	if subjects[0].Name != "user-value" {
		t.Errorf("expected 'user-value', got %s", subjects[0].Name)
	}
	if subjects[0].LatestVersion != 3 {
		t.Errorf("expected version 3, got %d", subjects[0].LatestVersion)
	}
	if subjects[0].Type != "AVRO" {
		t.Errorf("expected AVRO, got %s", subjects[0].Type)
	}
	if subjects[0].Compatibility != "BACKWARD" {
		t.Errorf("expected BACKWARD, got %s", subjects[0].Compatibility)
	}
}

func TestGetSubjectsEmpty(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode([]string{})
	}))
	defer srv.Close()

	svc := &SchemaService{baseURL: srv.URL, httpClient: srv.Client()}
	subjects, err := svc.GetSubjects()
	if err != nil {
		t.Fatal(err)
	}
	if len(subjects) != 0 {
		t.Fatalf("expected 0 subjects, got %d", len(subjects))
	}
}

func TestGetSubjectsNotConfigured(t *testing.T) {
	svc := &SchemaService{baseURL: "", httpClient: http.DefaultClient}
	subjects, err := svc.GetSubjects()
	if err != nil {
		t.Fatal(err)
	}
	if len(subjects) != 0 {
		t.Fatalf("expected 0 subjects when not configured, got %d", len(subjects))
	}
}

func TestGetSchemaVersions(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/subjects/user-value/versions":
			json.NewEncoder(w).Encode([]int{1, 2, 3})
		case "/subjects/user-value/versions/1":
			json.NewEncoder(w).Encode(subjectVersionResponse{
				Version: 1, ID: 1, Schema: `{"type":"record","name":"User"}`, SchemaType: "AVRO",
			})
		case "/subjects/user-value/versions/2":
			json.NewEncoder(w).Encode(subjectVersionResponse{
				Version: 2, ID: 5, Schema: `{"type":"record","name":"UserV2"}`, SchemaType: "AVRO",
			})
		case "/subjects/user-value/versions/3":
			json.NewEncoder(w).Encode(subjectVersionResponse{
				Version: 3, ID: 10, Schema: `{"type":"record","name":"UserV3"}`, SchemaType: "AVRO",
			})
		}
	}))
	defer srv.Close()

	svc := &SchemaService{baseURL: srv.URL, httpClient: srv.Client()}
	versions, err := svc.GetSchemaVersions("user-value")
	if err != nil {
		t.Fatal(err)
	}
	if len(versions) != 3 {
		t.Fatalf("expected 3 versions, got %d", len(versions))
	}
	if versions[0].Version != 1 {
		t.Errorf("expected version 1, got %d", versions[0].Version)
	}
}

func TestGetSchemaVersion(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(subjectVersionResponse{
			Version: 2, ID: 5, Schema: `{"type":"record"}`, SchemaType: "",
		})
	}))
	defer srv.Close()

	svc := &SchemaService{baseURL: srv.URL, httpClient: srv.Client()}
	ver, err := svc.GetSchemaVersion("test-value", 2)
	if err != nil {
		t.Fatal(err)
	}
	if ver.Version != 2 {
		t.Errorf("expected version 2, got %d", ver.Version)
	}
	// Empty schema type defaults to AVRO
	if ver.Type != "AVRO" {
		t.Errorf("expected AVRO default, got %s", ver.Type)
	}
}

func TestGetCompatibility(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(configResponse{CompatibilityLevel: "FORWARD"})
	}))
	defer srv.Close()

	svc := &SchemaService{baseURL: srv.URL, httpClient: srv.Client()}
	level, err := svc.GetCompatibility("test-value")
	if err != nil {
		t.Fatal(err)
	}
	if level != "FORWARD" {
		t.Errorf("expected FORWARD, got %s", level)
	}
}

func TestBasicAuth(t *testing.T) {
	var gotUser, gotPass string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUser, gotPass, _ = r.BasicAuth()
		json.NewEncoder(w).Encode([]string{})
	}))
	defer srv.Close()

	svc := &SchemaService{
		baseURL:    srv.URL,
		httpClient: srv.Client(),
		username:   "admin",
		password:   "secret",
	}
	svc.GetSubjects()

	if gotUser != "admin" || gotPass != "secret" {
		t.Errorf("expected admin:secret, got %s:%s", gotUser, gotPass)
	}
}

func TestSchemaRegistryError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
		w.Write([]byte(`{"error_code":50001,"message":"Error"}`))
	}))
	defer srv.Close()

	svc := &SchemaService{baseURL: srv.URL, httpClient: srv.Client()}
	_, err := svc.GetSubjects()
	if err == nil {
		t.Fatal("expected error on 500 response")
	}
}
