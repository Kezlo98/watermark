# Watermark — Project Overview & PDR

## Product Vision

**Watermark** is a premium, native desktop GUI for Apache Kafka cluster management. It targets developers, DevOps engineers, and SREs who need a fast, local tool for inspecting topics, browsing messages, monitoring consumer lag, and managing schemas — without spinning up Docker containers or relying on web-based UIs.

## Problem Statement

Existing Kafka management tools suffer from:
1. **Heavy setup** — Most require Docker/JVM and are web-based (Kafka UI, Conduktor)
2. **No native feel** — Web apps lack native keyboard shortcuts, system integration, performance
3. **C-binding pain** — Many Go clients require `librdkafka` (CGo) leading to build issues
4. **Insecure credentials** — Password storage in plain text config files

## Solution

A lightweight, native desktop app built with:
- **Wails v2** for native window management with embedded webview
- **franz-go** for pure-Go Kafka connectivity (no C-bindings)
- **go-keyring** for OS-level secure credential storage
- **go-rocket-update** for seamless auto-updates

## Target Users

| Persona | Needs |
|---------|-------|
| **Backend Developer** | Browse messages, test topic configs, inspect schemas |
| **DevOps / SRE** | Monitor broker health, consumer lag, partition balance |
| **Platform Engineer** | Manage ACLs, configure topics, troubleshoot connectivity |
| **Data Engineer** | Explore message schemas, validate data pipelines |

## Target Platforms

- **macOS** (primary, Apple Silicon + Intel)
- **Windows** (secondary, via WebView2)

## Core Features (MVP — 7 Pages)

### Page 1: Cluster Overview (Dashboard)
- **Hero Metrics**: Cluster Status (🟢 Healthy), Total Brokers, Total Topics, Total Partitions
- **Brokers Table**: Broker ID, Host/IP, Port, Rack, Kafka Data Size on Disk per broker
- **Controller Highlight**: Active Controller node visually distinguished

### Page 2: Topics Index
- **Controls**: Search bar, "Hide Internal Topics" toggle (hides `__consumer_offsets`), `[+ Create Topic]` button
- **Data Table**: Topic Name, Partitions, Replicas, Size on Disk, Retention Policy
- Sortable columns, row click navigates to Topic Detail

### Page 3: Topic Detail (5 Tabs)
- **Global Action**: `[+ Produce Message]` button → modal (partition selector, Key/Value inputs, headers injection)
- **Tab 1 — Messages**: Start offset/timestamp selector, JSON/Text filter, Format selector (Auto, String, JSON, Avro, Protobuf, Hex). Live-tail grid capped at 100 messages. Click row → Monaco JSON inspector pane
- **Tab 2 — Consumers**: Consumer groups reading this topic with per-group total lag
- **Tab 3 — Partitions**: Partition ID, Leader Broker, Replicas, ISR, Low/High Watermarks. Highlight ISR ≠ Replicas
- **Tab 4 — Configuration**: Topic configs table with visual distinction for overridden vs. cluster defaults
- **Tab 5 — ACL**: Read-only list of Read/Write permissions per principal

### Page 4: Consumer Groups Index
- **Controls**: Search bar
- **Data Table**: Group ID, State (🟢 Stable, 🟡 Rebalancing, 🔴 Dead, ⚪ Empty), Members Count, Total Lag
- Lag cell: red + bold when lag > 0

### Page 5: Consumer Group Detail
- **Header Stats**: State badge, Coordinator Broker
- **Section 1 — Active Members**: Client ID, Host IP (with NAT gateway tooltip), Assigned Partitions
- **Section 2 — Offsets & Lag**: Topic, Partition, Current Offset, End Offset, Lag
- **Actions**: `[⏪ Reset Offsets]` — disabled with tooltip when group is Active; only works when Empty/Dead

### Page 6: Schema Registry
- **Left Pane**: Scrollable subject (schema) list
- **Right Pane**: Version selector dropdown, Compatibility Level badge (BACKWARD, FORWARD, FULL)
- **Viewer**: Read-only Monaco Editor for raw schema definition (Avro, JSON Schema, Protobuf)

### Page 7: Global Settings (Full-Screen Overlay, Left-Tab Navigation)
- **Tab 1 — Clusters**: Saved cluster profiles (View/Edit/Duplicate/Delete), Bootstrap Servers, Color Tag (e.g., red for Production → tints top navbar), Read-Only Mode toggle, SASL/SSL auth dropdown, Schema Registry URL + auth, `[Test Connection]` button
- **Tab 2 — Appearance & Editor**: Theme (Light/Dark/System), UI Density (Compact/Comfortable/Spacious), Editor Font Family + Size slider (12–16px)
- **Tab 3 — Data & System**: Import/Export config to `.json` (with/without passwords toggle), Launch on startup toggle, Minimize to tray on close toggle

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | App launch < 2s, topic list render < 500ms for 1000+ topics |
| **Memory** | Idle < 150MB RAM, active browsing < 500MB |
| **Security** | No plaintext passwords, OS keyring integration |
| **Updates** | Seamless auto-update with rollback capability |
| **Accessibility** | Keyboard navigable, screen reader compatible labels |
| **Offline** | Graceful degradation when cluster unreachable |

## Success Metrics

- [ ] Connect to Kafka cluster and display brokers within 3 seconds
- [ ] Browse 10,000+ messages with zero UI lag (virtualized)
- [ ] Support 3+ simultaneous cluster connections
- [ ] Consumer lag polling at 5s interval with no perceptible UI jank
- [ ] Production-ready macOS `.app` and Windows `.exe` builds

## Assumptions & Constraints

- Users have network access to their Kafka clusters (no VPN proxying built-in)
- Schema Registry is Confluent-compatible REST API
- Auto-update requires internet connectivity for version checks
- No mobile or Linux builds in Phase 1

## Out of Scope (Phase 1)

- Kafka Connect management
- ksqlDB integration
- Multi-tenancy / team collaboration
- Cloud-hosted version
