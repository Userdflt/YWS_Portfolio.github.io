# Subagent Playbook

Use this guide when a task could benefit from a dedicated subagent instead of one long default-agent run. Custom subagents live in `.claude/agents/` and can be invoked by name or automatically by the agent.

## Custom project subagents (13)

- `debugger` — Application debugger. Use when debugging failures across the application stack, tracing request flows, identifying contract mismatches, or diagnosing data pipeline issues.
- `shell-runner` — Command/output collector. Use for Bash, Read, Grep, Glob, raw logs, git inspection, and repository evidence collection. Preserves exact relevant output and avoids diagnosis by default.
- `verifier` — Convention validator. Use after tasks are marked done to confirm module boundaries, type contracts, and architectural patterns. Read-only.
- `prompt-editor` — Prompt system editor. Use when modifying LLM prompts, updating prompt pipelines, changing output parsing, or adjusting prompt-adjacent configuration.
- `feature-builder` — Feature module builder. Use when implementing new features under the project's module structure, adding feature-scoped components/hooks/services, or extending existing feature modules.
- `api-builder` — API endpoint builder. Use when creating new API endpoints, modifying handlers, or adding shared server utilities.
- `refactor-planner` — Repo-wide refactor planner. Use when a task needs a phased restructuring plan, ownership cleanup, module splitting, or rule-aware consolidation. Read-only.
- `change-docs-writer` — Change documentation specialist. Use when drafting changelog entries, release notes, or post-change documentation reports.
- `cleanup-planner` — Cleanup planning specialist. Use when identifying obsolete paths, removal gates, and concrete cleanup plans during refactors or migrations. Read-only.
- `plan-saver` — Plan persistence enforcer. Use proactively when writing plans, exiting plan mode, or completing any planning task to ensure the plan is saved to the project's `.claude/plans/` directory. Read-only.
- `scope-guard` — Scope-drift reviewer. Use as Step 6 of the plan lifecycle to diff actual changes against the plan's `Scope Contract` and `Audit Baseline`, and flag any work that crossed declared boundaries. Read-only.
- `test-writer` — Test writer. Use when writing unit tests, integration tests, or adding test coverage to existing modules.
- `security-reviewer` — Security reviewer. Use when reviewing code for security vulnerabilities, especially around API key handling, authentication, authorization, input validation, and AI-specific risks like prompt injection. Read-only.

## Plugin-provided subagents (optional, via `agent-skills` plugin)

When the `agent-skills` plugin is installed (<https://github.com/addyosmani/agent-skills>), three additional subagents become available. They coexist with the template's 13 custom agents — the template's agents encode *project-specific guardrails*, the plugin's agents encode *domain processes*. Use both.

- `agent-skills:code-reviewer` — Five-axis code review (correctness, readability, architecture, security, performance). Use before merging any change. Overlaps with template's `verifier` agent: use `verifier` for convention/boundary checks specific to this project; use `agent-skills:code-reviewer` for general quality-gate review.
- `agent-skills:security-auditor` — OWASP / threat-model focused security review. Overlaps with template's `security-reviewer`: use `security-reviewer` for AI-specific + project-scoped risks; use `agent-skills:security-auditor` for general web-app hardening.
- `agent-skills:test-engineer` — TDD process and test quality rubrics. Overlaps with template's `test-writer`: use `test-writer` for project test conventions; use `agent-skills:test-engineer` for red/green/refactor methodology and coverage strategy.

## Built-in subagent selection

- Use `Explore` agent for repo discovery, file ownership, and tracing flows across modules and layers.
- Use `Plan` agent for designing implementation strategies and architectural plans.
- Use `general-purpose` agent for complex multi-step tasks that need autonomy.

## Mandatory Delegation Rules

Do NOT perform these task types inline in the main thread. ALWAYS delegate via the Agent tool with the specified `subagent_type`. The subagent has the correct model pin for cost-optimal execution.

| Task | Subagent | Model |
| ---- | -------- | ----- |
| Implementing plan tasks, features, new modules | `feature-builder` | Opus |
| Creating or modifying API endpoints | `api-builder` | Opus |
| Bash, Read, Grep, Glob, logs, git inspection, raw evidence collection | `shell-runner` | Sonnet |
| Writing, fixing, or expanding tests | `test-writer` | Sonnet |
| Deep debugging, root-cause analysis | `debugger` | Opus |
| Planning refactors or restructures | `refactor-planner` | Opus |
| Code review (primary) | `/agent:codex-review` | External |
| Code review (fallback if Codex unavailable) | `code-reviewer` | Sonnet |

**Skip threshold:** Delegate when the task involves **3+ file edits, non-trivial logic, or command/file output that will affect implementation decisions**. Trivial changes (single-line fix, config tweak, typo) and tiny local inspections under ~20 lines can stay inline.

## Defaults

- Prefer custom project subagents over generic built-in subagents when the task matches a custom subagent's description.
- Load project-specific scoped rules from `.claude/rules/` before reaching for generic workflow packs.
