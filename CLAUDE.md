# <!-- CUSTOMIZE: Project Name -->

<!-- CUSTOMIZE: One-line project description. Example: "Internal dashboard for monitoring production services." -->

## Tech Stack

<!-- CUSTOMIZE: List your tech stack. Delete the examples that don't apply.

Examples by stack:

**Node.js / React:**
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + Framer Motion
- **Backend**: Express / Fastify / Azure Functions
- **Database**: PostgreSQL + Prisma
- **Hosting**: Vercel / AWS / Azure

**Python:**
- **Framework**: FastAPI / Django / Flask
- **Language**: Python 3.12 + type hints
- **Database**: PostgreSQL + SQLAlchemy / Django ORM
- **Testing**: pytest + coverage
- **Hosting**: AWS Lambda / GCP Cloud Run

**Go:**
- **Framework**: net/http / Gin / Echo
- **Language**: Go 1.22+
- **Database**: PostgreSQL + pgx
- **Testing**: go test + testify
- **Hosting**: Kubernetes / Cloud Run

**Rust:**
- **Framework**: Axum / Actix-web
- **Language**: Rust (stable)
- **Database**: PostgreSQL + sqlx
- **Testing**: cargo test
- **Hosting**: Docker / bare metal

**Java/Kotlin:**
- **Framework**: Spring Boot 3 / Quarkus
- **Language**: Java 21 / Kotlin
- **Database**: PostgreSQL + JPA/Hibernate
- **Testing**: JUnit 5 + Mockito
- **Hosting**: Kubernetes / AWS ECS
-->

## Architecture

<!-- CUSTOMIZE: Describe your architecture in 3-5 bullet points. Examples:

- Frontend calls /api/* endpoints — never calls external APIs directly.
- App.tsx is the root shell with routing, auth guards, and layout.
- Feature modules live under features/ with index.ts entrypoints.
- Services are stateless; state lives in the database.
- Background jobs run via a queue worker separate from the web server.
-->

## Key Conventions

<!-- CUSTOMIZE: List your project's coding conventions. Examples:

- **Module pattern**: each module in `modules/<name>/` with `index.ts` public entrypoint
- **Import boundary**: import modules only via their public entrypoint
- **Shared layers**: `components/`, `hooks/`, `services/`, `utils/` for cross-module code
- **API pattern**: controllers handle HTTP, services handle business logic, repositories handle data
- **Error handling**: custom error types with error codes, never swallow exceptions
-->

## Scripts

<!-- CUSTOMIZE: List your common dev commands. Examples:

- `npm run dev` — Dev server
- `npm run build` — Production build
- `npm run test` — Run tests
- `npm run lint` — Lint

Or for Python:
- `make dev` — Start dev server
- `make test` — Run pytest
- `make lint` — Run ruff + mypy
- `make build` — Build distribution

Or for Go:
- `go run ./cmd/server` — Start dev server
- `go test ./...` — Run tests
- `golangci-lint run` — Lint
- `go build ./...` — Build
-->

## Branching

<!-- CUSTOMIZE: Your branching model. Common patterns:

**GitHub Flow (simple):**
- `main` — production
- Feature branches: `feature/<description>`
- All changes via PRs

**Git Flow (structured):**
- `main` — production
- `develop` — integration branch
- Feature branches: `feature/<description>`
- Hotfix branches: `hotfix/<description>`
- Release branches: `release/<version>`

**Trunk-based:**
- `main` — production (deploy on merge)
- Short-lived feature branches
- Feature flags for incomplete work
-->

## Output Style

Respond like a direct engineer, not a helpful assistant. Cut filler, keep substance.

- Drop: articles (a/an/the) where clarity allows, filler words (just/really/basically/actually), pleasantries, hedging, sycophantic openers
- Use: fragments, bullet points, short synonyms. Technical terms stay exact.
- Pattern: [thing] [action] [reason]. Next step.
- Code blocks: unchanged — never compress code itself
- Structure: keep headers/sections when a skill requires them, but each section uses bullets not paragraphs
- Default: terse. If user requests `--verbose` or "explain in detail", switch to full prose for that response only.

## Rules

Scoped rules in `.claude/rules/` activate by file path. Workflow packs in `.claude/workflows/` load on demand. See `.claude/rules/rules-index.md`.

## Subagents

Custom agents in `.claude/agents/`. See `.claude/rules/guides/subagent-playbook.md` for when to use each one.
