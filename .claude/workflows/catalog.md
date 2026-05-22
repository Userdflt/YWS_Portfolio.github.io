# Workflow Catalog (Tier 1)

**Enforcement rule:** `.claude/rules/workflow-discovery.md` (always loaded). Consult this catalog BEFORE claiming a workflow is unavailable or opening individual `RULE.md` files.

## How to use

1. Find the category that matches the task below.
2. Read that category's `INDEX.md` (Tier 2) to pick a specific pack.
3. Read the selected pack's `RULE.md` (Tier 3) for the full spec.

Total: **155 workflow packs across 14 categories**.

---

## Categories

### AI / LLM / Prompting
LLM integration, RAG, prompt engineering, embeddings, evaluation, and agent orchestration. (15 packs.)
Index: `.claude/workflows/ai-llm-prompting/INDEX.md`

### API Backend
HTTP/GraphQL/WebSocket endpoint design, documentation, mocking, contracts, and versioning. (9 packs.)
Index: `.claude/workflows/api-backend/INDEX.md`

### API Tooling & Clients
API client collections and request runners (Postman, Insomnia, Bruno, cURL, REST Client). (5 packs.)
Index: `.claude/workflows/api-tooling-clients/INDEX.md`

### Architecture & Design
System design, domain modeling, service boundaries, background jobs, refactors, migrations. (8 packs.)
Index: `.claude/workflows/architecture-design/INDEX.md`

### CI / CD / Release
CI pipelines, preview environments, quality gates, release automation, rollback workflows, SBOM. (8 packs.)
Index: `.claude/workflows/ci-cd-release/INDEX.md`

### Data & Storage
Schema, migrations, seeding, integrity, retention, ORM patterns, query optimization, ETL. (10 packs.)
Index: `.claude/workflows/data-storage/INDEX.md`

### DevOps & Infrastructure
Container, Kubernetes, Nginx, and Terraform configuration and optimization. (4 packs.)
Index: `.claude/workflows/devops-infra/INDEX.md`

### Docs & Communication
READMEs, ADRs, RFCs, changelogs, diagrams, codebase summaries, code explanations. (9 packs.)
Index: `.claude/workflows/docs-communication/INDEX.md`

### Frontend / UI
Components, layouts, state, data fetching, styling, accessibility, and animations. (19 packs.)
Index: `.claude/workflows/frontend-ui/INDEX.md`

### Observability & Reliability
Logging, alerting, dashboards, incident response, postmortems, error handling. (7 packs.)
Index: `.claude/workflows/observability-reliability/INDEX.md`

### Performance & Scalability
Profiling, caching, load testing, capacity planning, Core Web Vitals, cost/latency. (12 packs.)
Index: `.claude/workflows/performance-scalability/INDEX.md`

### Project & Tooling
Project setup, linters/formatters, dependencies, monorepo, git hygiene, tech debt, scaffolding. (16 packs.)
Index: `.claude/workflows/project-tooling/INDEX.md`

### Security & Compliance
Auth, RBAC, OAuth/OIDC, secrets, input validation, rate limiting, threat modeling, headers. (20 packs.)
Index: `.claude/workflows/security-compliance/INDEX.md`

### Testing & QA
Unit, integration, E2E, contract, visual regression, coverage, mocking, flaky-test triage. (13 packs.)
Index: `.claude/workflows/testing-qa/INDEX.md`

---

## Selection Guidance

- **Most projects benefit from:** `testing-qa`, `docs-communication`, `project-tooling`, `frontend-ui` (if it has a UI).
- **Use selectively when the task matches:** `api-backend`, `security-compliance`, `observability-reliability`, `performance-scalability`, `data-storage`.
- **Load only when explicitly needed:** `devops-infra`, `ai-llm-prompting`, `ci-cd-release`, `architecture-design`, `api-tooling-clients`.

## Complementary Surfaces

- **User-invocable skills** at `.claude/skills/` (15 total, slash-invocable). Announced at session start. If a slash skill matches the task, use it directly — no catalog lookup needed.
- **`agent-skills` plugin** (optional, user-installed) provides lifecycle skills (spec → plan → build → test → review → ship) under the `agent-skills:` namespace, with slash commands `/spec`, `/plan`, `/build`, `/test`, `/review`, `/code-simplify`, `/ship`. Complementary, not redundant.
- **Scoped rules** at `.claude/rules/*.md` (path-activated). Loaded automatically when Claude edits a matching file.
- **Core rules** at `.claude/rules/*.md` without `paths:` frontmatter. Always loaded. See `.claude/rules/rules-index.md`.

## Subagent Selection

See `.claude/rules/guides/subagent-playbook.md` for deciding between the 13 template subagents, the 3 plugin subagents (if `agent-skills` is installed), and the built-in generic agents.
