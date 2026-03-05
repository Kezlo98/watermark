# Go Best Practices

> Distilled from [100 Go Mistakes and How to Avoid Them](https://100go.co/) by Teiva Harsanyi, adapted for the Watermark project.

---

## 1. Code & Project Organization

### 1.1 Avoid Variable Shadowing
Never redeclare a variable in an inner block if the outer variable is still needed. Use `go vet -shadow` or linters to detect shadowed variables like `err`.

### 1.2 Reduce Nesting — Align the Happy Path Left
- If an `if` block returns, omit the `else`
- Flip non-happy path conditions to return early
- Keep the "success" path unindented

```go
// ❌ Bad
if s != "" {
    // ...
} else {
    return errors.New("empty string")
}

// ✅ Good
if s == "" {
    return errors.New("empty string")
}
// ...
```

### 1.3 Use init() Functions Sparingly
`init()` has limited error handling, complicates testing, and forces global state. Prefer explicit initialization functions you call directly.

### 1.4 Don't Overuse Getters/Setters
Go is not Java. Getters/setters aren't idiomatic unless they add genuine value (e.g., validation, computed fields). Access struct fields directly when appropriate.

### 1.5 Discover Interfaces, Don't Create Them
Create interfaces when you **need** them, not when you foresee needing them. Avoid interface pollution — keep interfaces small and on the **consumer** side, not the producer.

### 1.6 Return Concrete Types, Accept Interfaces
Functions should return concrete implementations (not interfaces) for flexibility, but accept interfaces for testability and decoupling.

### 1.7 Avoid `any` Unless Truly Generic
Only use `any` (or `interface{}`) when you genuinely need to accept/return any type (e.g., `json.Marshal`). Prefer explicit types for compile-time safety.

### 1.8 Use Generics Only When Needed
Don't add type parameters prematurely. Use generics when you see a concrete need to factor out boilerplate — not to abstract "just in case."

### 1.9 Be Careful with Type Embedding
- Don't embed solely for syntactic sugar (`Foo.Baz()` vs `Foo.Bar.Baz()`)
- Don't embed if it promotes fields/methods that should remain hidden

### 1.10 Use the Functional Options Pattern
For configurable constructors, use functional options instead of config structs with zero values:

```go
type Option func(options *options) error

func WithPort(port int) Option {
    return func(o *options) error {
        if port < 0 {
            return errors.New("port should be positive")
        }
        o.port = &port
        return nil
    }
}

func NewServer(addr string, opts ...Option) (*http.Server, error) {
    var o options
    for _, opt := range opts {
        if err := opt(&o); err != nil {
            return nil, err
        }
    }
    // ...
}
```

### 1.11 Organize Packages by Domain, Not by Layer
- Don't create `common`, `util`, or `shared` packages — name packages after what they **provide**
- Minimize exports — default to unexported, export only when needed
- Avoid package name collisions with variables — use import aliases if necessary
- Follow [Go project layout guidelines](https://go.dev/doc/modules/layout)

### 1.12 Document All Exported Elements
Comments should start with the element name, be complete sentences, and explain **what** (not how). Document packages with `// Package <name>`.

### 1.13 Use Linters
Use `golangci-lint` with at minimum:
- `go vet` — standard analyzer
- `errcheck` — unchecked errors
- `gocyclo` — cyclomatic complexity
- `goconst` — repeated string constants
- `gofmt` / `goimports` — formatting

---

## 2. Data Types

### 2.1 Numeric Literals
- Prefix octal numbers with `0o` for clarity (`0o10` not `010`)
- Use `_` separators for readability: `1_000_000_000`
- Be aware: integer overflows at runtime are **silent** in Go — no panic

### 2.2 Floating-Point Arithmetic
- Compare floats within a delta, never with `==`
- Group additions/subtractions by similar magnitude
- Perform multiplication/division before addition/subtraction

### 2.3 Slices: Length vs. Capacity
- **Length** = number of available elements; **Capacity** = size of backing array
- Pre-allocate slices with `make([]T, 0, knownCap)` when size is known
- Check emptiness with `len(s) == 0`, never `s == nil` — works for both nil and empty

### 2.4 Slice Safety
- `range` copies values — modify via index (`s[i].Field = x`), not the loop variable
- `append` on a sub-slice can mutate the original — use full slice expression `s[lo:hi:max]` or `copy()`
- Slicing a large slice retains the entire backing array — use `copy()` or `strings.Clone()` for substrings to avoid memory leaks
- Mark nil-ed elements in pointer slices after reslicing to allow GC

### 2.5 Maps
- Pre-allocate with `make(map[K]V, knownSize)` to avoid rehashing
- Maps never shrink — recreate the map if it grew too large
- Map iteration order is **not deterministic** — never rely on it
- Inserting into a map during iteration has **undefined** result ordering

### 2.6 Comparing Values
- Use `==` for comparable types (bool, numerics, strings, pointers, channels, comparable structs)
- Use `reflect.DeepEqual` for slices/maps (but pay the performance cost)
- Check stdlib first: `bytes.Compare`, `slices.Equal`, etc.

---

## 3. Control Structures

### 3.1 Range Loop Gotchas
- The range expression is evaluated **once** before the loop (copy for arrays)
- `break` inside `switch`/`select` inside a `for` loop breaks the **inner** statement, not the loop — use labels:

```go
loop:
    for i := 0; i < 5; i++ {
        switch i {
        case 2:
            break loop // Breaks the for, not the switch
        }
    }
```

### 3.2 Defer in Loops
`defer` runs when the **function** returns, not at end of loop iteration. Extract loop body into a helper function:

```go
// ❌ Bad — all files stay open until function returns
for path := range ch {
    file, _ := os.Open(path)
    defer file.Close()
}

// ✅ Good
for path := range ch {
    if err := processFile(path); err != nil { ... }
}
func processFile(path string) error {
    file, err := os.Open(path)
    if err != nil { return err }
    defer file.Close()
    // ...
}
```

---

## 4. Strings

### 4.1 Runes vs. Bytes
- A `rune` is a Unicode code point (1-4 bytes in UTF-8)
- `len(s)` returns **bytes**, not runes — use `utf8.RuneCountInString(s)` for rune count
- Iterate with `for i, r := range s` to get runes, not bytes

### 4.2 String Trim Functions
- `strings.TrimRight/TrimLeft` — removes **set of runes** (not a suffix/prefix)
- `strings.TrimSuffix/TrimPrefix` — removes an exact substring

### 4.3 Efficient Concatenation
Use `strings.Builder` for repeated concatenation (strings are immutable — `+=` allocates a new string each time):

```go
var sb strings.Builder
sb.Grow(totalLen) // Pre-allocate for best performance
for _, v := range values {
    sb.WriteString(v)
}
result := sb.String()
```

### 4.4 Substring Memory Leaks
Substrings share the backing array of the original string. Use `strings.Clone()` (Go 1.20+) or manual copy to decouple.

---

## 5. Functions & Methods

### 5.1 Receiver Type Selection

| Condition | Receiver |
|-----------|----------|
| Must mutate the receiver | **Pointer** |
| Contains non-copyable field (`sync.Mutex`) | **Pointer** |
| Large struct | **Pointer** |
| Must enforce immutability | **Value** |
| Receiver is map, func, or channel | **Value** |
| Small value type (e.g., `time.Time`, `int`) | **Value** |

**Default**: when in doubt, use a pointer receiver.

### 5.2 Named Result Parameters
Use sparingly — they're convenient for disambiguating same-type returns and for documentation, but beware: they're initialized to zero values, which can cause subtle bugs.

### 5.3 Returning nil Receivers
When returning an interface, return an **explicit `nil`**, not a nil pointer to a concrete type — otherwise the caller gets a non-nil interface wrapping a nil pointer.

### 5.4 Accept `io.Reader`, Not Filenames
Design functions to accept `io.Reader` instead of file paths. This improves testability and reusability.

### 5.5 Defer Argument Evaluation
`defer` arguments are evaluated **immediately** (at the defer statement), not when the deferred function runs. Use closures or pointer receivers to capture mutable state.

---

## 6. Error Management

### 6.1 Panic Sparingly
Only use `panic` for truly unrecoverable conditions: programmer errors, failed mandatory dependencies. For everything else, return `error`.

### 6.2 Wrap Errors with Context
Use `fmt.Errorf("operation: %w", err)` to add context while preserving the error chain. Use `%v` instead of `%w` if you want to transform (not wrap) the error.

### 6.3 Use errors.Is / errors.As
- Compare **values**: `errors.Is(err, ErrNotFound)` — not `==`
- Compare **types**: `errors.As(err, &target)` — not type assertion
- Both recursively unwrap wrapped errors

### 6.4 Handle Errors Once
Either **log** or **return** an error — never both. Use error wrapping to propagate context upward.

### 6.5 Handle Defer Errors
Don't silently ignore errors from deferred calls (e.g., `file.Close()`). Either handle or explicitly ignore with `_ = f.Close()` and a comment.

### 6.6 Sentinel vs Custom Error Types
- **Expected** errors → sentinel values: `var ErrNotFound = errors.New("not found")`
- **Unexpected** errors → custom types: `type ValidationError struct {...}`
- Name sentinel errors with `Err` prefix: `ErrTimeout`, `ErrConflict`

---

## 7. Concurrency: Foundations

### 7.1 Concurrency ≠ Parallelism
- **Concurrency** is about structure (independent tasks)
- **Parallelism** is about execution (simultaneous computation)
- Concurrency enables parallelism — but is not always faster. **Benchmark** before assuming.

### 7.2 Channels vs. Mutexes

| Goroutine Relationship | Mechanism | Use Case |
|------------------------|-----------|----------|
| **Parallel** goroutines | `sync.Mutex` | Shared resource access, synchronization |
| **Concurrent** goroutines | Channels | Coordination, orchestration, ownership transfer |

Use `chan struct{}` for signal-only channels (no data).

### 7.3 Data Races vs. Race Conditions
- **Data race**: simultaneous access to same memory, at least one write → use `-race` flag
- **Race condition**: behavior depends on uncontrollable timing → data-race-free ≠ deterministic
- Prevent with: `sync/atomic`, mutexes, or channels

### 7.4 Workload-Aware Goroutine Count
- **CPU-bound**: goroutines ≈ `runtime.GOMAXPROCS` (= CPU cores)
- **I/O-bound**: depends on external system latency — can be much higher

### 7.5 Context Best Practices
- Use `context.WithCancel` / `context.WithDeadline` for cancellation
- Always check `ctx.Done()` in long-running operations
- Pass context as the **first parameter**: `func Foo(ctx context.Context, ...)`
- Context values are for request-scoped data (trace IDs), not for passing function parameters

---

## 8. Concurrency: Practice

### 8.1 Know When Goroutines Stop
Every `go` statement needs a plan for termination. Use:
- Context cancellation
- Done channels
- `sync.WaitGroup`
- Return the goroutine handle and a `Close()` method

### 8.2 Don't Append to Shared Slices
`append` on a slice with remaining capacity mutates the backing array → data race. Always copy slices before concurrent access.

### 8.3 Protect Maps with Mutexes
Maps are **not** safe for concurrent reads and writes. Use `sync.Mutex`, `sync.RWMutex`, or `sync.Map`.

### 8.4 Use errgroup for Goroutine Groups
`golang.org/x/sync/errgroup` provides structured concurrency: context cancellation, error propagation, and limit-based concurrency.

### 8.5 Never Copy sync Types
`sync.Mutex`, `sync.WaitGroup`, `sync.Cond`, etc. must **never be copied** (pass by pointer).

### 8.6 Be Careful with String Formatting in Goroutines
`fmt.Sprintf("%s", value)` may call the `String()` method, which can cause data races if the value's state is concurrently modified.

---

## 9. Standard Library

### 9.1 Time Duration Pitfall
`time.Duration` is nanoseconds, not milliseconds. Always use the API:

```go
// ❌ Bad — 1000 nanoseconds, not 1 second
ticker := time.NewTicker(1000)

// ✅ Good
ticker := time.NewTicker(time.Second)
```

### 9.2 JSON Handling
- Embedded `time.Time` in structs overrides `json.Marshaler` — be careful with type embedding
- Unmarshaling into `map[string]any` converts all numbers to `float64`
- `time.Time` comparison with `==` compares both wall clock and monotonic clock

### 9.3 SQL Best Practices
- `sql.Open` doesn't establish a connection — use `db.Ping()` to verify
- Configure connection pool settings for production (`SetMaxOpenConns`, `SetMaxIdleConns`)
- Use prepared statements for security and performance
- Handle nullable columns with `sql.NullString`, `sql.NullInt64`, etc.
- Check `rows.Err()` after iteration

### 9.4 Close Transient Resources
Always `defer Close()` for: HTTP response bodies, `sql.Rows`, `os.File`, and anything implementing `io.Closer`.

### 9.5 HTTP Handlers: Return After Error
`http.Error()` does **not** stop handler execution. Always `return` after it:

```go
if err != nil {
    http.Error(w, "error", http.StatusInternalServerError)
    return // Critical!
}
```

### 9.6 Don't Use Default HTTP Client/Server
The default `http.Client` has **no timeout**. Always configure:

```go
client := &http.Client{
    Timeout: 10 * time.Second,
}

server := &http.Server{
    ReadTimeout:  5 * time.Second,
    WriteTimeout: 10 * time.Second,
    IdleTimeout:  120 * time.Second,
}
```

---

## 10. Testing

### 10.1 Categorize Tests
Use build tags, env vars, or `-short` flag to separate unit from integration tests.

### 10.2 Always Enable the Race Detector
Run `go test -race ./...` in CI. It detects data races with zero false positives (but ~2-10x overhead).

### 10.3 Use Table-Driven Tests
Reduce duplication, make adding cases trivial:

```go
tests := []struct {
    name  string
    input int
    want  int
}{
    {"zero", 0, 0},
    {"positive", 5, 25},
}
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        got := Square(tt.input)
        if got != tt.want {
            t.Errorf("Square(%d) = %d, want %d", tt.input, got, tt.want)
        }
    })
}
```

### 10.4 Use Parallel & Shuffle Modes
- `t.Parallel()` in tests + `go test -parallel N` to speed up test suites
- `go test -shuffle=on` to detect order-dependent tests

### 10.5 Don't Sleep in Tests
Use synchronization primitives (channels, `sync.WaitGroup`), or retry loops with backoff instead of `time.Sleep`.

### 10.6 Use httptest and iotest
- `httptest.NewServer` for testing HTTP clients without real servers
- `iotest.ErrReader`, `iotest.HalfReader` for testing `io.Reader` error tolerance

### 10.7 Accurate Benchmarks
- Use `b.ResetTimer()` after setup code
- Avoid compiler optimizations: assign results to package-level vars
- Use `benchstat` for statistical comparison
- Re-create data per iteration for CPU-bound benchmarks

---

## 11. Optimizations

### 11.1 CPU Cache Awareness
- L1 cache is 50-100x faster than main memory
- CPUs fetch 64-byte **cache lines**, not individual words — enforce spatial locality
- Prefer slice of structs over struct of slices for sequential access
- Use predictable access patterns (unit stride) over random access (linked lists)

### 11.2 Avoid False Sharing
Lower-level CPU caches aren't shared across cores. Concurrent writes to adjacent memory locations cause cache line bouncing. Pad structs or separate hot fields.

### 11.3 Data Alignment
Order struct fields by size (descending) to minimize padding and reduce memory allocation:

```go
// ❌ Wastes memory (padding between fields)
type Bad struct {
    a bool    // 1 byte + 7 padding
    b int64   // 8 bytes
    c bool    // 1 byte + 7 padding
}             // Total: 24 bytes

// ✅ Compact (no padding)
type Good struct {
    b int64   // 8 bytes
    a bool    // 1 byte
    c bool    // 1 byte + 6 padding
}             // Total: 16 bytes
```

### 11.4 Stack vs. Heap
- Stack allocations are near-free (no GC pressure)
- Heap allocations require GC cleanup — minimize them
- Variables that **escape** a function (returned pointers, closures) go to heap
- Use `go build -gcflags="-m"` to inspect escape analysis

### 11.5 Reduce Allocations
- Design APIs to avoid sharing up (pass values, not pointers for small types)
- Use `sync.Pool` for frequently allocated/deallocated objects
- Leverage compiler optimizations (inlining, escape analysis)

### 11.6 Use Go Diagnostics
- **Profiling**: `pprof` for CPU, memory, goroutine, and block profiles
- **Execution tracer**: `go tool trace` for latency and scheduling analysis
- **GC tuning**: Understand `GOGC` and `GOMEMLIMIT` for workload-appropriate GC behavior

---

## Quick Reference Checklist

Use this before committing Go code in the Watermark project:

- [ ] No variable shadowing (run `go vet -shadow` or `golangci-lint`)
- [ ] Errors wrapped with `%w` and checked with `errors.Is`/`errors.As`
- [ ] All errors handled (no silently ignored returns)
- [ ] `defer` not used inside loops without helper functions
- [ ] Slices/maps pre-allocated when size is known
- [ ] Interfaces on consumer side, concrete types returned
- [ ] Context passed as first parameter, checked for cancellation
- [ ] Goroutines have a shutdown plan (context, WaitGroup, Close)
- [ ] No concurrent `append` or map writes without mutex
- [ ] `strings.Builder` for repeated string concatenation
- [ ] HTTP clients/servers have explicit timeouts
- [ ] Tests use `-race` flag and table-driven patterns
- [ ] Struct fields ordered by size for alignment

---

*Source: [100go.co](https://100go.co/) — "100 Go Mistakes and How to Avoid Them" by Teiva Harsanyi*
