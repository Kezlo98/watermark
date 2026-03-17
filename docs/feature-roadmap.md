# 🌊 Watermark — Feature Roadmap

## Current State

### ✅ Shipped Features

| Area | Details |
|------|---------|
| **Dashboard** | Cluster health metrics, broker table, controller highlight |
| **Topics Index** | Searchable grid, create/delete, hide internal toggle |
| **Topic Detail** | 5 tabs: Messages, Consumers, Partitions, Config, ACLs |
| **Messages** | Live-tail, produce, Monaco inspector, filters (offset/date/body) |
| **Consumer Groups** | Index + detail with lag, members, reset offsets, drop group |
| **Schema Registry** | Subject list, version history, compatibility badge, Monaco viewer |
| **Settings** | Clusters (SASL/SCRAM/SSL/AWS MSK IAM), appearance, import/export |
| **Annotations** | Topic ownership tagging, batch tag, import/export, cross-cluster portability |
| **Auto-Update** | Version check, apply update, update banner |
| **Search Palette** | ⌘K spotlight across topics, groups, schemas, annotations |
| **Secure Storage** | OS keyring integration (macOS Keychain / Windows Credential Manager) |
| **Consumer Lag Alerting** | Configurable thresholds, bell icon, notification panel, OS notifications, glob pattern matching |

---

## Feature Roadmap (Prioritized)

### Tier 1 — Build Next (High Priority)

| # | Feature | Effort | Impact | Status |
|---|---------|--------|--------|--------|
| 1 | 🔔 [Consumer Lag Alerting](#1--consumer-lag-alerting) | ~1.5 wk | Very High | ✅ Done |
| 2 | 📝 [Message Replay Tool](#2--message-replay--re-produce-tool) | ~1 wk | High | ✅ Done |
| 3 | 📋 [Topic Templates & Cloning](#3--topic-templates--cloning) | ~1 wk | Medium-High | ✅ Done |
| 4 | 🌙 [Light Theme & Theme Engine](#4--light-theme--theme-engine) | ~1 wk | Medium | ⬜ Not Started |
| 5 | 🔄 [Multi-Cluster Operations](#5--multi-cluster-operations) | ~3 wk | High | ⬜ Not Started |
| 6 | 📦 [Bookmarks & Collections](#6--bookmarks--collections) | ~1 wk | Medium | ⬜ Not Started |

### Tier 2 — Medium Priority

| # | Feature | Effort | Impact | Status |
|---|---------|--------|--------|--------|
| 7 | 📊 [Broker Metrics Visualizer](#7--broker-metrics--partition-rebalance-visualizer) | ~2 wk | High | ⬜ Not Started |
| 8 | 💬 [Message Deserialization Plugins](#8--message-deserialization-plugins) | ~2 wk | High | ⬜ Not Started |
| 9 | 🔐 [ACL Management (CRUD)](#9--acl-management-crud) | ~1.5 wk | Medium-High | ⬜ Not Started |
| 10 | 🔍 [Topic Data Lineage View](#10--topic-data-lineage-view) | ~1.5 wk | Medium-High | ⬜ Not Started |
| 11 | 🧪 [Message Diff Comparator](#11--message-diff-comparator) | ~1 wk | Medium | ⬜ Not Started |
| 12 | 📱 [Compact / Focus Mode](#12--compact--focus-mode) | ~1.5 wk | Medium | ⬜ Not Started |

### Tier 3 — Future Vision

| # | Feature | Effort | Impact | Status |
|---|---------|--------|--------|--------|
| 13 | 📡 [Kafka Connect Integration](#13--kafka-connect-integration) | ~3 wk | High | ⬜ Not Started |
| 14 | 🤖 [AI-Powered Message Analyzer](#14--ai-powered-message-analyzer) | ~3-4 wk | Moonshot | ⬜ Not Started |
| 15 | 🧰 [CLI Companion](#15--cli-companion) | ~2-3 wk | Medium-High | ⬜ Not Started |

---

## Feature Details

### 1. 🔔 Consumer Lag Alerting

> ✅ **Shipped** — Branch: `feat/consumer-lag-alerting`

- Set lag threshold per consumer group via glob patterns (warning / critical)
- Bell icon with unread badge in header, notification dropdown panel
- OS notifications via beeep (debounced per breach cycle)
- Alert indicators (🟡/🔴) in consumer group table
- Set Alert popover on consumer group detail page
- Settings → Alerts tab with rule management and live pattern preview

### 2. 📝 Message Replay / Re-produce Tool

> ✅ **Shipped** — Branch: `feat/message-replay-tool`

- Right-click message in browser → "Replay to Topic"
- Edit key / value / headers before replay
- Replay to same topic or different topic
- Batch replay (select multiple messages)

### 3. 📋 Topic Templates & Cloning

> Clone = copy configs + create. Annotations store templates naturally.

- Save topic config as reusable template
- Clone existing topic to new name (with all configs)
- Template library per cluster (stored in annotations)
- "Compare with template" — show config drift

### 4. 🌙 Light Theme & Theme Engine

> Settings already have theme toggle. Polish light mode + accent customization.

- Polished light mode (full pass over all components)
- Custom accent color picker (beyond purple #8B5CF6)
- Community theme sharing (export / import theme JSON)

### 5. 🔄 Multi-Cluster Operations

> Teams manage dev / staging / prod. Cross-cluster ops save time.

- Side-by-side cluster comparison (topic lists, configs)
- Topic migration wizard (create topic with same config on another cluster)
- Cross-cluster message copy
- Unified search across all connected clusters

### 6. 📦 Bookmarks & Collections

> Power user retention through quick-access favorites.

- Bookmark topics, consumer groups, or specific messages
- Create named collections (e.g., "Payment Pipeline", "User Events")
- Quick-access panel in sidebar
- Persistent across sessions

### 7. 📊 Broker Metrics & Partition Rebalance Visualizer

> Dashboard lacks throughput insights. Add sparklines + heatmaps.

- Per-broker bytes-in / bytes-out rate (sparkline charts)
- Partition distribution heatmap (detect hot brokers)
- Under-replicated partition alerts
- Disk usage trend (last 1h / 12h / 24h)

### 8. 💬 Message Deserialization Plugins

> Current format selector is static. Teams use custom serializers.

- Schema-aware deserialization (link topic → schema subject)
- Protobuf `.proto` file import for offline decoding
- Custom JS-based deserializer scripts (user-defined transform)
- Header-based auto-detection (e.g., `content-type` header)

### 9. 🔐 ACL Management (CRUD)

> Current ACL tab is read-only. Full CRUD completes admin story.

- Create / delete ACL rules from UI
- Bulk ACL import / export
- ACL audit trail (who changed what)
- Template-based ACL creation ("Standard Consumer", "Standard Producer")

### 10. 🔍 Topic Data Lineage View

> Annotations track producers / consumers. Visualize as a graph.

- Directed graph: Producer → Topic → Consumer (D3.js or Mermaid)
- Click node → navigate to topic detail or annotation
- Auto-discovered from annotation metadata
- Export as SVG / PNG

### 11. 🧪 Message Diff Comparator

> Compare two messages side-by-side for debugging.

- Select 2 messages → visual JSON diff (Monaco diff editor)
- Cross-topic comparison (input vs output of a processor)
- Highlight added / removed / changed fields

### 12. 📱 Compact / Focus Mode

> Small screen / multi-window friendly.

- Collapsible sidebar (icon-only mode)
- Floating mini-window (always-on-top lag monitor)
- Detachable tabs (pop out message browser)

### 13. 📡 Kafka Connect Integration

> Out of scope for Phase 1, but #1 requested feature in competitor tools.

- Connector list + status dashboard
- Create / update / pause / resume connectors
- Connector config editor with validation
- Task failure monitoring

### 14. 🤖 AI-Powered Message Analyzer

> Local LLM integration for message pattern analysis.

- "Explain this message" — auto-describe JSON structure
- Anomaly detection (flag unusual schema changes)
- Generate sample messages from schema
- Natural language search ("find messages where user.age > 30")

### 15. 🧰 CLI Companion

> Terminal users who share config with the GUI.

- `watermark topics list`, `watermark consume --topic X`
- Shares connection profiles from GUI config
- JSON / table output formatting
- Pipe-friendly for automation

---

## Priority Matrix

```
                    HIGH IMPACT
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
     │  [1] Lag Alerts✅│ [7] Broker Viz   │
     │  [2] Replay      │ [8] Deser.Plugin │
     │  [5] Multi-Clust │ [13] K.Connect   │
     │  [9] ACL CRUD    │                  │
     │                  │                  │
LOW ─┼──────────────────┼──────────────────┼─ HIGH
EFFORT                  │                  EFFORT
     │                  │                  │
     │  [6] Bookmarks   │ [14] AI Analyzer │
     │  [3] Templates   │ [15] CLI         │
     │  [4] Light Theme │ [10] Data Lineage│
     │  [11] Msg Diff   │                  │
     │  [12] Focus Mode │                  │
     │                  │                  │
     └──────────────────┼──────────────────┘
                        │
                    LOW IMPACT
```

---

## Resolved Questions

| # | Question | Decision |
|---|----------|----------|
| 1 | Linux build? | **Skip for now.** macOS + Windows only. |
| 2 | Performance at scale (10k+ topics)? | **Defer.** TanStack Virtual handles large lists. Server-side pagination when needed. YAGNI. |
| 3 | Multi-user collaboration? | **Future goal.** Keep personal-only for OSS initially. Shared annotation DB later. |
| 4 | Plugin architecture? | **Think about later.** Config-based approach first. |
