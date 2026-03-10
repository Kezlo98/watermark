package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParseAWSFile(t *testing.T) {
	t.Run("config file with profile sections", func(t *testing.T) {
		dir := t.TempDir()
		configPath := filepath.Join(dir, "config")
		content := `[default]
region = us-east-1

[profile staging]
region = us-west-2

[profile production]
region = eu-west-1
`
		if err := os.WriteFile(configPath, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}

		seen := map[string]bool{"default": true}
		profiles := []string{"(Default)"}
		parseAWSFile(configPath, true, seen, &profiles)

		want := []string{"(Default)", "staging", "production"}
		if len(profiles) != len(want) {
			t.Fatalf("got %d profiles, want %d: %v", len(profiles), len(want), profiles)
		}
		for i, p := range want {
			if profiles[i] != p {
				t.Errorf("profiles[%d] = %q, want %q", i, profiles[i], p)
			}
		}
	})

	t.Run("credentials file with plain sections", func(t *testing.T) {
		dir := t.TempDir()
		credsPath := filepath.Join(dir, "credentials")
		content := `[default]
aws_access_key_id = AKIA...

[dev-account]
aws_access_key_id = AKIA...

[staging]
aws_access_key_id = AKIA...
`
		if err := os.WriteFile(credsPath, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}

		seen := map[string]bool{"default": true}
		profiles := []string{"(Default)"}
		parseAWSFile(credsPath, false, seen, &profiles)

		want := []string{"(Default)", "dev-account", "staging"}
		if len(profiles) != len(want) {
			t.Fatalf("got %d profiles, want %d: %v", len(profiles), len(want), profiles)
		}
		for i, p := range want {
			if profiles[i] != p {
				t.Errorf("profiles[%d] = %q, want %q", i, profiles[i], p)
			}
		}
	})

	t.Run("missing file returns unchanged slice", func(t *testing.T) {
		seen := map[string]bool{"default": true}
		profiles := []string{"(Default)"}
		parseAWSFile("/nonexistent/path/config", true, seen, &profiles)

		if len(profiles) != 1 || profiles[0] != "(Default)" {
			t.Errorf("expected only (Default), got %v", profiles)
		}
	})

	t.Run("deduplicates across config and credentials", func(t *testing.T) {
		dir := t.TempDir()

		configPath := filepath.Join(dir, "config")
		os.WriteFile(configPath, []byte("[profile shared]\nregion = us-east-1\n"), 0644)

		credsPath := filepath.Join(dir, "credentials")
		os.WriteFile(credsPath, []byte("[shared]\naws_access_key_id = AKIA...\n"), 0644)

		seen := map[string]bool{"default": true}
		profiles := []string{"(Default)"}
		parseAWSFile(configPath, true, seen, &profiles)
		parseAWSFile(credsPath, false, seen, &profiles)

		// "shared" should appear only once
		want := []string{"(Default)", "shared"}
		if len(profiles) != len(want) {
			t.Fatalf("got %d profiles, want %d: %v", len(profiles), len(want), profiles)
		}
	})

	t.Run("empty file returns unchanged slice", func(t *testing.T) {
		dir := t.TempDir()
		configPath := filepath.Join(dir, "config")
		os.WriteFile(configPath, []byte(""), 0644)

		seen := map[string]bool{"default": true}
		profiles := []string{"(Default)"}
		parseAWSFile(configPath, true, seen, &profiles)

		if len(profiles) != 1 {
			t.Errorf("expected only (Default), got %v", profiles)
		}
	})
}
