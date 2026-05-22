
# Root Cause First

**Always find and fix the root cause. Never patch symptoms to make things work.**

When dealing with bugs, issues, runtime errors, regressions, flaky behavior, or refactors, identify the underlying cause before changing code.

## Principles

- Reproduce and localize the problem or pain point before editing.
- Trace the behavior backward to the real source of truth — state flow, data contracts, async timing, configuration, prompts, storage, ownership, or duplicated logic.
- Ask "why does this value/state/condition exist?" repeatedly until you reach the originating defect. A surface-level answer means you haven't gone deep enough.
- If the root cause lives outside the immediate failure site (upstream producer, caller, configuration, schema), fix it there — not at the point where it finally breaks.
- Prefer fixes and refactors that remove the source of failure or fragility instead of masking symptoms with guards, retries, fallbacks, or one-off conditionals.
- If a temporary mitigation is the only safe short-term move, label it explicitly as containment and file the remaining root-cause follow-up.
- Verify the final change against the original failure mode, error condition, or refactor goal.

## How to tell you're patching instead of fixing

If your change does any of the following without addressing why the bad state occurs, it is a patch:
- Adds a null/undefined check around data that shouldn't be null
- Catches and swallows an exception
- Adds a retry or fallback for a call that should succeed
- Hardcodes a default value to avoid a crash
- Adds a one-off conditional for a single broken scenario
- Wraps extra prompt instructions around an LLM failure instead of fixing the prompt structure or data pipeline

Patches hide bugs. They let the originating defect survive and cause further problems elsewhere.

## Examples

- Bad: add another null check when the real issue is an invalid upstream contract.
- Good: fix the contract mismatch at the producer or shared boundary.
- Bad: shuffle code during a refactor without addressing the duplication or ownership confusion causing mistakes.
- Good: extract the duplicated logic or move ownership to the correct module.
- Bad: add `waitFor` to a flaky test when the real issue is a race condition in the component.
- Good: fix the race condition in the component so the test is deterministic.
- Bad: append "IMPORTANT: output valid JSON" to a prompt when the real issue is unstructured context injection.
- Good: fix the context injection pipeline so the model receives clean, structured input.
