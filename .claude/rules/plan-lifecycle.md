# Plan Lifecycle

Every plan created in this project MUST follow this 6-step lifecycle. Do not skip steps.

**See also.** `agent-skills:planning-and-task-breakdown` (slash command `/plan`, available when the `agent-skills` plugin is installed). This rule is project-local *policy* — it governs *how* plans are persisted, reviewed, audited, and scope-checked. `agent-skills:planning-and-task-breakdown` is a domain *process* — it helps decide *what* a plan should contain (task decomposition, acceptance criteria, dependency ordering). Use both: let the plugin skill help shape the plan's content, then follow this rule to persist and audit it.

## Step 1: Save

- Save the plan to `.claude/plans/` immediately after drafting.
- Use a date-prefixed kebab-case name with `.plan.md` suffix (e.g., `2026-04-22-auth-refactor.plan.md`).
- Use YAML frontmatter with `name`, `overview`, and `todos` fields.
- If a plan with the same name exists, update it rather than creating a duplicate.

## Step 2: Review

Immediately after saving, send the plan for adversarial review. Use the first available mechanism — do not silently skip this step:

1. **Primary:** invoke `/codex-review <plan-path> --focus "completeness, scope, risk, dependency ordering"` to run a Codex-powered plan review.
2. **Fallback:** invoke the `codex:rescue` skill with the plan path and ask for a completeness / scope / risk / dependency-ordering critique.
3. **Second fallback:** delegate to the `code-reviewer` subagent via the Agent tool, framed as plan review (not code review): ask it to evaluate the plan for missing edge cases, under-scoped tasks, hidden dependencies, and unverifiable acceptance criteria.
4. **Last resort:** if none of the above are available, explicitly tell the user "no automated plan reviewer available — requesting direct human review" and present the plan for approval.

Plugin hooks enforce this order: `code-reviewer` / `security-reviewer` / `security-auditor` are denied until a Codex failure receipt exists in the session gate ledger.

Provide the full plan context in the review prompt: what we're doing, the pipeline of changes, key files, edge cases.

After the review returns, persist it verbatim to `.claude/reviews/<plan-name>.review.md` (create the directory if absent) so Step 3's per-finding Gate C adjudication and any later audit are reproducible. The fallback reviewers (`codex:rescue`, the `code-reviewer` subagent) must ALSO be told to self-verify every citation against the codebase and emit, per finding, the verbatim excerpt they observed at the cited `file:line` plus a `Verified: yes | no | not-applicable` status. There is no zero-evidence review path.

## Step 3: Validate

Step 3 is an ordered three-gate triage. For every finding in the persisted review, Claude evaluates the gates **in order**; a finding must pass all three to be implemented. Implementation (the Step 4 plan-body changes) does NOT begin until every finding has passed or been rejected at all three gates.

- **Gate A — Scope.** Does the finding fall inside the active plan's `Scope Contract` (In-Scope paths), or does it drift? An in-scope finding proceeds to Gate B. An out-of-scope finding is NOT silently implemented — it follows the plan's `Change-Trigger Policy` (Stop and ask / log as follow-up), even if the finding is correct.
- **Gate B — Leverage / relevance.** Classify the change as low-level (local, cosmetic, micro-correctness) vs high-level (design, contract, sequencing). Decide whether implementing it materially advances the plan's stated goal. A correct but goal-irrelevant or net-negative finding (churn, premature optimization, unrelated polish) is rejected with that reason — correctness alone is not sufficient to implement.
- **Gate C — Hallucination.** Mechanically verify the cited inline excerpt actually appears at the cited `file:line` (via Read/grep) and that the surrounding context substantively supports the claim. `Verified: no`, a missing excerpt, excerpt-not-found, or excerpt-present-but-context-mismatch → rejected. A rejected ungrounded finding cannot be rehabilitated by Claude vouching for it; if a real underlying issue is suspected, it must be logged as a NEW candidate finding requiring its own independent grounding and a reviewer re-run or explicit human review before it can be implemented — it does not pass Gate C on the strength of Claude's own assertion.

No bulk accept. No `partial`/`needs-info` escape hatch — every finding gets a per-gate outcome and a final verdict. Only findings passing A∧B∧C are handed to implementation.

**No-reviewer path:** if no reviewer (primary or fallback) could ground its findings, STOP for explicit human review. Do not inline self-grade — there is no path where Claude judges its own ungrounded findings.

## Step 4: Incorporate

- Write the per-finding adjudication note into the saved plan under a `## Review Adjudication` heading. One row per finding with columns: finding · Gate A (scope: in/out + policy action) · Gate B (level + advances-goal? + reason) · Gate C (excerpt verified y/n + how) · final verdict.
- Adopted findings (passed A∧B∧C) update the plan body.
- Rejected findings keep their failing gate recorded in the adjudication note (do not silently drop them).

## Step 5: Confirm

- Present the finalized plan to the user for approval before implementing.
- Do not begin implementation until the user explicitly confirms.

## Step 6: Scope Audit

- Before declaring implementation complete, invoke the `scope-guard` subagent against the saved plan.
- `scope-guard` reads the `Audit Baseline` from the Scope Contract and diffs the actual change range against the In-Scope, Non-Goals, and Change-Trigger Policy.
- If `scope-guard` reports drift:
  - Hard violation (non-goal touched, undeclared change with policy not followed) → resolve before marking work complete. Either revert the out-of-scope change, update the plan to expand scope (and re-run the audit), or split the drift into a follow-up plan.
  - Soft drift (undeclared change with policy followed) → note in the implementation report and proceed.
- For plans without a Scope Contract (legacy), `scope-guard` runs in advisory mode and the audit step is a report, not a gate.
- Do not skip Step 6. Marking work complete without a passing audit (or an explicit advisory pass) violates the lifecycle.

## Lane A — Work-State Status (additive)

Plan frontmatter `todos[]` carry a `status` field so work-state survives across
sessions (see `workstate-memory.md` for the canonical two-lane spec):

- `status: pending|in_progress|done|blocked|abandoned`. **Missing `status` ⇒
  `pending`** (backward-compatible; no retroactive backfill of historical plans).
- Each plan MAY include a `## Dead-Ends` section recording approaches tried and
  rejected, so they are not re-explored:
  `- [YYYY-MM-DD] Tried X for Y — rejected: <reason>. status: active`
- `.claude/state/ACTIVE_PLAN` points at the in-flight plan + todo
  (`<plan-path>#<todo-id>`, empty when none). The Stop hook
  (`workstate-session-end.sh`) reads this pointer and stamps that todo's
  `status` deterministically — no guessing which todo advanced.

This is additive to the 6-step lifecycle above; it does not alter Steps 1–6.
