# Code Standards

## General Principles

- **YAGNI** — Don't build features until needed
- **KISS** — Simplest solution that works
- **DRY** — Extract shared logic into utilities
- **File size** — Keep files under 200 lines; split if larger
- **Naming** — Use kebab-case for files, descriptive names (self-documenting for LLM tools)

### Best Practice References

Before implementing, review these companion guides:

| Guide | Scope | Key Topics |
|-------|-------|------------|
| [Go Best Practices](./golang-best-practices.md) | Backend | Error handling, concurrency, slices, interfaces, testing |
| [React Best Practices](./react-best-practices.md) | Frontend | Data fetching, re-renders, TanStack patterns, performance |

## Go Backend Standards

### File Naming
```
kafka-service.go          ✅
kafka_service.go          ✅ (Go convention acceptable)
kafkaService.go           ❌
ks.go                     ❌
```

### Package Structure (Planned)
```
watermark/
├── main.go               # Entry point only
├── app.go                # Wails App struct + lifecycle
├── internal/
│   ├── kafka/            # Kafka service, client wrapper
│   │   ├── service.go
│   │   ├── consumer.go
│   │   ├── producer.go
│   │   └── types.go
│   ├── keyring/          # Secure credential storage
│   │   └── service.go
│   ├── schema/           # Schema Registry client
│   │   └── service.go
│   ├── config/           # Connection profiles, app settings
│   │   └── service.go
│   └── updater/          # Auto-update logic
│       └── service.go
└── pkg/                  # Shared utilities (if needed)
```

### Go Coding Rules

> **Full reference**: [golang-best-practices.md](./golang-best-practices.md) — 100 Go Mistakes distilled into actionable rules

1. **Error handling** — Always return `error`; no panics in production code
   ```go
   // ✅ Good
   func (s *KafkaService) GetTopics() ([]Topic, error) {
       topics, err := s.client.ListTopics()
       if err != nil {
           return nil, fmt.Errorf("list topics: %w", err)
       }
       return topics, nil
   }
   
   // ❌ Bad
   func (s *KafkaService) GetTopics() []Topic {
       topics, _ := s.client.ListTopics() // swallowed error
       return topics
   }
   ```

2. **Wails bindings** — Public methods on struct bound in `main.go` are auto-exposed to frontend
   ```go
   // This will be callable from frontend JS
   func (a *App) GetClusterHealth() (*ClusterHealth, error) { ... }
   ```

3. **Context propagation** — Pass `context.Context` for cancellation
   ```go
   func (a *App) GetTopics(ctx context.Context) ([]Topic, error) { ... }
   ```

4. **Struct tags** — Use `json` tags for all types exposed to frontend
   ```go
   type Topic struct {
       Name       string `json:"name"`
       Partitions int    `json:"partitions"`
       Replicas   int    `json:"replicas"`
   }
   ```

5. **Comments** — Document all public types and methods
6. **Testing** — `_test.go` files alongside source files; use table-driven tests

## Frontend Standards (React + TypeScript)

### File Naming
```
cluster-overview-page.tsx   ✅
broker-table.tsx            ✅
TopicList.tsx               ❌
tl.tsx                      ❌
```

### Directory Structure (Planned)
```
frontend/src/
├── routes/                     # Page-level components
│   ├── dashboard/
│   │   ├── dashboard-page.tsx
│   │   ├── broker-table.tsx
│   │   └── metric-cards.tsx
│   ├── topics/
│   │   ├── topics-page.tsx
│   │   └── topic-detail-panel.tsx
│   ├── messages/
│   │   ├── messages-page.tsx
│   │   └── message-viewer.tsx
│   ├── consumers/
│   │   └── consumers-page.tsx
│   ├── acls/
│   │   └── acls-page.tsx
│   ├── schemas/
│   │   └── schemas-page.tsx
│   └── settings/
│       └── settings-page.tsx
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── app-header.tsx
│   └── shared/
│       ├── status-badge.tsx
│       └── search-input.tsx
├── hooks/
│   ├── use-kafka-query.ts      # TanStack Query wrappers
│   └── use-debounce.ts
├── lib/
│   ├── utils.ts                # cn(), formatBytes(), etc.
│   └── wails-client.ts         # Typed Wails method wrappers
├── types/
│   ├── kafka.ts                # Kafka domain types
│   └── config.ts               # App config types
└── assets/
    ├── fonts/
    └── images/
```

### TypeScript Rules

1. **Strict mode** — `strict: true` in tsconfig
2. **No `any`** — Use explicit types or `unknown`
3. **Interface over type** for objects exposed to backend
   ```typescript
   // ✅ Good — matches Go struct shape
   interface Topic {
     name: string;
     partitions: number;
     replicas: number;
   }
   
   // ✅ Also good — for unions, utility types
   type ClusterStatus = 'healthy' | 'degraded' | 'offline';
   ```

4. **Named exports** over default exports
   ```typescript
   // ✅
   export function DashboardPage() { ... }
   
   // ❌
   export default function DashboardPage() { ... }
   ```

### React Patterns

> **Full reference**: [react-best-practices.md](./react-best-practices.md) — Performance optimization, TanStack patterns, and component architecture

1. **Functional components** only — no class components
2. **Server state in TanStack Query** — never in `useState`
   ```typescript
   const { data: topics } = useQuery({
     queryKey: ['topics'],
     queryFn: () => GetTopics(),
     refetchInterval: 10_000,
   });
   ```
3. **Custom hooks** for reusable logic
4. **Error boundaries** at page level
5. **Suspense** with TanStack Query for loading states

### Styling Rules

1. **Tailwind CSS** for all styling — no inline styles
2. **`cn()` utility** for conditional classes
   ```typescript
   import { cn } from '@/lib/utils';
   
   <div className={cn(
     'rounded-xl border p-6',
     isActive && 'border-primary bg-primary/10'
   )}>
   ```
3. **Design tokens** from Tailwind config — no hardcoded colors
4. **Dark mode first** — all components assume dark theme

## Git Standards

### Branch Naming
```
feat/topic-management
fix/consumer-lag-polling
refactor/kafka-service-split
docs/update-architecture
```

### Commit Messages (Conventional Commits)
```
feat(topics): add searchable topic data grid
fix(consumers): correct lag calculation for empty partitions
refactor(kafka): split service into consumer and producer modules
docs: update system architecture with schema registry
chore: upgrade tanstack/react-query to v5
```

### Pre-commit Checklist
- [ ] `go vet ./...` passes
- [ ] `go build ./...` succeeds
- [ ] `golangci-lint run ./...` passes (see [Go BP §1.13](./golang-best-practices.md#113-use-linters))
- [ ] Frontend `npm run build` succeeds
- [ ] No `any` types in TypeScript (see [React BP §5](./react-best-practices.md#5-typescript-patterns-high))
- [ ] All backend calls via TanStack Query (see [React BP §1.3](./react-best-practices.md#13-tanstack-query-as-the-data-layer))
- [ ] No secrets, API keys, or credentials in diff
- [ ] Files under 200 lines (or documented exception)
