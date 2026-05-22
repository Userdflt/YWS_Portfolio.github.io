## Modular Code Generation (Always Apply)

### Core principle

- Prefer **small, focused modules** over "one huge file".
- Aim for **one responsibility per file** when practical.

### What counts as a "responsibility"

A responsibility is a distinct **reason to change**. Common examples:

- UI rendering vs state orchestration vs data fetching
- Input validation vs transformation/mapping vs persistence (database, local storage, etc.)
- External integration (third-party APIs, analytics, etc.) vs domain logic
- Parsing/formatting vs business rules vs side effects (I/O, network)

If you can describe the file as "it does X *and* Y", you likely have multiple responsibilities.

### Two-responsibility guideline (split before it grows)

When a file already has **two responsibilities**, strongly prefer splitting before adding more.

- **Default**: do not introduce a 3rd responsibility—extract a module first.
- **Allowed exception**: you may keep 3+ responsibilities **only if** it is clearly simpler and still maintainable (e.g., very small file, tightly coupled logic). In that case, include a brief justification in your response.

### The modular process (use this on every code-generating task)

Before writing code:

- Identify responsibilities in the change request.
- Propose a **module map** (a short list of file paths you'll create/update and what each owns).
- Ensure placement follows the project structure (see `project-structure.md`).

While implementing:

- Extract shared or reusable logic into appropriate shared locations.
- Prefer pure functions and dependency injection at module boundaries (avoid hidden cross-module side effects).
- Keep file exports tight: export what the rest of the app needs, not internals.

After implementing:

- Re-check files you touched: if any now hold 3+ responsibilities, split or justify.
- Verify module boundaries: import other modules only via their public entrypoints (see `module-boundaries.md`).

### Common split patterns

<!-- CUSTOMIZE: Replace or extend the patterns below to match your project's stack. -->

**TypeScript / React:**
- `features/<feature>/ui/<X>.tsx` (rendering)
- `features/<feature>/hooks/use<X>.ts` (state + orchestration)
- `features/<feature>/services/<x>.ts` (API calls / persistence)
- `features/<feature>/types.ts` (feature-local types)

**Python:**
- `app/<module>/routes.py` (HTTP handlers)
- `app/<module>/services.py` (business logic)
- `app/<module>/repository.py` (data access)
- `app/<module>/schemas.py` (validation / serialization)
- `app/<module>/models.py` (domain models)

**Go:**
- `internal/<module>/handler.go` (HTTP handlers)
- `internal/<module>/service.go` (business logic)
- `internal/<module>/repository.go` (data access)
- `internal/<module>/model.go` (domain types)

**Rust:**
- `src/<module>/handlers.rs` (HTTP handlers)
- `src/<module>/service.rs` (business logic)
- `src/<module>/repository.rs` (data access)
- `src/<module>/models.rs` (domain types)

**Java / Kotlin:**
- `src/main/java/<pkg>/<module>/controller/` (HTTP handlers)
- `src/main/java/<pkg>/<module>/service/` (business logic)
- `src/main/java/<pkg>/<module>/repository/` (data access)
- `src/main/java/<pkg>/<module>/model/` (domain types)

**API (any backend):**
- `api/<endpoint>/entry.*` (route registration)
- `api/<endpoint>/handler.*` (handler logic)
- `api/<endpoint>/services/` (endpoint-specific services)
- `api/shared/` (cross-endpoint utilities)

### Example (intent)

- Good: UI component file renders UI; data fetching lives in a service; validation lives in a helper.
- Bad: one file renders UI, fetches data, validates input, transforms payloads, and logs analytics.
