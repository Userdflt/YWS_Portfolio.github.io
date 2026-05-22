
# Rules Index

## Always-loaded core rules (no `paths:` frontmatter)

- `clean-code.md` — Code quality standards (naming, SRP, DRY).
- `codequality.md` — Communication and change-quality meta-rules.
- `root-cause-debugging.md` — Fix root causes, not symptoms.
- `module-boundaries.md` — Import only via public entrypoints.
- `modular-code-generation.md` — One responsibility per file; split patterns.
- `project-structure.md` — Project directory layout (customized per project).
- `plan-lifecycle.md` — 6-step plan lifecycle (save, review, validate, incorporate, confirm, scope audit).
- `planning-output-contract.md` — Required sections in planning output.
- `output-brevity.md` — Global output compression: bullets over prose, no preambles, terse defaults.
- `scope-contract.md` — Audit Baseline, In-Scope, Non-Goals, Change-Trigger Policy format.
- `workstate-memory.md` — Two-lane work-state ledger (Lane A plan-todo status + Lane B `.claude/state/WORKSTATE.md`); schemas, eviction priority, supersession, privacy/merge.
- `workflow-discovery.md` — **Tier-0 rule enforcing tiered workflow-pack discovery** (`catalog.md` → `<category>/INDEX.md` → `<pack>/RULE.md`).
- `changelog.md` — Keep-a-Changelog maintenance.

## Discovered on demand

- Workflow catalog (Tier 1): `.claude/workflows/catalog.md`
- Per-category pack index (Tier 2): `.claude/workflows/<category>/INDEX.md`
- Workflow pack spec (Tier 3): `.claude/workflows/<category>/<pack>/RULE.md`
- Scoped language/framework rules: `.claude/rules/*.md` (with `paths:` frontmatter — auto-loaded when matching files are edited)
- Large references: `.claude/rules/guides/*.md`

Default behavior: select the smallest relevant set of rule files for the current task. Use the tiered discovery for workflow packs (see `workflow-discovery.md`).
