# Changelog

All notable changes to Watermark are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.3] - 2026-03-13

### Added

- Manual update check in Settings About section with Cmd+, keyboard shortcut
- Messages tab filters: From Offset, From Date, and Body Contains
- Consumer group offsets and lag table grouped by topic with expandable partitions

### Changed

- Extract shared filter types across messages tab components

### Fixed

- Error feedback display and dead-code branch removed in AppVersionSection

## [1.0.2] - 2026-03-12

### Fixed

- `darwin_all` filter to correctly match universal binary asset name in auto-updater

## [1.0.1] - 2026-03-12

### Added

- Back navigation buttons to topic and consumer detail pages

### Changed

- Message inspector now renders below the table instead of a side panel
- Removed unused New Resource and notification buttons from header

### Fixed

- Table height uses `vh` units; navigation uses `history.back()` correctly

## [1.0.0] - 2026-03-10

### Added

- Auto-update via GitHub Releases with download progress tracking
- Create topic modal with name validation, config options, and toast notifications
- AWS MSK IAM authentication with region and profile support

### Fixed

- Produce message modal wired to Wails backend
- Select-all only targets search-filtered results
- Skip non-profile sections when parsing AWS config file

## [0.3.0] - 2026-03-09

### Fixed

- Clear stale data on cluster switch
- Align query status flags with data override on disconnect
- Sticky header slicing artifact in WebKit

## [0.2.0] - 2026-03-09

### Added

- Per-cluster response cache with 30-minute TTL

### Changed

- Merge producers and consumers into topic name flow line

### Fixed

- Cluster switch resilience and error handling

## [0.1.0] - 2026-03-08

### Added

- Kafka topic management: list, detail, partitions, configs, ACLs
- Consumer groups list and detail view
- Cluster health dashboard
- Schema registry browser
- Multi-cluster support with connection profiles
- Message inspector with multi-partition support
- Per-page cache refresh with ⌘R shortcut
- Custom Watermark branding and logo
- macOS universal binary build pipeline with GitHub Actions
