# Architecture Design

System design, domain modeling, service boundaries, background jobs, refactors, migrations.

| Pack | Description | Path |
|---|---|---|
| `background-jobs-designer` | Designs background job processing systems with queue integration (BullMQ/Celery), job definitions, retry policies, exponential backoff, idempotent execution, and monitoring hooks. Use when implementing "background jobs", "task queues", "async processing", or "job workers". | `.claude/workflows/architecture-design/background-jobs-designer/RULE.md` |
| `domain-model-boundaries-mapper` | Identifies domain modules, ownership boundaries, dependencies, and interfaces using Domain-Driven Design principles. Provides domain maps, bounded contexts, refactor recommendations. Use for "DDD", "domain modeling", "bounded contexts", or "service boundaries". | `.claude/workflows/architecture-design/domain-model-boundaries-mapper/RULE.md` |
| `event-driven-architect` | Designs event-driven architectures with event sourcing, CQRS, pub/sub patterns, and domain events for decoupled systems. Use when users request "event sourcing", "CQRS", "domain events", "pub/sub", or "event-driven". | `.claude/workflows/architecture-design/event-driven-architect/RULE.md` |
| `frontend-refactor-planner` | Creates safe refactor plans for messy UI code including component splitting strategies, state simplification, performance optimizations, and accessibility improvements. Provides phased approach, risk assessment, and "done" criteria. Use when refactoring "legacy code", "messy components", "performance issues", or "large files". | `.claude/workflows/architecture-design/frontend-refactor-planner/RULE.md` |
| `migration-planner` | Builds phased data and system migrations using feature flags, dual writes, backfills, and validation. Includes rollback plans and risk mitigation. Use for "data migration", "system migration", "database migration", or "platform migration". | `.claude/workflows/architecture-design/migration-planner/RULE.md` |
| `queue-job-processor` | Implements background job processing with BullMQ/Redis including job queues, workers, scheduling, retries, and monitoring. Use when users request "background jobs", "queue processing", "async tasks", "BullMQ", or "job scheduler". | `.claude/workflows/architecture-design/queue-job-processor/RULE.md` |
| `service-layer-extractor` | Refactors route handlers into service layer with clean boundaries, dependency injection, testability, and separation of concerns. Provides service interfaces, folder structure, testing strategy, and migration plan. Use when refactoring "fat controllers", "business logic", "service layer", or "architecture cleanup". | `.claude/workflows/architecture-design/service-layer-extractor/RULE.md` |
| `system-design-generator` | Produces comprehensive system architecture plans for features and products including component breakdown, data flow diagrams, system boundaries, API contracts, and scaling considerations. Use for "system design", "architecture planning", "feature design", or "technical specs". | `.claude/workflows/architecture-design/system-design-generator/RULE.md` |

---

Tier-1 catalog: `.claude/workflows/catalog.md`. Tier-0 discovery rule: `.claude/rules/workflow-discovery.md`.
