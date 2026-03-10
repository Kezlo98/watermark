# Development Roadmap

## Status Legend

| Icon | Status |
|------|--------|
| ⬜ | Not Started |
| 🔵 | In Progress |
| ✅ | Complete |
| ⏸️ | Blocked / Paused |

---

## Phase 0: Project Bootstrap ✅

**Status**: Complete | **ETA**: Done

- [x] Initialize Wails v2 project with React-TS template
- [x] Configure `wails.json`, `go.mod`, `package.json`
- [x] Create dashboard UI mockup (`docs/mock/dashboard_mock.html`)
- [x] Set up Git repository and `.gitignore`
- [x] Create initial project documentation

---

## Phase 1: Foundation & Design System ⬜

**Status**: Not Started | **ETA**: 1 week

### 1.1 Frontend Tooling Upgrade
- [ ] Upgrade Vite, React 18, TypeScript to latest stable
- [ ] Install and configure Tailwind CSS v3+
- [ ] Install shadcn/ui CLI and initialize component library
- [ ] Install `lucide-react`, `clsx`, `tailwind-merge`
- [ ] Configure Tailwind with design tokens (colors, fonts, border-radius)
- [ ] Import Google Fonts (Inter, JetBrains Mono)

### 1.2 Routing & Layout Shell
- [ ] Install `@tanstack/react-router`
- [ ] Define 7 routes: `/`, `/topics`, `/topics/:id`, `/consumers`, `/consumers/:id`, `/schemas`, `/settings`
- [ ] Build `AppLayout` component (sidebar + header + main content)
- [ ] Build `Sidebar` with navigation links and active state
- [ ] Build `AppHeader` with cluster selector, search bar, action buttons
- [ ] Implement glass-panel and glass-sidebar CSS

### 1.3 Shared Components
- [ ] `StatusBadge` — colored dot + label for Healthy/Rebalancing/Dead/Empty
- [ ] `MetricCard` — glass panel with icon, value, trend
- [ ] `SearchInput` — global search with Cmd+K shortcut
- [ ] `DataTable` wrapper around @tanstack/react-table
- [ ] `TabNavigation` — horizontal and vertical tab variants

---

## Phase 2: Backend Kafka Core ⬜

**Status**: Not Started | **ETA**: 2 weeks

### 2.1 Kafka Service Setup
- [ ] Add `github.com/twmb/franz-go` to `go.mod`
- [ ] Create `internal/kafka/service.go` — KafkaService struct with client pool
- [ ] Implement connection lifecycle (connect, disconnect, health check)
- [ ] Error handling with typed errors for frontend consumption

### 2.2 Cluster Operations
- [ ] `GetClusterHealth()` — broker count, controller ID, cluster status
- [ ] `GetBrokers()` — list brokers with host, port, rack, disk size
- [ ] `GetTopics()` — list all topics with metadata
- [ ] `GetTopic(name)` — single topic detail with partitions, replicas, configs

### 2.3 Config Service
- [ ] Create `internal/config/service.go`
- [ ] Connection profile CRUD (JSON file storage)
- [ ] Non-sensitive settings (theme, density, polling interval)
- [ ] Color tag per cluster profile
- [ ] Read-only mode flag per profile

### 2.4 Keyring Service
- [ ] Add `github.com/zalando/go-keyring` to `go.mod`
- [ ] Create `internal/keyring/service.go`
- [ ] Store/retrieve SASL passwords by profile name
- [ ] Handle keyring unavailability gracefully

---

## Phase 3: Page 1 — Cluster Overview ⬜

**Status**: Not Started | **ETA**: 1 week

- [ ] Hero metrics: Cluster Status, Total Brokers, Total Topics, Total Partitions
- [ ] Brokers table: Broker ID, Host/IP, Port, Rack, Data Size on Disk
- [ ] Highlight Active Controller broker row
- [ ] Install `@tanstack/react-query`, configure QueryClient with default polling
- [ ] Wire `GetClusterHealth()` and `GetBrokers()` to frontend via react-query
- [ ] Auto-refresh every 10s

---

## Phase 4: Page 2 — Topics Index ⬜

**Status**: Not Started | **ETA**: 1 week

- [ ] Install `@tanstack/react-table`
- [ ] Searchable data grid: Topic Name, Partitions, Replicas, Size, Retention
- [ ] "Hide Internal Topics" toggle (filters `__consumer_offsets`, `__transaction_state`)
- [ ] `[+ Create Topic]` button → modal with name, partitions, replicas, retention inputs
- [ ] Sortable columns, keyboard navigation
- [ ] Navigate to Topic Detail on row click

---

## Phase 5: Page 3 — Topic Detail ⬜

**Status**: Not Started | **ETA**: 2 weeks

### 5.1 Tab 1 — Messages
- [ ] Install `@tanstack/react-virtual` and `@monaco-editor/react`
- [ ] Start offset / timestamp selector
- [ ] Format selector dropdown (Auto, String, JSON, Avro, Protobuf, Hex)
- [ ] JSON/Text filter input
- [ ] Live-tail virtualized grid (capped at 100 latest messages)
- [ ] Click row → JSON inspector pane (Monaco, read-only)
- [ ] `[+ Produce Message]` button → modal (partition, key, value, headers)

### 5.2 Tab 2 — Consumers
- [ ] List consumer groups reading this topic
- [ ] Display per-group total lag

### 5.3 Tab 3 — Partitions
- [ ] Table: Partition ID, Leader Broker, Replicas, ISR, Low/High Watermarks
- [ ] Highlight rows where ISR count ≠ Replica count (red tint)

### 5.4 Tab 4 — Configuration
- [ ] Table of topic-level configs (e.g., `retention.ms`, `cleanup.policy`)
- [ ] Visual distinction: overridden configs vs cluster defaults (primary border + tint)

### 5.5 Tab 5 — ACL
- [ ] Read-only list of ACL entries for this topic
- [ ] Show principal, operation, permission type

---

## Phase 6: Pages 4 & 5 — Consumer Groups ⬜

**Status**: Not Started | **ETA**: 1.5 weeks

### 6.1 Page 4 — Consumer Groups Index
- [ ] Searchable data grid: Group ID, State, Members Count, Total Lag
- [ ] State badges: 🟢 Stable, 🟡 Rebalancing, 🔴 Dead, ⚪ Empty
- [ ] Lag cell: red + bold text when lag > 0
- [ ] Navigate to detail on row click

### 6.2 Page 5 — Consumer Group Detail
- [ ] Header stats: State badge, Coordinator Broker
- [ ] Section 1 — Active Members table: Client ID, Host IP, Assigned Partitions
- [ ] Tooltip on Host IP: "Network topography or NAT gateways might mask the true pod IP"
- [ ] Section 2 — Offsets & Lag: Topic, Partition, Current Offset, End Offset, Lag
- [ ] `[⏪ Reset Offsets]` button — disabled with tooltip if group state is Active
- [ ] Backend: `ResetConsumerGroupOffsets()` method (only when Empty/Dead)

---

## Phase 7: Page 6 — Schema Registry ⬜

**Status**: Not Started | **ETA**: 1 week

- [ ] Backend: Schema Registry REST client (`internal/schema/service.go`)
- [ ] Left pane: scrollable subject list
- [ ] Right pane: version selector dropdown + compatibility level badge
- [ ] Monaco Editor (read-only) for schema definition
- [ ] Support Avro, JSON Schema, Protobuf display

---

## Phase 8: Page 7 — Settings ⬜

**Status**: Not Started | **ETA**: 1.5 weeks

### 8.1 Tab 1 — Clusters (Connection Manager)
- [ ] Saved clusters list: View, Edit, Duplicate, Delete
- [ ] Cluster form: Profile Name, Bootstrap Servers
- [ ] Color Tag picker (tints header navbar as safety warning)
- [ ] Read-Only Mode toggle
- [ ] Auth dropdown: None, SASL/PLAIN, SASL/SCRAM, SSL, AWS_MSK_IAM
- [ ] AWS Profile dropdown (visible when AWS_MSK_IAM selected)
- [ ] Schema Registry URL + independent auth credentials
- [ ] `[Test Connection]` button → validates credentials before save

### 8.2 Tab 2 — Appearance & Editor
- [ ] Theme switcher: Light / Dark / System Default
- [ ] UI Density: Compact / Comfortable / Spacious
- [ ] Editor Font Family input (custom monospace)
- [ ] Font Size slider (12px–16px)

### 8.3 Tab 3 — Data & System
- [ ] Export config to `.json` file (with/without passwords toggle)
- [ ] Import config from `.json` file
- [ ] "Launch on system startup" toggle
- [ ] "Minimize to tray on close" toggle

---

## Phase 9: Auto-Update ⬜

**Status**: Not Started | **ETA**: 0.5 week

- [ ] Add `go-rocket-update` to `go.mod`
- [ ] Create `internal/updater/service.go`
- [ ] Check for updates on app launch + periodic timer
- [ ] Download + apply binary update with progress indicator
- [ ] Rollback on failure
- [ ] Settings integration: update channel, check frequency

---

## Phase 10: Polish & Release ⬜

**Status**: Not Started | **ETA**: 1 week

- [ ] Error boundary components at page level
- [ ] Toast notification system (connection errors, actions)
- [ ] Keyboard shortcuts (Cmd+K search, Esc close modals)
- [ ] Loading skeletons for all data-dependent views
- [ ] Performance audit: memory usage, render counts
- [ ] macOS code signing and notarization
- [ ] Windows code signing
- [ ] GitHub Releases CI/CD pipeline
- [ ] End-to-end testing of all 7 pages

---

## Timeline Summary

| Phase | Description | Duration | Cumulative |
|-------|-------------|----------|------------|
| 0 | Bootstrap | — | Done |
| 1 | Foundation & Design System | 1 wk | 1 wk |
| 2 | Backend Kafka Core | 2 wk | 3 wk |
| 3 | Dashboard | 1 wk | 4 wk |
| 4 | Topics Index | 1 wk | 5 wk |
| 5 | Topic Detail | 2 wk | 7 wk |
| 6 | Consumer Groups | 1.5 wk | 8.5 wk |
| 7 | Schema Registry | 1 wk | 9.5 wk |
| 8 | Settings | 1.5 wk | 11 wk |
| 9 | Auto-Update | 0.5 wk | 11.5 wk |
| 10 | Polish & Release | 1 wk | 12.5 wk |

**Estimated MVP delivery: ~12-13 weeks from Phase 1 start**
