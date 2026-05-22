# Scope Contract

Every plan saved to `.claude/plans/` after this rule lands must include a `Scope Contract` section. The Scope Contract makes the boundaries of the work explicit and records an audit baseline so drift can be detected deterministically by the `scope-guard` subagent.

The section must be located by its `## Scope Contract` heading. Position within the plan is conventional (immediately after `Module Map`) but `scope-guard` finds it by heading match, not position.

## Required Subsections

A Scope Contract has four required subsections in this order: `Audit Baseline`, `In-Scope`, `Non-Goals`, `Change-Trigger Policy`.

### Audit Baseline

- `Branch`: the branch the implementation will land on (e.g., `feature/scope-guard`)
- `Base commit`: the commit SHA the diff is taken from. Use `git rev-parse HEAD` at plan-approval time.
- `Diff range`: the exact range `scope-guard` should audit (e.g., `<base>..HEAD`, or `<base>..HEAD + uncommitted` if work is in progress)

If the baseline cannot be recorded (e.g., plan written before any branch exists), state `Audit Baseline: deferred — record before Step 6` so it is filled in before the audit step runs. `scope-guard` will refuse to audit a plan with a missing or `deferred` baseline.

### In-Scope

- List concrete file paths, module surfaces, or API endpoints the plan WILL change. **At least one concrete path is required** — purely behavioral entries like "label editor behavior" are rejected because they legitimize unbounded multi-file expansion.
- Behavior changes may be described **in addition to** the path list, but never as a substitute for it.
- Example acceptable entry: `src/<module>/<file>.ts — fix <specific bug>`
- Example rejected entry: `the handler behavior`

### Non-Goals

- List work that looks related but the plan WILL NOT address.
- Use this to defuse scope-creep candidates: adjacent files, related bugs, "while we're in here" refactors, follow-up cleanup that belongs in a different plan.
- If `Non-Goals` is empty, write `- None` explicitly. An empty subsection means the section was forgotten.

### Change-Trigger Policy

State exactly one default policy. Multiple policies may be listed only if each is paired with a trigger condition.

- **Stop and ask** — pause and confirm with the user before expanding scope. Default for most plans.
- **Log as follow-up** — finish the in-scope work, file the new item as a separate plan or task.
- **Expand inline** — only when the new work is a true blocker and the user has pre-authorized scope expansion.

## Allowed Local Companions

Some mechanical changes are routinely required by in-scope work and do not count as drift even when not separately listed in `In-Scope`:

- Test files that cover declared in-scope behavior (e.g., `foo.test.ts` next to `foo.ts`)
- Import/export updates required by a function rename or signature change in an in-scope file
- Barrel file updates (`index.ts` re-exports) when an in-scope module's public surface shifts
- Type-only updates in `types.ts` files that mirror an in-scope contract change
- Lockfiles and other auto-generated artifacts (`package-lock.json`, generated type files)

`scope-guard` reports these in its output but does not flag them as drift. If a "companion" change introduces new behavior beyond the mechanical adjustment, it is no longer a companion and must be declared.

## Classification Rules

`scope-guard` classifies every changed file into one of these buckets:

- **In-scope** — the file is on the In-Scope list. Pass.
- **Non-goal violation** — the file is on the Non-Goals list. Hard violation.
- **Allowed companion** — the file matches an Allowed Local Companion rule above. Note but do not flag.
- **Undeclared** — the file is on neither list and is not a companion. Drift; check whether the Change-Trigger Policy was followed.

For files where in-scope and out-of-scope changes are mixed in the same file, classification is per-hunk: in-scope hunks pass, out-of-scope hunks are evaluated against the Non-Goals and Change-Trigger Policy.

Renames and deletes must be explicitly declared in `In-Scope` — they are never companions.

## Migration Policy

- Plans approved on or after the date this rule lands must include a Scope Contract.
- Plans approved before that date run `scope-guard` in **advisory mode**: drift is reported but does not block.
- `plan-saver` flags missing Scope Contract sections on new plans as a hard fail and on legacy plans as advisory.
