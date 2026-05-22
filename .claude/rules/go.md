<!-- OPTIONAL: Remove this file if your project does not use Go. The /setup skill handles this automatically. -->
---
paths:
  - "**/*.go"
  - "go.mod"
  - "go.sum"
---

# Go Best Practices

## Package Layout
- Follow the standard Go project layout
- `cmd/` for application entrypoints (one `main.go` per binary)
- `internal/` for private application code (not importable by other modules)
- `pkg/` for public library code (if applicable)
- Keep packages small and focused on a single domain concept
- Package names should be short, lowercase, single-word: `auth`, `store`, `handler`

## Naming Conventions
- `PascalCase` for exported identifiers, `camelCase` for unexported
- Short variable names for narrow scope: `r` for reader, `w` for writer, `ctx` for context
- Descriptive names for wider scope: `userRepository`, `orderService`
- Interfaces named by behavior: `Reader`, `Writer`, `Validator`, `Handler`
- Avoid stuttering: `store.Store` not `store.StoreStore`

## Error Handling
- Always handle errors — never use `_` to discard errors
- Return errors as the last return value: `func Foo() (Result, error)`
- Wrap errors with context: `fmt.Errorf("creating user: %w", err)`
- Use sentinel errors for expected conditions: `var ErrNotFound = errors.New("not found")`
- Use custom error types for errors needing additional context
- Check errors with `errors.Is` and `errors.As`, not string comparison

## Interfaces
- Define interfaces where they're used, not where they're implemented
- Keep interfaces small: 1-3 methods
- Accept interfaces, return concrete types
- Use `io.Reader`, `io.Writer`, `fmt.Stringer` and other stdlib interfaces

## Concurrency
- Use goroutines for concurrent work, channels for communication
- Always use `context.Context` for cancellation and timeouts
- Use `sync.WaitGroup` for goroutine synchronization
- Protect shared state with `sync.Mutex` — prefer channel-based designs when natural
- Use `errgroup` for parallel work with error handling
- Never start goroutines without a way to stop them

## Testing
- Use the standard `testing` package
- Test files: `*_test.go` in the same package
- Table-driven tests for multiple cases
- Use `testify/assert` or `testify/require` for assertions
- Use `httptest` for HTTP handler tests
- Benchmark performance-critical code with `*testing.B`

## Code Quality
- Format with `gofmt` or `goimports` (enforced, not optional)
- Lint with `golangci-lint` (combines multiple linters)
- Run `go vet` for common mistakes
- Keep functions under 40 lines when practical
- Prefer early returns over deep nesting

## Dependencies
- Use Go modules (`go.mod`) for dependency management
- Keep the dependency tree shallow
- Vendor dependencies when reproducibility matters: `go mod vendor`
- Update with `go get -u` and verify with `go mod tidy`

## Patterns
- Use dependency injection (constructor functions, not globals)
- Use functional options for configurable constructors: `func WithTimeout(d time.Duration) Option`
- Prefer composition over inheritance (embed structs, implement interfaces)
- Use `context.Context` as the first parameter for cancellation and request-scoped values
