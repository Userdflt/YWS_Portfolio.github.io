# Data Storage

Schema, migrations, seeding, integrity, retention, ORM patterns, query optimization, ETL.

| Pack | Description | Path |
|---|---|---|
| `backup-restore-runbook-generator` | Creates comprehensive disaster recovery procedures with automated backup scripts, restore procedures, validation checks, and role assignments. Use for "database backup", "disaster recovery", "data restore", or "DR planning". | `.claude/workflows/data-storage/backup-restore-runbook-generator/RULE.md` |
| `data-integrity-auditor` | Detects data integrity issues including orphaned records, broken foreign key relationships, constraint violations, and provides automated fix migrations. Use for "data integrity", "orphaned records", "broken relationships", or "data quality". | `.claude/workflows/data-storage/data-integrity-auditor/RULE.md` |
| `data-retention-archiving-planner` | Plans and implements data retention policies with archival strategies, compliance requirements, automated cleanup jobs, and cold storage migration. Use for "data retention", "data archival", "GDPR compliance", or "storage optimization". | `.claude/workflows/data-storage/data-retention-archiving-planner/RULE.md` |
| `data-seeding-fixtures-builder` | Generates deterministic seed data for development and testing with factory functions, realistic fixtures, and database reset scripts. Use for "data seeding", "test fixtures", "database seeding", or "mock data generation". | `.claude/workflows/data-storage/data-seeding-fixtures-builder/RULE.md` |
| `db-performance-watchlist` | Defines database performance monitoring strategy with slow query detection, resource usage alerts, query execution thresholds, and automated alerting. Use for "database monitoring", "performance alerts", "slow queries", or "DB metrics". | `.claude/workflows/data-storage/db-performance-watchlist/RULE.md` |
| `etl-sync-job-builder` | Designs reliable ETL and data synchronization jobs with incremental updates, idempotency guarantees, watermark tracking, error handling, and retry logic. Use for "ETL jobs", "data sync", "incremental sync", or "data pipeline". | `.claude/workflows/data-storage/etl-sync-job-builder/RULE.md` |
| `prisma-migration-assistant` | Plans and executes safe Prisma schema migrations with data backfills, rollback strategies, and SQL preview. Handles complex schema changes including data transformations. Use for "Prisma migrations", "schema changes", "database migrations", or "data backfills". | `.claude/workflows/data-storage/prisma-migration-assistant/RULE.md` |
| `redis-patterns` | Implements Redis patterns for caching, sessions, rate limiting, pub/sub, and distributed locks with best practices. Use when users request "Redis caching", "session storage", "rate limiter", "pub/sub messaging", or "distributed locks". | `.claude/workflows/data-storage/redis-patterns/RULE.md` |
| `schema-consistency-checker` | Audits database schemas for naming conventions, type consistency, nullability patterns, and missing constraints. Provides violations report with recommended fixes. Use for "schema validation", "database linting", "schema standards", or "consistency checks". | `.claude/workflows/data-storage/schema-consistency-checker/RULE.md` |
| `sql-query-optimizer` | Analyzes and optimizes SQL queries using EXPLAIN plans, index recommendations, query rewrites, and performance benchmarking. Use for "query optimization", "slow queries", "database performance", or "EXPLAIN analysis". | `.claude/workflows/data-storage/sql-query-optimizer/RULE.md` |

---

Tier-1 catalog: `.claude/workflows/catalog.md`. Tier-0 discovery rule: `.claude/rules/workflow-discovery.md`.
