# React & TypeScript Best Practices

> Performance and code quality guidelines for the Watermark frontend. Combining Vercel's React optimization rules with patterns specific to our Wails + TanStack stack.

---

## 1. Data Fetching & Async Patterns (CRITICAL)

### 1.1 Parallelize Independent Calls
Never await independent Wails calls sequentially. Use `Promise.all()`:

```typescript
// ❌ Bad — sequential waterfall (2x latency)
const brokers = await GetBrokers();
const topics = await GetTopics();

// ✅ Good — parallel (1x latency)
const [brokers, topics] = await Promise.all([
  GetBrokers(),
  GetTopics(),
]);
```

### 1.2 Move await Into Branches
Only await where the result is actually needed:

```typescript
// ❌ Bad — always awaits even when not needed
async function loadTopic(id: string) {
  const config = await GetTopicConfig(id);
  if (!showConfig) return null;
  return config;
}

// ✅ Good — defers await to where it's used
async function loadTopic(id: string) {
  const configPromise = GetTopicConfig(id);
  if (!showConfig) return null;
  return await configPromise;
}
```

### 1.3 TanStack Query as the Data Layer
All Wails backend calls go through TanStack Query — never raw `useState` + `useEffect`:

```typescript
// ❌ Bad — manual state management
const [topics, setTopics] = useState<Topic[]>([]);
useEffect(() => {
  GetTopics().then(setTopics);
}, []);

// ✅ Good — TanStack Query with caching + polling
export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: () => GetTopics(),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}
```

### 1.4 Query Key Conventions
Consistent, hierarchical query keys enable precise invalidation:

```typescript
// Pattern: [domain, resource, ...params]
queryKey: ['cluster', 'brokers']
queryKey: ['topics']
queryKey: ['topics', topicName, 'messages']
queryKey: ['topics', topicName, 'config']
queryKey: ['consumers']
queryKey: ['consumers', groupId, 'offsets']
queryKey: ['schemas']

// Invalidate all topic-related queries
queryClient.invalidateQueries({ queryKey: ['topics'] });
```

### 1.5 Polling Strategy

| Data | Interval | Rationale |
|------|----------|-----------|
| Cluster health / brokers | 10s | Low-frequency changes |
| Topic list | 30s | Rarely changes |
| Consumer lag | 5s | Critical for monitoring |
| Messages (live-tail) | 1s | Near real-time |
| Schema registry | 60s | Very rarely changes |

Use `refetchInterval` in `useQuery`, disable when tab is not visible with `refetchIntervalInBackground: false`.

---

## 2. Component Architecture (HIGH)

### 2.1 Component Size & Splitting
- Keep components under **100 lines** (JSX + logic)
- Extract custom hooks for data/logic
- Extract sub-components for complex JSX

```
// Component responsibility split:
topics-page.tsx        → Layout, query orchestration
├── topic-table.tsx    → Table rendering + column defs
├── topic-filters.tsx  → Search, toggles
└── create-topic-modal.tsx → Form + validation
```

### 2.2 Named Exports Only
No default exports — enables better tree-shaking and refactoring:

```typescript
// ✅
export function BrokerTable({ brokers }: BrokerTableProps) { ... }

// ❌
export default function BrokerTable({ brokers }: BrokerTableProps) { ... }
```

### 2.3 Co-locate Related Files
Keep component, hook, and type files together by feature:

```
routes/topics/
├── topics-page.tsx           # Page component
├── topic-table-columns.tsx   # Column definitions
├── use-topics-query.ts       # Custom query hook
└── topic-types.ts            # Feature-specific types
```

### 2.4 Props Interface over Inline Types

```typescript
// ✅ Good — reusable, documentable
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
}

export function MetricCard({ label, value, icon: Icon, trend }: MetricCardProps) { ... }
```

---

## 3. Re-render Optimization (MEDIUM)

### 3.1 Don't Subscribe to State Only Used in Callbacks
If state is only needed inside an event handler, use a ref instead:

```typescript
// ❌ Bad — re-renders on every scroll position change
const [scrollPos, setScrollPos] = useState(0);
const handleExport = () => exportAt(scrollPos);

// ✅ Good — no re-renders
const scrollPosRef = useRef(0);
const handleExport = () => exportAt(scrollPosRef.current);
```

### 3.2 Use Functional setState
Prevents stale closure issues and creates stable callbacks:

```typescript
// ❌ Bad — depends on current state, causes re-renders in parent
const increment = () => setCount(count + 1);

// ✅ Good — no dependency on count
const increment = useCallback(() => setCount(c => c + 1), []);
```

### 3.3 Derive State, Don't Sync It
Compute derived values inline — don't store them in separate state:

```typescript
// ❌ Bad — synced state (error-prone, extra re-renders)
const [topics, setTopics] = useState<Topic[]>([]);
const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
useEffect(() => {
  setFilteredTopics(topics.filter(t => !t.name.startsWith('__')));
}, [topics]);

// ✅ Good — derived inline (or useMemo if expensive)
const filteredTopics = useMemo(
  () => topics.filter(t => !t.name.startsWith('__')),
  [topics]
);
```

### 3.4 Use Primitive Dependencies in Effects
Pass primitive values (not objects) to dependency arrays:

```typescript
// ❌ Bad — runs on every render (new object reference each time)
useEffect(() => { ... }, [filters]);

// ✅ Good — only runs when actual values change
useEffect(() => { ... }, [filters.search, filters.hideInternal]);
```

### 3.5 Lazy State Initialization
Pass a function to `useState` for expensive initial values:

```typescript
// ❌ Bad — runs on every render
const [data, setData] = useState(parseComplexData(raw));

// ✅ Good — runs once
const [data, setData] = useState(() => parseComplexData(raw));
```

### 3.6 Use startTransition for Non-Urgent Updates
Wrap low-priority state updates to keep the UI responsive:

```typescript
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

function handleSearch(query: string) {
  // High priority — update input immediately
  setSearchInput(query);
  // Low priority — filter can lag behind
  startTransition(() => {
    setFilteredResults(filterTopics(query));
  });
}
```

---

## 4. Rendering Performance (MEDIUM)

### 4.1 Virtualize Long Lists
Use `@tanstack/react-virtual` for any list > 50 items:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
  overscan: 10,
});
```

**Critical for**: Message live-tail (capped at 100), topic lists (1000+), consumer group lists.

### 4.2 Hoist Static JSX
Extract JSX that doesn't depend on props/state outside the component:

```typescript
// ✅ Good — created once, reused
const EmptyState = (
  <div className="text-slate-400 text-center py-8">
    No topics found
  </div>
);

export function TopicList({ topics }: Props) {
  if (topics.length === 0) return EmptyState;
  // ...
}
```

### 4.3 Use content-visibility for Off-Screen Content
For long scrollable areas (broker details, config tables):

```css
.off-screen-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

### 4.4 Conditional Rendering — Ternary over &&

```typescript
// ❌ Risky — renders "0" if count is 0
{count && <Badge>{count}</Badge>}

// ✅ Safe — always renders null or element
{count > 0 ? <Badge>{count}</Badge> : null}
```

---

## 5. TypeScript Patterns (HIGH)

### 5.1 Match Go Struct Shapes
Frontend interfaces should mirror Go struct JSON tags exactly:

```go
// Go
type Broker struct {
    ID         int    `json:"id"`
    Host       string `json:"host"`
    Port       int    `json:"port"`
    Rack       string `json:"rack"`
    Controller bool   `json:"controller"`
}
```

```typescript
// TypeScript — mirrors Go exactly
interface Broker {
  id: number;
  host: string;
  port: number;
  rack: string;
  controller: boolean;
}
```

### 5.2 Discriminated Unions for States

```typescript
// ✅ Good — impossible invalid states
type ConsumerGroupState =
  | { status: 'stable'; members: number }
  | { status: 'rebalancing'; members: number }
  | { status: 'dead' }
  | { status: 'empty' };
```

### 5.3 Strict Null Checks
Never use non-null assertion (`!`) unless the value is guaranteed by Wails binding types. Prefer optional chaining and nullish coalescing:

```typescript
// ❌ Bad
const name = topic!.name;

// ✅ Good
const name = topic?.name ?? 'Unknown';
```

### 5.4 Exhaustive Switch with never

```typescript
function getStateColor(state: GroupState): string {
  switch (state) {
    case 'stable': return 'text-emerald-400';
    case 'rebalancing': return 'text-amber-400';
    case 'dead': return 'text-red-400';
    case 'empty': return 'text-slate-400';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
```

---

## 6. TanStack Table Patterns (HIGH)

### 6.1 Column Definitions Outside Components
Prevent re-creation on every render:

```typescript
// topic-table-columns.tsx
export const topicColumns: ColumnDef<Topic>[] = [
  { accessorKey: 'name', header: 'Topic Name' },
  { accessorKey: 'partitions', header: 'Partitions' },
  // ...
];
```

### 6.2 Sorting & Filtering Server-Side (When Possible)
For large datasets (1000+ topics), prefer filtering/sorting in Go backend and sending results via Wails, rather than client-side filtering on the full dataset.

### 6.3 Debounce Search Inputs

```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 300);

// Use debouncedSearch in query key
useQuery({
  queryKey: ['topics', { search: debouncedSearch }],
  queryFn: () => SearchTopics(debouncedSearch),
});
```

---

## 7. Monaco Editor Patterns (MEDIUM)

### 7.1 Lazy Load Monaco
Monaco is ~2MB — never import at top level:

```typescript
import { lazy, Suspense } from 'react';

const MonacoEditor = lazy(() =>
  import('@monaco-editor/react').then(mod => ({ default: mod.default }))
);

// Usage
<Suspense fallback={<div className="animate-pulse h-64 bg-white/5 rounded" />}>
  <MonacoEditor
    value={schema}
    language="json"
    theme="vs-dark"
    options={{ readOnly: true, minimap: { enabled: false } }}
  />
</Suspense>
```

### 7.2 Stable Editor Options
Hoist options object to prevent re-renders:

```typescript
const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  minimap: { enabled: false },
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
};
```

---

## 8. Styling Best Practices (MEDIUM)

### 8.1 Use cn() for Conditional Classes

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  'rounded-xl border p-6 transition-colors',
  isActive && 'border-primary bg-primary/10',
  isDisabled && 'opacity-50 cursor-not-allowed'
)} />
```

### 8.2 No Inline Styles
All styling through Tailwind classes. Exception: dynamic values that can't be expressed as classes (rare).

### 8.3 Design Tokens via Tailwind Config
Never hardcode colors — use the configured palette:

```typescript
// ❌ Bad
<div style={{ color: '#8B5CF6' }}>

// ✅ Good
<div className="text-primary">
```

---

## 9. Error Handling (HIGH)

### 9.1 Error Boundaries at Route Level
Wrap each page in an error boundary to prevent full-app crashes:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function PageErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
      <p className="text-slate-400 mt-2">{error.message}</p>
      <button onClick={resetErrorBoundary} className="mt-4 btn">
        Try Again
      </button>
    </div>
  );
}

// In router config
<ErrorBoundary FallbackComponent={PageErrorFallback}>
  <TopicsPage />
</ErrorBoundary>
```

### 9.2 Handle Wails Call Errors Gracefully
All Wails Go→JS calls can reject. TanStack Query handles this, but for mutations:

```typescript
const createTopic = useMutation({
  mutationFn: (input: CreateTopicInput) => CreateTopic(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['topics'] });
    toast.success('Topic created');
  },
  onError: (err) => {
    toast.error(`Failed to create topic: ${err.message}`);
  },
});
```

---

## Quick Reference Checklist

Use before committing frontend code in the Watermark project:

- [ ] All backend calls go through TanStack Query (no raw `useState` + `useEffect`)
- [ ] Independent async calls use `Promise.all()`
- [ ] Components under 100 lines (split into sub-components + hooks)
- [ ] Named exports only (no `export default`)
- [ ] TypeScript interfaces match Go JSON struct tags
- [ ] No `any` types (use `unknown` + type guards)
- [ ] `useMemo` / `useCallback` used only when necessary (measured, not guessed)
- [ ] Long lists (>50 items) use `@tanstack/react-virtual`
- [ ] Monaco Editor lazy-loaded with `React.lazy` + `Suspense`
- [ ] Conditional rendering uses ternary, not `&&`
- [ ] All styling via Tailwind classes and `cn()` utility
- [ ] Error boundaries at route/page level
- [ ] Search inputs debounced (300ms)
- [ ] Query keys follow hierarchical convention
- [ ] No inline styles or hardcoded color values

---

*Source: Vercel React Best Practices + TanStack patterns adapted for Wails desktop architecture*
