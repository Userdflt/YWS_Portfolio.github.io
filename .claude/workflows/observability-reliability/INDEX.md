# Observability Reliability

Logging, alerting, dashboards, incident response, postmortems, error handling.

| Pack | Description | Path |
|---|---|---|
| `alerting-dashboard-builder` | Creates SLO-based alerts and operational dashboards with key charts, alert thresholds, and runbook links. Use for "alerting", "dashboards", "SLO", or "monitoring". | `.claude/workflows/observability-reliability/alerting-dashboard-builder/RULE.md` |
| `error-handling-standardizer` | Creates consistent error handling with custom error classes, HTTP status mapping, structured logging, safe client messages, and error taxonomy. Use when standardizing "error handling", "logging", "error responses", or "exception management". | `.claude/workflows/observability-reliability/error-handling-standardizer/RULE.md` |
| `incident-runbook-generator` | Creates step-by-step incident response runbooks for common outages with actions, owners, rollback procedures, and communication templates. Use for "incident runbook", "outage response", "incident management", or "on-call procedures". | `.claude/workflows/observability-reliability/incident-runbook-generator/RULE.md` |
| `observability-setup` | Implements comprehensive observability with OpenTelemetry tracing, Prometheus metrics, and structured logging. Includes instrumentation plans, sample dashboards, and alert candidates. Use for "observability", "monitoring", "tracing", or "metrics". | `.claude/workflows/observability-reliability/observability-setup/RULE.md` |
| `postmortem-writer` | Creates comprehensive post-incident documents with timeline, root cause analysis, contributing factors, action items, and ownership. Follows SRE best practices for blameless postmortems. Use for "postmortem", "incident review", "RCA", or "post-incident". | `.claude/workflows/observability-reliability/postmortem-writer/RULE.md` |
| `reliability-strategy-builder` | Implements reliability patterns including circuit breakers, retries, fallbacks, bulkheads, and SLO definitions. Provides failure mode analysis and incident response plans. Use for "SRE", "reliability", "resilience", or "failure handling". | `.claude/workflows/observability-reliability/reliability-strategy-builder/RULE.md` |
| `structured-logging-standardizer` | Enforces consistent structured logging with request correlation IDs, standardized log schema, middleware integration, and best practices. Use for "structured logging", "log standardization", "request tracing", or "log correlation". | `.claude/workflows/observability-reliability/structured-logging-standardizer/RULE.md` |

---

Tier-1 catalog: `.claude/workflows/catalog.md`. Tier-0 discovery rule: `.claude/rules/workflow-discovery.md`.
