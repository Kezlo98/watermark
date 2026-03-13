# 2026-03-13 — Messages Tab: 3 New Filters

## What changed

**`internal/kafka/messages.go`**
- Extracted `consumeFromOffsets` private helper — consumer creation + poll loop was duplicated ~80% between methods
- Refactored `ConsumeMessages` to delegate to helper (public signature unchanged — Wails binding stable)
- Added `ConsumeMessagesFromTimestamp(topicName, partition, timestampMs, limit)` — resolves per-partition offsets via `kadm.ListOffsetsAfterMilli(ctx, timestampMs, topicName)`, falls back to end offset if timestamp not found

**`frontend/src/lib/wails-client.ts`**
- Exported `ConsumeMessagesFromTimestamp` after `wails generate module` regenerated bindings

**`frontend/src/components/topics/messages-filter-bar.tsx`** (new)
- Extracted all browse-mode controls from `messages-tab.tsx` into a dedicated component
- Adds: Start select (Latest/Earliest/CustomOffset/FromDate), conditional offset/date inputs, Body Contains text input

**`frontend/src/components/topics/messages-tab.tsx`**
- Extended `StartPosition` type with `"CustomOffset" | "FromDate"`
- Query branches: `isFromDate` → `ConsumeMessagesFromTimestamp`, else `ConsumeMessages`
- Body Contains: debounced 300ms, client-side filter on `key + value`, browse mode only (NOT live tail)
- Replaced inline browse controls with `<MessagesFilterBar />`

## Key decisions

- `consumeFromOffsets` helper keeps Wails binding signatures stable while eliminating duplication
- `startTime` dead variable removed — `ListOffsetsAfterMilli` takes `int64` millis directly
- Body Contains NOT active during Live Tail — deferred to future
- Filter bar extracted to keep `messages-tab.tsx` under 200 lines
