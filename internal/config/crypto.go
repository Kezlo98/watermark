package config

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const (
	encryptionPrefix = "enc:v1:aes256gcm:"
	keyFileName      = ".config.key"
	keySize          = 32 // AES-256
	nonceSize        = 12 // GCM standard nonce
)

// LoadOrCreateKey reads the encryption key from disk, or generates a new one if absent.
func LoadOrCreateKey(configDir string) ([]byte, error) {
	keyPath := filepath.Join(configDir, keyFileName)

	data, err := os.ReadFile(keyPath)
	if err == nil && len(data) == keySize {
		return data, nil
	}

	// Generate new random key
	key := make([]byte, keySize)
	if _, err := rand.Read(key); err != nil {
		return nil, fmt.Errorf("generate key: %w", err)
	}

	if err := os.WriteFile(keyPath, key, 0600); err != nil {
		return nil, fmt.Errorf("write key file: %w", err)
	}

	return key, nil
}

// Encrypt encrypts plaintext using AES-256-GCM. Returns "enc:v1:aes256gcm:<base64(nonce+ciphertext)>".
func Encrypt(plaintext string, key []byte) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("encrypt: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("encrypt gcm: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("encrypt nonce: %w", err)
	}

	// Seal appends ciphertext to nonce
	sealed := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	encoded := base64.StdEncoding.EncodeToString(sealed)

	return encryptionPrefix + encoded, nil
}

// Decrypt decrypts a value encrypted by Encrypt.
func Decrypt(ciphertext string, key []byte) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	if !IsEncrypted(ciphertext) {
		return ciphertext, nil // return as-is if not encrypted
	}

	encoded := strings.TrimPrefix(ciphertext, encryptionPrefix)
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", fmt.Errorf("decrypt base64: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("decrypt cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("decrypt gcm: %w", err)
	}

	if len(data) < gcm.NonceSize() {
		return "", fmt.Errorf("decrypt: ciphertext too short")
	}

	nonce := data[:gcm.NonceSize()]
	ct := data[gcm.NonceSize():]

	plaintext, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", fmt.Errorf("decrypt: %w", err)
	}

	return string(plaintext), nil
}

// IsEncrypted checks if a string has the encryption prefix.
func IsEncrypted(s string) bool {
	return strings.HasPrefix(s, encryptionPrefix)
}
