package config

import (
	"crypto/rand"
	"strings"
	"testing"
)

func TestEncryptDecryptRoundTrip(t *testing.T) {
	tests := []struct {
		name      string
		plaintext string
	}{
		{"simple", "password123"},
		{"empty", ""},
		{"unicode", "pässwörd"},
		{"long", strings.Repeat("a", 1000)},
		{"special_chars", "p@ss!w0rd#$%^&*()"},
		{"json_like", `{"key": "value", "nested": {"a": 1}}`},
		{"newlines", "line1\nline2\nline3"},
	}

	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		t.Fatal(err)
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encrypted, err := Encrypt(tt.plaintext, key)
			if err != nil {
				t.Fatalf("encrypt error: %v", err)
			}

			// Empty strings return empty (no encryption applied)
			if tt.plaintext == "" {
				if encrypted != "" {
					t.Fatal("expected empty encrypted output for empty input")
				}
				return
			}

			if !IsEncrypted(encrypted) {
				t.Fatalf("expected encrypted prefix, got: %s", encrypted)
			}

			decrypted, err := Decrypt(encrypted, key)
			if err != nil {
				t.Fatalf("decrypt error: %v", err)
			}

			if decrypted != tt.plaintext {
				t.Fatalf("round-trip mismatch: got %q, want %q", decrypted, tt.plaintext)
			}
		})
	}
}

func TestIsEncrypted(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"enc:v1:aes256gcm:abc123", true},
		{"enc:v1:aes256gcm:", true},
		{"plaintext", false},
		{"", false},
		{"enc:v2:something", false},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			if got := IsEncrypted(tt.input); got != tt.expected {
				t.Errorf("IsEncrypted(%q) = %v, want %v", tt.input, got, tt.expected)
			}
		})
	}
}

func TestDecryptPlaintext(t *testing.T) {
	key := make([]byte, 32)
	rand.Read(key)

	// Should return plaintext as-is if not encrypted
	result, err := Decrypt("not-encrypted", key)
	if err != nil {
		t.Fatal(err)
	}
	if result != "not-encrypted" {
		t.Fatalf("expected plaintext pass-through, got %q", result)
	}
}

func TestDecryptInvalidCiphertext(t *testing.T) {
	key := make([]byte, 32)
	rand.Read(key)

	_, err := Decrypt("enc:v1:aes256gcm:!!!invalid-base64!!!", key)
	if err == nil {
		t.Fatal("expected error for invalid ciphertext")
	}
}

func TestDecryptWrongKey(t *testing.T) {
	key1 := make([]byte, 32)
	key2 := make([]byte, 32)
	rand.Read(key1)
	rand.Read(key2)

	encrypted, err := Encrypt("secret", key1)
	if err != nil {
		t.Fatal(err)
	}

	_, err = Decrypt(encrypted, key2)
	if err == nil {
		t.Fatal("expected error when decrypting with wrong key")
	}
}

func TestLoadOrCreateKey(t *testing.T) {
	dir := t.TempDir()

	// First call: generates key
	key1, err := LoadOrCreateKey(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(key1) != 32 {
		t.Fatalf("expected 32-byte key, got %d bytes", len(key1))
	}

	// Second call: loads same key
	key2, err := LoadOrCreateKey(dir)
	if err != nil {
		t.Fatal(err)
	}
	if string(key1) != string(key2) {
		t.Fatal("expected same key on second load")
	}
}

func TestEncryptUniqueness(t *testing.T) {
	key := make([]byte, 32)
	rand.Read(key)

	// Same plaintext, different ciphertexts (different nonces)
	e1, _ := Encrypt("same", key)
	e2, _ := Encrypt("same", key)

	if e1 == e2 {
		t.Fatal("expected different ciphertexts for same plaintext (nonce should differ)")
	}
}
