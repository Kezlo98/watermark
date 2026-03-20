# 2026-03-20 — Delete Records from Topic

Branch: `feat/topic_delete_message`

## What Changed

### Backend (Go)

Added three new methods to `KafkaService` in `internal/kafka/topic-operations.go`:

- `DeleteRecordsBefore(topic, partition, offset)` — advances low-watermark on a single partition to the given offset
- `DeleteRecordsBeforeTimestamp(topic, timestampMs)` — resolves offsets for all partitions at the given timestamp, then deletes
- `PurgeTopic(topic)` — fetches high-watermarks and advances all partitions to end (full wipe)

Added `DeleteRecordsResult` type to `types.go`. All three methods guard via `ensureWritable()` and use the `kadm.DeleteRecords` API. Wails bindings regenerated after adding methods.

### Frontend (React/TypeScript)

New files:
- `delete-records-dialog.tsx` — three-mode dialog (offset / timestamp / purge). Purge requires a checkbox confirmation. Timestamp mode uses a date picker. Per-partition errors are surfaced inline; dialog stays open on error so the user can retry.
- `messages-action-dropdown.tsx` — Actions dropdown grouping Produce, Delete Before Date, and Purge Topic.

Modified files:
- `message-context-menu.tsx` — added "Delete all before this" (offset) and "Delete all before this time" (timestamp) items
- `messages-filter-bar.tsx` — added Actions dropdown slot
- `messages-tab.tsx` — wired delete state/handlers; moved `produceOpen` state here
- `messages-table.tsx` — threaded delete callbacks down to rows

## Key Decisions

- Offset-based delete is single-partition only — offsets are partition-scoped, so a multi-partition offset delete would be ambiguous.
- Purge is the only action requiring two-step confirmation (checkbox) given its destructive scope.
- All delete actions are disabled during live-tail to avoid races with the streaming consumer.
- Per-partition errors are shown rather than collapsed — silent partial failures are worse than noisy ones.
