# Ci Cd Release

CI pipelines, preview environments, quality gates, release automation, rollback workflows, SBOM.

| Pack | Description | Path |
|---|---|---|
| `artifact-sbom-publisher` | Produces build artifacts with Software Bill of Materials (SBOM) and supply chain metadata for security and compliance. Use for "artifact publishing", "SBOM generation", "supply chain security", or "build provenance". | `.claude/workflows/ci-cd-release/artifact-sbom-publisher/RULE.md` |
| `deployment-checklist-generator` | Creates comprehensive deployment checklists with pre-deployment checks, smoke tests, verification steps, and sign-off workflows. Use for "deployment checklist", "release verification", "deployment runbook", or "production readiness". | `.claude/workflows/ci-cd-release/deployment-checklist-generator/RULE.md` |
| `github-actions-pipeline-creator` | Creates comprehensive GitHub Actions CI/CD workflows for linting, testing, building, and deploying. Includes caching strategies, matrix builds, artifact handling, and failure diagnostics. Use for "GitHub Actions", "CI pipeline", "workflow automation", or "continuous integration". | `.claude/workflows/ci-cd-release/github-actions-pipeline-creator/RULE.md` |
| `monorepo-ci-optimizer` | Optimizes CI pipelines for monorepos by detecting affected packages/apps and running only necessary builds and tests. Includes Turborepo/Nx strategies, caching, and parallel execution. Use for "monorepo CI", "affected detection", "incremental builds", or "workspace optimization". | `.claude/workflows/ci-cd-release/monorepo-ci-optimizer/RULE.md` |
| `preview-environments-builder` | Creates ephemeral preview deployments for each pull request with automatic deployment, unique URLs, and cleanup on PR close. Use for "preview deployments", "PR environments", "ephemeral environments", or "review apps". | `.claude/workflows/ci-cd-release/preview-environments-builder/RULE.md` |
| `quality-gates-enforcer` | Enforces minimum quality thresholds in CI including code coverage, linting, type checking, and security scanning. Provides required checks, PR rules, and automated enforcement. Use for "quality gates", "CI checks", "code quality", or "PR requirements". | `.claude/workflows/ci-cd-release/quality-gates-enforcer/RULE.md` |
| `release-automation-builder` | Automates releases and package publishing with changesets or semantic-release. Handles versioning, changelog generation, git tags, and release notes. Use for "release automation", "semantic versioning", "package publishing", or "changelog generation". | `.claude/workflows/ci-cd-release/release-automation-builder/RULE.md` |
| `rollback-workflow-builder` | Creates safe rollback procedures for deployments with automated workflows, rollback runbooks, version management, and incident response. Use for "rollback automation", "deployment recovery", "incident response", or "production rollback". | `.claude/workflows/ci-cd-release/rollback-workflow-builder/RULE.md` |

---

Tier-1 catalog: `.claude/workflows/catalog.md`. Tier-0 discovery rule: `.claude/rules/workflow-discovery.md`.
