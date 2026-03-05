# Deployment Guide

## Prerequisites

### Development Environment

| Tool | Version | Install |
|------|---------|---------|
| **Go** | ≥ 1.23 | [go.dev/dl](https://go.dev/dl/) |
| **Node.js** | ≥ 18 LTS | [nodejs.org](https://nodejs.org/) |
| **Wails CLI** | v2 | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| **Git** | Latest | Pre-installed on macOS; [git-scm.com](https://git-scm.com/) |

### macOS-Specific
- Xcode Command Line Tools: `xcode-select --install`
- Apple Developer account (for code signing and notarization)

### Windows-Specific
- WebView2 Runtime (usually pre-installed on Windows 11)
- Code signing certificate (optional, for distribution)

## Local Development

### First-Time Setup

```bash
# Clone repository
git clone <repo-url>
cd watermark

# Install frontend dependencies
cd frontend && npm install && cd ..

# Verify Wails environment
wails doctor
```

### Development Mode

```bash
# Start with hot-reload (frontend + backend)
wails dev
```

This starts:
1. Vite dev server for frontend HMR
2. Go backend with auto-rebuild on changes
3. Native window with embedded webview

**Browser access**: `http://localhost:34115` (for devtools-based Go method testing)

### Frontend-Only Dev

```bash
cd frontend
npm run dev
```

Useful for pure UI work without Go backend (Wails bindings will be undefined).

## Building for Production

### macOS Build

```bash
# Build .app bundle
wails build

# Output: build/bin/watermark-01.app
```

#### Code Signing & Notarization (macOS)

```bash
# Sign the app
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: <YOUR_TEAM>" \
  build/bin/watermark-01.app

# Create ZIP for notarization
ditto -c -k --keepParent build/bin/watermark-01.app watermark.zip

# Submit for notarization
xcrun notarytool submit watermark.zip \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait

# Staple the ticket
xcrun stapler staple build/bin/watermark-01.app
```

### Windows Build

```bash
# Build .exe
wails build

# Output: build/bin/watermark-01.exe
```

### Cross-Compilation

Wails currently does **not** support cross-compilation. Build on the target platform:
- macOS → build on macOS
- Windows → build on Windows

## CI/CD Pipeline (GitHub Actions)

### Recommended Workflow Structure

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: go install github.com/wailsapp/wails/v2/cmd/wails@latest
      - run: cd frontend && npm install
      - run: wails build
      # Code signing + notarization steps
      # Upload artifact

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: go install github.com/wailsapp/wails/v2/cmd/wails@latest
      - run: cd frontend && npm install
      - run: wails build
      # Upload artifact

  release:
    needs: [build-macos, build-windows]
    runs-on: ubuntu-latest
    steps:
      # Download artifacts
      # Create GitHub Release
      # Upload binaries
```

## Auto-Update Distribution

### go-rocket-update Setup

The app uses `go-rocket-update` to check for and apply binary updates:

1. **Update server**: GitHub Releases (or custom HTTP server)
2. **Version manifest**: JSON file listing latest version + download URLs
3. **Update flow**:
   - App checks manifest URL on startup + every N hours
   - If newer version found, prompt user
   - Download binary, verify checksum, replace current binary
   - Restart app

### Release Artifacts

Each release should include:
```
watermark-v1.0.0-darwin-amd64.zip    # macOS Intel
watermark-v1.0.0-darwin-arm64.zip    # macOS Apple Silicon
watermark-v1.0.0-windows-amd64.zip   # Windows x64
manifest.json                         # Version manifest for auto-updater
```

## Environment Configuration

### Config File Location

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/watermark/config.json` |
| Windows | `%APPDATA%\watermark\config.json` |

### Config Structure

```json
{
  "clusters": [
    {
      "name": "Production",
      "bootstrap_servers": "kafka.prod:9092",
      "sasl_mechanism": "SCRAM-SHA-256",
      "username": "admin",
      "password_ref": "keyring://watermark/production",
      "tls_enabled": true,
      "color_tag": "red",
      "read_only": true,
      "schema_registry": {
        "url": "https://schema-registry.prod:8081",
        "username": "sr-admin",
        "password_ref": "keyring://watermark/production-sr"
      }
    }
  ],
  "preferences": {
    "theme": "dark",
    "density": "comfortable",
    "editor_font": "JetBrains Mono",
    "editor_font_size": 14,
    "launch_on_startup": false,
    "minimize_to_tray": true,
    "polling_interval_ms": 10000
  }
}
```

### Credentials

Passwords stored in OS keyring (never in config file):
- **macOS**: Keychain Access → `watermark/<profile-name>`
- **Windows**: Credential Manager → `watermark/<profile-name>`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `wails dev` fails | Run `wails doctor` to check dependencies |
| WebView2 missing (Windows) | Install from [developer.microsoft.com](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) |
| Frontend not loading | Check `cd frontend && npm install` completed |
| Go build errors | Verify Go 1.23+ and run `go mod tidy` |
| Keyring access denied | Grant app access in macOS Security & Privacy |
| Notarization fails | Verify Apple Developer ID and app-specific password |
