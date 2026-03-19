# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WATERMARK APP                            │
│                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐  │
│  │     Frontend (Webview)    │  │     Backend (Go)         │  │
│  │                          │  │                          │  │
│  │  React + TypeScript      │◄─┤  Wails v2 Runtime        │  │
│  │  Vite (bundler)          │  │  IPC Bridge (JSON-RPC)   │  │
│  │  TanStack (data/routing) │─►│                          │  │
│  │  Monaco Editor           │  │  ┌────────────────────┐  │  │
│  │  shadcn/ui + Tailwind    │  │  │ Kafka Service      │  │  │
│  │                          │  │  │ (franz-go)         │  │  │
│  └──────────────────────────┘  │  └────────┬───────────┘  │  │
│                                │           │              │  │
│                                │  ┌────────▼───────────┐  │  │
│                                │  │ Keyring Service    │  │  │
│                                │  │ (go-keyring)       │  │  │
│                                │  └────────────────────┘  │  │
│                                │                          │  │
│                                │  ┌────────────────────┐  │  │
│                                │  │ Update Service     │  │  │
│                                │  │ (go-rocket-update) │  │  │
│                                │  └────────────────────┘  │  │
│                                └──────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────┐
         │  External Systems        │
         │                          │
         │  • Kafka Brokers (9092)  │
         │  • Schema Registry (REST)│
         │  • Update Server (HTTP)  │
         │  • OS Keychain           │
         └──────────────────────────┘
```

## Component Breakdown

### Backend Services (Go)

#### 1. App Core (`app.go`)
- Entry point for Wails application lifecycle
- Manages `context.Context` for runtime method calls
- All public methods auto-exposed to frontend via Wails IPC bridge

#### 2. Kafka Service ✅
- **Library**: `github.com/twmb/franz-go`
- **Responsibilities**:
  - Cluster metadata fetching (brokers, topics, partitions)
  - Message consumption (live-tail, offset-based)
  - Message production
  - Consumer group management (list, describe, reset offsets)
  - ACL management (list, create, delete)
- **Connection management**: Pool of `kgo.Client` instances per cluster profile
- **Error handling**: Typed errors propagated to frontend via Wails

#### 3. Template Service ✅ (NEW)
- **Library**: Custom Go module
- **Responsibilities**:
  - Topic template CRUD operations
  - Template persistence to JSON (`~/.watermark/templates.json`)
  - Glob pattern matching for topic auto-matching
  - File dialog integration for import/export
  - Topic configuration cloning and inheritance
- **Key Components**:
  - `TopicTemplate` data structures with configs, patterns
  - `TemplateStore` per-cluster organization
  - Service classes for CRUD, file operations, matching
- **Integration**: Works with Kafka service for topic operations and config validation

#### 4. Keyring Service (planned)

#### 3. Keyring Service (planned)
- **Library**: `github.com/zalando/go-keyring`
- **Responsibilities**:
  - Store/retrieve SASL passwords from OS keyring
  - macOS → Keychain Access
  - Windows → Credential Manager
- **Security model**: Passwords never leave OS secure storage; only session tokens in memory

#### 4. Schema Registry Client (planned)
- REST client for Confluent Schema Registry API
- CRUD operations for schemas (Avro, JSON Schema, Protobuf)
- Version history and compatibility checks

#### 5. Update Service (planned)
- **Library**: `go-rocket-update`
- **Responsibilities**:
  - Check for new versions on startup / timer
  - Download and apply binary updates
  - Rollback on failure

#### 6. Config Service (planned)
- Manage cluster connection profiles (JSON file)
- Store non-sensitive settings locally
- Reference keyring for credentials

### Frontend Architecture (React + TypeScript)

```
frontend/src/
├── main.tsx                    # React entry point
├── App.tsx                     # Root component with router
├── pages/                      # Page components (extracted for clarity)
│   ├── topics-page.tsx         # Topics index and management ✅
│   ├── dashboard/              # Page 1: Cluster Overview
│   ├── consumers/              # Page 4: Consumer Groups
│   ├── acls/                   # Page 5: ACL Management
│   ├── schemas/                # Page 6: Schema Registry
│   └── settings/               # Page 7: Settings
├── components/                 # Shared UI components
│   ├── templates/              # Template management UI ✅ (653 lines)
│   │   ├── template-list-table.tsx
│   │   ├── save-template-modal.tsx
│   │   ├── template-picker-dropdown.tsx
│   │   └── template-settings-panel.tsx
│   ├── topics/                 # Topic-specific components
│   │   ├── create-topic-modal.tsx
│   │   ├── topic-list-table.tsx
│   │   └── configuration-tab.tsx
│   ├── shared/                 # Shared components
│   ├── ui/                     # shadcn/ui primitives
│   ├── layout/                 # Layout (sidebar, header)
│   └── data/                   # Data display (tables, charts)
├── hooks/                      # Custom React hooks (375 lines)
│   ├── use-templates.ts        # Template data fetching and mutations ✅
│   ├── use-kafka-query.ts      # Kafka operations with TanStack Query
│   ├── use-debounced-value.ts # Debounced input handling ✅
│   └── ...                     # Other utility hooks
├── lib/                        # Utilities and service wrappers
│   ├── wails-client.ts         # Wails Go bindings ✅ extended with templates
│   ├── glob-match.ts          # Glob pattern matching utilities ✅
│   └── ...                     # Other utilities
├── types/                      # TypeScript type definitions
│   └── templates.ts            # Template types ✅ (re-exports Wails models)
└── assets/                     # Static assets
```

#### Data Flow Pattern

```
User Action → React Component → Wails.Call(GoMethod) → Go Service → Kafka/Keyring/HTTP
                                                    ←  JSON Response  ←
              TanStack Query Cache ← Component Re-render
```

#### State Management Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| **Server state** | `@tanstack/react-query` | Kafka data (topics, messages, lag) with polling |
| **Route state** | `@tanstack/react-router` | URL params, search filters |
| **UI state** | React `useState` / `useReducer` | Modal visibility, form inputs |
| **Global state** | React Context | Active cluster, theme preference |

### Communication Layer (Wails IPC)

Wails v2 auto-generates TypeScript bindings for all public Go methods:

```
Go: func (a *App) GetTopics() ([]Topic, error)
    ↓ wails generate
TS: export function GetTopics(): Promise<main.Topic[]>
```

- Located in `frontend/wailsjs/go/main/`
- Type-safe, no manual API layer needed
- Supports `Events` for real-time push (e.g., live-tail messages)

### Security Architecture

```
┌─────────────────────┐
│  Connection Profile  │
│  (JSON file)        │
│                     │
│  broker: xxx:9092   │
│  username: admin    │
│  password_ref: →────┼──► OS Keyring (encrypted)
│  tls_enabled: true  │       ├── macOS Keychain
│  sasl_mechanism:    │       └── Windows Credential Mgr
│    SCRAM-SHA-256    │
└─────────────────────┘
```

- Passwords never stored in config files
- TLS client certificates stored in OS certificate store
- No network requests to external telemetry services

#### AWS MSK IAM Authentication

```
ClusterProfile.SecurityProtocol = "AWS_MSK_IAM"
ClusterProfile.AwsProfile = "staging" (or "" for default chain)
         │
         ▼
aws-sdk-go-v2/config.LoadDefaultConfig()
  → Resolves credentials: env → ~/.aws/credentials → SSO → IAM role
         │
         ▼
franz-go/sasl/aws.ManagedStreamingIAM(callback)
  → Auto-refreshing SASL mechanism + mandatory TLS
```

- No AWS credentials stored in Watermark config — always resolved from AWS credential chain
- Profile discovery parses `~/.aws/config` and `~/.aws/credentials`
- SSO login hint in error messages when credentials fail

### Build & Distribution

```
┌──────────┐     ┌───────────┐     ┌──────────────┐
│ wails dev │────►│ Vite HMR  │────►│ Native app   │
│           │     │ + Go live │     │ (dev mode)   │
└──────────┘     └───────────┘     └──────────────┘

┌────────────┐   ┌───────────┐     ┌──────────────┐
│ wails build│──►│ Vite prod │────►│ .app / .exe  │
│            │   │ + Go bin  │     │ (release)    │
└────────────┘   └───────────┘     └──────────────┘
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | Wails v2 | Native feel, Go backend, small binary size (~15MB) |
| Kafka client | franz-go | Pure Go, no CGo/librdkafka, modern API, maintained |
| Template system | Custom Go/React | Purpose-built for topic configuration management |
| Credential storage | go-keyring | OS-native security, zero config for users |
| Frontend framework | React + TS | Largest ecosystem, strong typing, team familiarity |
| Data grids | TanStack Table | Headless, virtualized, feature-rich |
| Code editor | Monaco | VS Code engine, syntax highlighting, read-only mode |
| UI components | shadcn/ui | Copy-paste ownership, Radix accessibility, Tailwind |
| Auto-update | go-rocket-update | Simple binary replacement, GitHub releases compatible |

## Template Architecture Patterns

### Data Flow for Templates
```
Template Creation → TemplateService.save() → JSON persistence → UI refresh
Topic Creation → TemplatePicker.select() → Template.apply() → KafkaService.createTopic()
Topic Cloning → Topic.clone() → Template.fromTopic() → KafkaService.createTopic()
Template Import → FileDialog.open() → TemplateService.import() → Merge with existing
```

### Template Storage Architecture
```
~/.watermark/templates.json
{
  "version": 1,
  "templates": {
    "cluster-1": {
      "template-id-1": {
        "id": "template-id-1",
        "name": "User Events Template",
        "pattern": "user-events-*",
        "partitions": 3,
        "replicationFactor": 2,
        "configs": {"retention.ms": "86400000"},
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    }
  }
}
```
