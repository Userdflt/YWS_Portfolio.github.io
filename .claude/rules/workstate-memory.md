# Work-State Memory (Ledger)

Per-project work-state memory that survives across sessions and is injected at
session start so Claude is aware of prior work (open threads, decisions made,
dead-ends ruled out, deferred items) and stops redoing / reverting / re-exploring
it. Schema- and hook-driven; no project-specific code.

This is the **canonical spec**. It is always-loaded (no `paths:` frontmatter).

## Two-Lane Model

- **Lane A — structured (planned work).** Plan frontmatter `todos[].status` +
  per-plan `## Dead-Ends` section + an active-plan pointer
  (`.claude/state/ACTIVE_PLAN`). Owned by the plan lifecycle (`plan-lifecycle.md`
  Step 6). The Stop hook stamps the pointed-at todo deterministically.
- **Lane B — ambient (unplanned work).** `.claude/state/WORKSTATE.md`, fixed
  schema, hook-maintained: Open Threads / Decisions / Dead-Ends / Deferred.
  Captures work that has no plan (debugging, decisions, abandoned approaches).

Lanes are disjoint: planned work never duplicated into Lane B; Lane B never
re-records what git or a plan already owns.

## Distinction from `memory/`

`memory/` is **knowledge memory** (durable facts/preferences). This ledger is
**work-state memory** (status, rationale, tried-and-rejected). They do not
overlap and are never merged. Editing `memory/` from this feature is forbidden.

## Canonical Schemas

Lane A — plan frontmatter todo:
```yaml
- id: 3
  title: "..."
  status: in_progress   # pending|in_progress|done|blocked|abandoned
```
`status` absent ⇒ treated as `pending` (backward-compatible; no backfill).

Lane A — per-plan section:
```markdown
## Dead-Ends
- [2026-05-19] Tried X for Y — rejected: <reason>. status: active
```

Lane B — `.claude/state/WORKSTATE.md`. **Section order is fixed and load-
bearing: `## Open Threads` is LAST and is the canonical breadcrumb sink.**
```markdown
## Decisions
- [2026-05-19] Chose A over B — <reason>. status: active   # active|superseded
  superseded_by: <id|->   last_verified: 2026-05-19
## Dead-Ends
- [2026-05-19] Tried X — rejected: <reason>. status: active
## Deferred
- [2026-05-19] <item> — why deferred: <reason>
## Open Threads
- [2026-05-19] <thread> — next: <action>
```
`## Open Threads` is last so a plain EOF append always lands in it. Breadcrumbs
are appended at end-of-file, oldest-first (append order); the SessionStart
reader is order-agnostic (it grabs a section's bullets until the next `## ` or
EOF), so the trailing position of Open Threads is read correctly.

Lane A — active-plan pointer (`.claude/state/ACTIVE_PLAN`), one line, may be empty:
```
.claude/plans/2026-05-19-idea-workstate-ledger.plan.md#5
```
Format: `<plan-path>#<todo-id>`. Empty/unset = no in-flight todo to stamp.

SessionStart digest (emitted JSON):
```json
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"<compacted text>"}}
```

## Supersession Rules

- Decisions and Dead-Ends carry `status: active|superseded`.
- A correction does not delete the old entry: set old `status: superseded`,
  add `superseded_by: <new-id|->`, append the new entry as `status: active`.
- `last_verified: YYYY-MM-DD` records when an active entry was last reaffirmed.
- Superseded entries stay in the file for audit; excluded from the digest.

## Eviction (deterministic — byte/line arithmetic only, no token estimation)

Hard budget: **`WORKSTATE_MAX_BYTES`** (default `6000`, env-overridable) on the
total injected digest. Trim from the bottom up by this priority (1 = keep first):

1. Open Threads — never evicted
2. Blocked todos — never evicted
3. Dead-Ends with `status: active` — sticky; never evicted
4. Decisions with `status: active` — never evicted
5. Deferred items — cap N; oldest overflow collapses to one pointer line
6. Done/abandoned — collapse to one line `N resolved (see git/plans)`
7. Superseded Dead-Ends/Decisions — excluded from the digest entirely

Corrupt or missing state ⇒ no injection, never break startup.

## Privacy / Merge Policy

- The git-tracked ledger MUST NOT contain secrets, env values, credentials, or
  transcript content verbatim. Hooks write schema-shaped summaries only.
- Lane B capture is **lock-free atomic single-line append**: the Stop hook
  flattens the breadcrumb to ONE line with no newlines/controls, clamps it
  well under `PIPE_BUF` (4096B), and `printf >> WORKSTATE.md` (O_APPEND). POSIX
  guarantees a sub-`PIPE_BUF` O_APPEND write is atomic, so concurrent Stop
  hooks never interleave or lose entries — there is NO mutex, NO tmp+mv, NO
  insert-under-header rewrite for Lane B. (Supersession is still an append +
  a status flip on the old line, done by Claude, not the hook.)
- Capture is **best-effort**: a corrupt/binary existing file or an oversized
  entry is skipped silently; capture never blocks stopping (always exit 0).
- The `ACTIVE_PLAN` pointer and Lane A plan stamping use **atomic tmp + mv**
  (never a partial in-place write); Lane A needs no lock (per-plan, idempotent).
- Append-only minimises merge conflicts; conflicts that do occur resolve by
  keeping both entries (union) — work-state is additive.
- Per-project isolation only; no cross-project or shared ledger.

## Lifecycle Hooks

- `.claude/hooks/workstate-session-start.sh` — SessionStart: compact + inject.
- `.claude/hooks/workstate-session-end.sh` — Stop: lock-free atomic EOF append
  of a one-line Lane B breadcrumb (into the last `## Open Threads` section) +
  stamp Lane A via the validated ACTIVE_PLAN pointer.

Both always `exit 0`; a hook failure never breaks a session.
