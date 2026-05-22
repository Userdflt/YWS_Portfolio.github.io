<!-- OPTIONAL: Remove this file if your project does not use Rust. The /setup skill handles this automatically. -->
---
paths:
  - "**/*.rs"
  - "Cargo.toml"
  - "Cargo.lock"
---

# Rust Best Practices

## Project Structure
- `src/main.rs` for binary crates, `src/lib.rs` for library crates
- Use modules (`mod`) to organize code by domain
- `src/<module>/mod.rs` or `src/<module>.rs` for module files
- Workspace (`Cargo.toml` with `[workspace]`) for multi-crate projects
- Keep `pub` visibility tight — only export what the API needs

## Naming Conventions
- `snake_case` for functions, methods, variables, modules, crates
- `PascalCase` for types, traits, enum variants
- `UPPER_SNAKE_CASE` for constants and statics
- Prefix private fields with no underscore (visibility is controlled by `pub`)
- Descriptive names: `user_count` not `n`, `is_valid` not `ok`

## Ownership and Borrowing
- Prefer borrowing (`&T`, `&mut T`) over owning when the function doesn't need ownership
- Use `Clone` sparingly — understand why you need it
- Prefer `&str` over `String` in function parameters
- Use lifetimes only when the compiler can't infer them
- Avoid `Rc`/`Arc` unless shared ownership is genuinely needed

## Error Handling
- Use `Result<T, E>` for recoverable errors, not panics
- Create custom error types with `thiserror` for libraries
- Use `anyhow` for application-level error handling
- Propagate errors with `?` operator
- Add context with `.context("what failed")` (anyhow) or `.map_err()`
- Reserve `unwrap()`/`expect()` for genuinely impossible cases, with a message

## Option Handling
- Use `Option<T>` instead of null/sentinel values
- Chain with `.map()`, `.and_then()`, `.unwrap_or_default()`
- Use `if let Some(x) = ...` or `match` for control flow
- Avoid `.unwrap()` in production code

## Traits and Generics
- Define traits for shared behavior across types
- Prefer trait bounds over trait objects (`impl Trait` or `<T: Trait>` over `dyn Trait`)
- Use `dyn Trait` only when dynamic dispatch is needed (heterogeneous collections, plugin systems)
- Implement standard traits: `Debug`, `Display`, `Clone`, `PartialEq` where appropriate
- Use `derive` macros for common trait implementations

## Testing
- Unit tests in `#[cfg(test)] mod tests` at the bottom of each file
- Integration tests in `tests/` directory
- Use `#[test]`, `assert!`, `assert_eq!`, `assert_ne!`
- Use `#[should_panic]` for expected panics
- Test with `cargo test` — runs unit, integration, and doc tests
- Use `proptest` or `quickcheck` for property-based testing

## Concurrency
- Use `tokio` or `async-std` for async I/O
- Prefer `async/await` over threads for I/O-bound work
- Use `Arc<Mutex<T>>` or `Arc<RwLock<T>>` for shared mutable state
- Use channels (`tokio::sync::mpsc`, `crossbeam`) for message passing
- Avoid `unsafe` unless absolutely necessary, with a `// SAFETY:` comment

## Dependencies
- Keep `Cargo.toml` dependencies minimal
- Pin versions for reproducibility
- Audit with `cargo audit` for known vulnerabilities
- Use `cargo clippy` for idiomatic code suggestions
- Format with `cargo fmt` (enforced, not optional)

## Performance
- Profile before optimizing — use `cargo flamegraph` or `perf`
- Prefer stack allocation over heap when sizes are known
- Use iterators over indexed loops — they optimize well
- Avoid unnecessary allocations: reuse buffers, use `Cow<str>`
