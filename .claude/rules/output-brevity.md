# Output Brevity Contract

This rule applies globally to all outputs — plans, reviews, reports, skill responses, and agent responses.

## Defaults

- Bullet points over paragraphs. One line per point.
- No preambles ("Sure, I'll...", "Let me explain..."). Start with the answer.
- No trailing summaries unless explicitly requested.
- Section headers: keep them. Section content: terse bullets, not prose.
- Max 3 sentences per explanation. If it needs more, it's a list.
- Code references: `file:line` format, no surrounding prose.

## Hard Limits (enforced)

- **Default response budget:** ≤120 words OR ≤15 lines, whichever comes first.
- **Tool-use narration:** one short sentence before a tool call, none after unless the result changes plan. No "Let me…", no recap of what the tool returned.
- **Bullets:** ≤12 words per bullet. If a bullet needs a sub-bullet, the parent is probably overstuffed — split.
- **Headers:** only when the response has ≥3 distinct sections. A single section never needs a header.
- **Code blocks:** never compressed. They don't count toward the word budget.
- **Lists of items the user asked for** (e.g., "list all X"): no budget — content is the deliverable.

## Self-Check Gate (run before sending)

Before emitting any non-code response, verify:

1. First sentence is the answer or first action — not a preamble.
2. Word count ≤ budget (or task is on the no-budget list).
3. No restatement of the user's question.
4. No trailing "let me know if…" / "hope this helps" / "summary:" closer.
5. Every bullet earns its line — no filler, no parallel hedges.

If any check fails, cut before sending. Cutting > rewriting.

## Plugin Enforcement

The `agent` plugin injects a compact version of this policy via UserPromptSubmit hook (`hooks/brevity-reminder.sh`) on every turn. Bypass with `[verbose]` in the prompt, `--verbose`, "explain in detail", or by using the RFC/ADR/postmortem skills above.

## Exceptions (verbose allowed)

These output types may use full prose when the content genuinely requires it:
- RFC documents (`/agent:rfc-generator`)
- ADR documents (`/agent:adr-writer`)
- Postmortems (`/agent:postmortem-writer`)
- User explicitly requests `--verbose` or "explain in detail"

## Anti-patterns (never do)

- Restating what the user just said back to them
- "As mentioned above..." / "As we discussed..." — just say the thing
- Explaining what you're about to do before doing it (just do it)
- Multi-paragraph rationales for obvious choices
- Listing alternatives you're NOT choosing (unless the user asked "why not X?")
