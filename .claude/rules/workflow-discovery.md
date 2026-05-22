# Workflow Discovery

**Before claiming a workflow or capability is unavailable, you MUST consult the catalog.**

The template ships **155 workflow packs across 14 categories**. None are announced at session start — that would cost thousands of tokens per fresh session. Instead, packs are discovered on demand through three tiers:

## Three-Tier Discovery

1. **Tier 1 — `.claude/workflows/catalog.md`** lists the 14 categories with one-line coverage summaries. Read this first when a task might benefit from a workflow pack.

2. **Tier 2 — `.claude/workflows/<category>/INDEX.md`** lists every pack in that category with a one-line description and its full path. Read only the index for the category that matched Tier 1.

3. **Tier 3 — `.claude/workflows/<category>/<pack>/RULE.md`** is the canonical long-form spec for a specific pack. Read only the pack(s) you selected from Tier 2.

## Required Behavior

- **Do not open a pack's `RULE.md` directly** without going through Tier 1 → Tier 2 first. Direct reads waste tokens and skip the selection step.
- **Do not claim "no workflow exists for X"** without having read Tier 1 and at least one relevant Tier 2 `INDEX.md`. Anemic searches against `catalog.md` alone are insufficient.
- **Stop at the first sufficient tier.** If the user explicitly names a pack ("use the `threat-model-generator` workflow"), skip Tier 1 and go directly to Tier 2 or Tier 3 for that pack.

## Worked Example

User says: "I need to set up rate limiting and abuse protection for an API."

1. Read `.claude/workflows/catalog.md` → finds `security-compliance` category matches.
2. Read `.claude/workflows/security-compliance/INDEX.md` → finds `rate-limiting-abuse-protection` pack.
3. Read `.claude/workflows/security-compliance/rate-limiting-abuse-protection/RULE.md` → follow the pack's phased guidance.

Total: 3 explicit Read calls. The Tier-0 rule (this file) is already in context — no Read needed for it.

## User-invocable Skills vs Workflow Packs

Skills in `.claude/skills/` are a separate, complementary surface:

- **Skills** (~15, including `/setup`, `/adr-writer`, `/changelog-writer`, etc.) are announced at session start with their descriptions. Slash-invocable. Use them directly when the task matches.
- **Workflow packs** (the remaining ~144) are discovered via the tiered catalog above. Not slash-invocable. Claude finds them by content match against catalog and index.

If a slash skill matches, use it — no catalog lookup needed.

## Complementary: `agent-skills` Plugin

If the `agent-skills` plugin is installed, its lifecycle skills (spec → plan → build → test → review → ship) are also announced at session start under the `agent-skills:` namespace and via slash commands `/spec`, `/plan`, `/build`, `/test`, `/review`, `/code-simplify`, `/ship`. These cover *lifecycle processes*; the template's workflow packs cover *domain tasks*. No conflict — each has its own discovery path.

## When This Rule Applies

- Any task where the user describes a goal or domain that could map to a workflow pack (auth, DB, tests, CI, deployment, perf, observability, docs, etc.).
- Any task where you're about to say "the template doesn't have X" or "I'll do X manually".

## When This Rule Does NOT Apply

- Purely conversational or informational queries ("what does git rebase do?").
- Tasks covered by slash skills already in the announced list.
- Tasks where the relevant pack name is mentioned explicitly by the user.
