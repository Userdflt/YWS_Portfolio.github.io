---
name: adapt-template
description: Canonical 10-phase engine for adapting this Claude Code template to a project (new or existing). Runs pre-flight checks, captures an audit baseline, detects stack with evidence-scored confidence, generates a stack-aware settings allow-list, customizes core rules and scoped rules, tunes agents, assesses workflow packs, verifies the result with executed checks, emits a structured report, and optionally prunes setup artifacts. The engine is idempotent, resumable, and auditable via a state file.
---

# Adapt Template — Canonical Engine

This is the canonical engine for the `agent:setup` and `agent:adapt-template` user-invocable skills (both reachable via the `/setup` and `/adapt-template` slash invocations that resolve to those skills). Both skills route here. Do not duplicate phase logic in skill files.

## Architecture (Plugin vs Scaffold)

The plugin lives at one canonical install location (e.g., `~/.claude/plugins/agent/` or `${CLAUDE_PLUGIN_ROOT}`). The plugin owns three classes of files, each with different lifecycle rules.

**Plugin level — never copied to project `.claude/`:**

| Path | Purpose |
|---|---|
| `<plugin-root>/hooks/agent-gate.js` | Delegation gate engine (Node) |
| `<plugin-root>/hooks/hooks.json` | Hook manifest registered with the harness |
| `<plugin-root>/hooks/*.sh` | Gate entrypoints, fixture tests, session-start, model strip |
| `<plugin-root>/commands/` | Slash command markdown |
| `<plugin-root>/.claude-plugin/plugin.json` | Plugin manifest |

These are owned by the plugin install. Project-level edits would be ignored or overwritten on plugin update.

**Plugin level mirrored into project `.claude/` for visibility (Option C):**

| Path at plugin root | Mirrored into project `.claude/` |
|---|---|
| `<plugin-root>/agents/` | `.claude/agents/` (read-only mirror) |
| `<plugin-root>/skills/` | `.claude/skills/` (read-only mirror) |

These are bootstrap-copied during Phase 0.b so users can browse them inside the project, but the plugin root remains the authoritative source. Per-project edits fork the source — see Phase 6.

**Scaffold level — copied and customizable per project:**

| Path | Purpose |
|---|---|
| `<plugin-root>/scaffold/CLAUDE.md` | Project CLAUDE.md template with `<!-- CUSTOMIZE -->` markers |
| `<plugin-root>/scaffold/rules/` | Always-on rules + scoped language rules |
| `<plugin-root>/scaffold/workflows/` | Workflow categories + `catalog.md` |
| `<plugin-root>/scaffold/templates/` | Workflow scaffolding templates |
| `<plugin-root>/scaffold/hooks/` | Project-local hooks (`session-start.sh`, `simplify-ignore.sh`) |
| `<plugin-root>/scaffold/plans/`, `scaffold/reports/` | Placeholder directories |
| `<plugin-root>/scaffold/settings.json` | Minimal Bash allow-list and project-local hook wiring |

These get copied into the project's `.claude/` and become project-customizable. Plugin updates do not flow through.

The gate system (`hooks/agent-gate.js`, `hooks/hooks.json`) is plugin-only. The ledger lives at `~/.claude/agent-gates/` and the audit log at `~/.claude/logs/agent-gates.log` — also outside any project's `.claude/`.

## Overview

The engine runs **10 phases**. Each phase has: a goal, inputs, outputs, a checkpoint write to `.claude/.setup-state.json`, and a failure behavior. Every phase is **interruptible and resumable** — a failed or partial run can be continued or rolled back.

## Ground Rules

- **Propose before applying.** Each phase that modifies files presents a diff or summary and waits for user confirmation before writing.
- **Conversational.** User input is required at every phase gate with user-visible output. No silent auto-apply.
- **Idempotent.** Re-running on an already-adapted project reads the state file, rehashes outputs, and skips phases whose results are unchanged.
- **Stack-agnostic.** Works for any project: web apps, CLIs, libraries, AI/ML pipelines, monorepos, polyglot repos.
- **Scope-audited.** Phase 1 files a plan with a Scope Contract. Phase 8 runs `scope-guard` against the plan.
- **Template repo self-protection.** If the engine detects it is running inside the template repo itself (see §Template-repo detection), Phase 9 pruning is a no-op.

## State File: `.claude/.setup-state.json`

Gitignored. Records everything needed for idempotency, resume, and rollback.

```json
{
  "schema_version": 1,
  "status": "in_progress | completed | failed",
  "baseline_sha": "<git rev-parse HEAD at Phase 0, or null>",
  "started_at": "<ISO-8601>",
  "completed_at": "<ISO-8601 or null>",
  "failed_phase": null,
  "failure_reason": null,
  "template_repo": false,
  "bootstrap_from_plugin": true,
  "scaffold_source": "/Users/example/.claude/plugins/agent/scaffold",
  "plugin_source": "/Users/example/.claude/plugins/agent",
  "plugins": {
    "agent_skills": "present | absent",
    "agent_gate": "present | absent"
  },
  "project_profile": {
    "name": "<from manifest or dirname>",
    "languages": [{"name": "typescript", "confidence": 0.92, "signals": ["tsconfig.json", "150 .ts files", "tsconfig strict"]}],
    "frameworks": [{"name": "react", "confidence": 0.88}],
    "monorepo": false,
    "ai_ml": false,
    "ci_cd": ["github-actions"],
    "containerized": true,
    "directory_map": ["src/", "tests/", "docs/"]
  },
  "phases": {
    "0_preflight":       {"status": "completed", "completed_at": "...", "hash": null},
    "1_scope_contract":  {"status": "completed", "plan_path": ".claude/plans/2026-04-18-setup.plan.md"},
    "2_discovery":       {"status": "completed", "hash": "sha256:...profile..."},
    "3_settings":        {"status": "completed", "hash": "sha256:...settings.json..."},
    "4_core_rules":      {"status": "completed", "files": {".claude/CLAUDE.md": "sha256:..."}},
    "5_scoped_rules":    {"status": "completed", "kept": ["typescript","react"], "removed": ["python","go","rust","java","tailwind"]},
    "6_agents":          {"status": "skipped", "reason": "agents are plugin-authoritative"},
    "7_workflows":       {"status": "completed", "pruned": []},
    "8_verification":    {"status": "completed", "checks": [{"name":"scope_guard","passed":true}]},
    "9_report_pruning":  {"status": "completed", "report_path": ".claude/reports/2026-04-18-setup.report.md", "pruned": ["SETUP-GUIDE.md", "skills/setup", "skills/adapt-template", "workflows/project-tooling/adapt-template"]}
  }
}
```

**Idempotency on re-run:**
1. No state file → fresh run.
2. State file present → rehash each completed phase's outputs. Match → skip. Mismatch → prompt "Phase N output changed externally — re-apply / skip / abort?".
3. `status: failed` → prompt to resume from `failed_phase` or rollback.
4. `status: completed` with all hashes matching → report "No changes needed" and exit.

## Rollback

Documented in the Phase 9 report. Never automatic — always user-triggered.

```bash
# If baseline_sha is a real SHA:
git checkout <baseline_sha> -- .claude/ CLAUDE.md
rm -f .claude/.setup-state.json

# If baseline_sha is null (no commits yet):
git clean -fd .claude/ && git checkout -- .claude/
# or re-copy the template from its remote.
```

## Template-repo Detection

The engine suppresses Phase 9 pruning if it is running inside the template repo itself. Signals checked (any one triggers the protection):

1. `.claude/skills/setup/SKILL.md` exists AND its frontmatter contains `name: setup` (the canonical setup skill ships here).
2. `.claude/workflows/project-tooling/adapt-template/RULE.md` is this file (self-reference).
3. The project root contains a marker file `.claude-template-repo` (reserved — maintainers of the template repo can `touch` this to force protection).

When protection is active, Phase 9 emits the report but skips all deletions.

## Phase 0 — Pre-flight (gate)

**Goal:** Refuse to run in an unsafe environment. Bootstrap `.claude/` from plugin scaffold if this is a first-time run. Capture baseline state for rollback.

Phase 0 runs four sub-phases in order: **0.a** git check, **0.b** bootstrap-if-missing, **0.c** capture baseline + plugin detection, **0.d** gate-system detection.

### Phase 0.a — git check

1. `git rev-parse --is-inside-work-tree` → must return `true`. Abort with hint: "Run `git init` first, then re-run /setup."

### Phase 0.b — bootstrap `.claude/` from plugin scaffold AND plugin root (if missing)

2. Check whether `.claude/` exists in the project and contains `CLAUDE.md`, `rules/`, `workflows/`.

   **If YES (template already scaffolded):** proceed to Phase 0.c.

   **If NO (`.claude/` missing or incomplete):**

   a. Detect the `agent` plugin's scaffold path. Try these in order:
      1. Environment variable `${AGENT_PLUGIN_ROOT}/scaffold/` — if set and the directory exists.
      2. Standard user-global install: `~/.claude/plugins/agent/scaffold/` — if it exists.
      3. Project-local install: `./.claude/plugins/agent/scaffold/` — if it exists.
      4. If none of the above exist, abort with hint: "The `agent` plugin is not installed. Install it first (clone or copy it to `~/.claude/plugins/agent/`), then re-run /setup."

   b. Derive the plugin root from the resolved scaffold path: `<plugin-root> = <scaffold-path>/..`. The plugin root is hard-coded as the parent of the scaffold directory — do NOT re-run plugin discovery, since the two copies must come from the same install.

   c. Copy from BOTH sources into the project's `.claude/`:
      ```
      cp -r <scaffold-path>/. .claude/
      cp -r <plugin-root>/agents .claude/agents
      cp -r <plugin-root>/skills .claude/skills
      ```
      (The trailing `/.` on the first copy copies contents, not the parent directory itself. The second and third copies mirror the plugin's authoritative `agents/` and `skills/` into the project for visibility — see §Architecture.)

   d. Record in the setup state file (written later in Phase 0.c):
      - `bootstrap_from_plugin: true`
      - `scaffold_source: <scaffold-path used>`
      - `plugin_source: <plugin-root used>`

   e. Verify post-bootstrap: `.claude/CLAUDE.md`, `.claude/rules/`, `.claude/workflows/`, `.claude/agents/`, `.claude/skills/` must all exist. If any is missing, abort with the plugin's README install instructions.

#### Why two copy sources

Option C (this design) keeps the `scaffold/` directory lean — it ships only the project-customizable layer (rules, workflows, CLAUDE.md, settings.json, project-local hooks, plans/, reports/, templates/). The plugin's `agents/` and `skills/` remain the authoritative source for the Agent and Skill tools, but are mirrored into `.claude/` at bootstrap so users can browse them inside the project. This avoids fork drift (Option A: symlinks break across distribution channels) and avoids permanent duplication (Option B: sync-copy via CI). Per-project edits to mirrored files are technically possible but discouraged — see Phase 6 for the agent-tuning policy.

### Phase 0.c — baseline + plugin detection

3. `git rev-parse HEAD` → capture as `baseline_sha`. If the repo has no commits yet, record `baseline_sha: null`.
4. Detect template-repo signals (see §Template-repo Detection). Record `template_repo: true|false`.
5. Plugin detection:
   - Check whether `agent-skills` plugin is installed. Signals: any skill in the available-skills list prefixed with `agent-skills:`, or any slash command from `/spec /plan /build /test /review /code-simplify /ship`. Record `plugins.agent_skills: present|absent`.

**Output:** Write `.claude/.setup-state.json` with `status: in_progress`, `baseline_sha`, `started_at`, `template_repo`, `plugins`. Also print a one-screen preflight summary to the user.

**Failure:** If any required check fails, write `status: failed` + `failed_phase: 0` + `failure_reason`, print actionable remediation, exit. No further phases run.

### Phase 0.d — gate-system detection

6. Probe for the delegation gate engine at the plugin root. The gate runs at plugin level (never copied into the project) — see §Architecture.

   a. Verify `<plugin-root>/hooks/agent-gate.js` exists. `<plugin-root>` is the value captured in Phase 0.b (or, if `.claude/` was already scaffolded and Phase 0.b was skipped, derive from the same scaffold-path search order: `${AGENT_PLUGIN_ROOT}`, `~/.claude/plugins/agent/`, `./.claude/plugins/agent/`).

   b. Verify `<plugin-root>/hooks/hooks.json` exists and parses as valid JSON.

   c. Record `plugins.agent_gate: present` if both checks pass; otherwise record `plugins.agent_gate: absent`.

   d. **Soft-warn behavior (NOT a hard fail).** If the gate is absent, emit a non-fatal warning: "gate engine not detected at `<plugin-root>/hooks/` — delegation rules will not be mechanically enforced this session; setup continues without gate auditing." Setup proceeds. This preserves graceful degradation for users running the engine without the gate plugin installed.

**Output:** State file gains `plugins.agent_gate: present|absent`. Phase 1 may proceed regardless.

## Phase 1 — Scope Contract & Plan Bootstrap

**Goal:** Emit a plan artifact with a Scope Contract so the setup operation can be audited by `scope-guard` in Phase 8.

**Note on workflow gating.** The gate engine's `classifyWorkflow` (in `agent-gate.js`) does NOT match "setup" — only `/plan`, `/build`, `/test`, `/review`, `/ship`, `/code-simplify`, `/spec`, `/codex-review`. So a `/setup` invocation does not activate the gate's workflow-receipt completion enforcement. The engine still saves a plan in this phase to satisfy `plan-lifecycle.md` and to give the Phase 8 `scope-guard` audit something to compare against.

**Actions:**

1. Invoke the `plan-saver` subagent (or emit directly) to create `.claude/plans/<YYYY-MM-DD>-setup.plan.md`. Plans are gitignored — this is a local audit artifact, not a shared doc.
2. Populate the plan with a `Scope Contract` section containing:
   - **Audit Baseline:** `Branch: <current>`, `Base commit: <baseline_sha from Phase 0>`, `Diff range: <baseline_sha>..HEAD + uncommitted`. If `baseline_sha` is null, record `deferred — first commit after setup is the effective baseline`.
   - **In-Scope:** starts as the set of files this engine is allowed to touch (see §Files In-Scope per Phase below). Grows as later phases decide specific targets.
   - **Non-Goals:** application code, tests, CI config, `package.json`/manifest files, `README.md`, `CHANGELOG.md`, anything outside `.claude/` and the project root `CLAUDE.md`. Plus: `./agent-skills/` (plugin repo), `./.all_skillsets/` (skill bank, if present).
   - **Change-Trigger Policy:** Stop and ask. If a later phase discovers it must touch a file not in In-Scope, it pauses and confirms before proceeding.
3. Record `phases.1_scope_contract.plan_path` in the state file.

## Phase 2 — Discovery (evidence-scored)

**Goal:** Build an evidence-backed project profile. Replace Y/N stack detection with confidence scoring.

**Step 2.1 — Directory scan.** List top-level directories. Exclude: `.claude`, `node_modules`, `.git`, `venv`, `.venv`, `dist`, `build`, `target`, `.next`, `.turbo`, `__pycache__`, `.pytest_cache`, `.mypy_cache`, `coverage`, `.tox`, `.idea`, `.vscode`, `agent-skills`, `.all_skillsets`.

**Step 2.2 — Manifest and config file detection.**

| Manifest | Indicates | Read |
|---|---|---|
| `package.json` | Node.js / JS / TS | dependencies, devDependencies, scripts, engines |
| `tsconfig.json` | TypeScript | compiler options, paths |
| `pyproject.toml` | Python | dependencies, build-system |
| `requirements*.txt`, `setup.py`, `setup.cfg` | Python | packages |
| `Cargo.toml` | Rust | dependencies, workspace members |
| `go.mod` | Go | module path, dependencies |
| `pom.xml`, `build.gradle(.kts)` | Java / Kotlin | dependencies, plugins |
| `Gemfile` | Ruby | gems |
| `composer.json` | PHP | packages |
| `pubspec.yaml` | Dart / Flutter | dependencies |
| `*.csproj`, `*.sln` | C# / .NET | target framework, packages |
| `tailwind.config.*` | Tailwind CSS | config |
| `ruff.toml`, `mypy.ini` | Python tooling | config |

**Step 2.3 — Evidence-scored classification.**

For each candidate stack, compute `confidence = sum of signal weights`, capped at 1.0:

- Manifest file present: **0.5**
- Framework or language dep present in manifest: **0.3**
- ≥3 source files with matching extension: **0.15**
- Stack-specific config file present: **0.05**

Classify:

- **Confirmed** (≥0.8) → tune rules/agents/settings for this stack.
- **Likely** (0.5–0.8) → tune rules/agents/settings; mention in the profile summary for user confirmation.
- **Possible** (0.2–0.5) → surface as a question. Do not auto-tune.
- **Absent** (<0.2) → ignore.

**Step 2.4 — Additional signals.**

- **Monorepo:** `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json`, Cargo `[workspace]`, `package.json` `workspaces` field.
- **AI/ML:** dependencies `openai`, `anthropic`, `langchain`, `llama_index`, `transformers`, `torch`, `tensorflow`, `chromadb`, `pinecone`, `qdrant-client`, `weaviate`, `pgvector`, `faiss`. Files: `*.ipynb`, `models/`, `*.gguf`, `*.safetensors`.
- **CI/CD:** `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`, `azure-pipelines.yml`.
- **Containerization:** `Dockerfile`, `docker-compose.y*ml`, `k8s/`, `kubernetes/`, `helm/`.
- **Platform:** `vercel.json`, `netlify.toml`, `fly.toml`, `railway.json`.

**Step 2.5 — Existing docs.** Read first ~100 lines of `README.md`, `ARCHITECTURE.md`/`docs/architecture.md`, `CONTRIBUTING.md`, `CHANGELOG.md` if present.

**Step 2.6 — Present project profile.** Show the full profile (detected languages with confidence + signals, frameworks, monorepo flag, AI/ML flag, CI/CD, containerization, platform, directory map, existing docs summary). Ask: "Does this profile look correct? Is there anything to add or correct before I proceed?"

**Output:** `project_profile` block written to state file. Content hash recorded for idempotency.

## Phase 3 — `settings.json` Generation (stack-aware allow-list)

**Goal:** Generate a stack-appropriate Bash allow-list for `.claude/settings.json`. Automates what SETUP-GUIDE.md previously asked users to do manually.

**Baseline (always included):**

```
Bash(git status)
Bash(git diff *)
Bash(git log *)
Bash(git branch *)
Bash(ls *)
```

**Stack-specific additions (merged if Confirmed/Likely):**

| Stack | Entries |
|---|---|
| Node | `Bash(npm *)`, `Bash(pnpm *)`, `Bash(yarn *)`, `Bash(node *)`, `Bash(npx *)` |
| TypeScript | `Bash(tsc *)`, `Bash(tsx *)` |
| Python | `Bash(python *)`, `Bash(python3 *)`, `Bash(pip *)`, `Bash(pytest *)`, `Bash(ruff *)`, `Bash(mypy *)`, `Bash(uv *)`, `Bash(poetry *)` |
| Go | `Bash(go *)`, `Bash(gofmt *)`, `Bash(golangci-lint *)` |
| Rust | `Bash(cargo *)`, `Bash(rustc *)`, `Bash(rustup *)` |
| Java / Kotlin | `Bash(mvn *)`, `Bash(gradle *)`, `Bash(./gradlew *)`, `Bash(java *)` |
| Docker | `Bash(docker *)`, `Bash(docker-compose *)` |
| GitHub CLI | `Bash(gh *)` |
| Kubernetes | `Bash(kubectl *)`, `Bash(helm *)` |
| Terraform | `Bash(terraform *)` |

**Merge rules:**

- Read any existing `.claude/settings.json` entries.
- Merge the stack-specific additions via string-identity dedup (preserves user additions).
- Preserve any `permissions.deny`, `env`, `hooks`, or other top-level fields unchanged.

**Output:** `.claude/settings.json` rewritten. Content hash recorded.

## Phase 4 — Core Rules

**Goal:** Replace `<!-- CUSTOMIZE -->` markers in the downstream project's core rule files with project-specific content derived from Phase 2.

**Targets (all in the adapted project, not the template repo):**

1. `.claude/CLAUDE.md` — project name, description, tech stack summary, key conventions, scripts, branching. Preserve rule-pointer sections.
2. `.claude/rules/project-structure.md` — actual directory map from Phase 2.
3. `.claude/rules/module-boundaries.md` — adapt to detected pattern (features, packages, flat, monorepo).
4. `.claude/rules/modular-code-generation.md` — split-patterns section matches detected stack(s).
5. `.claude/rules/changelog.md` — if `CHANGELOG.md` exists, align with its format; otherwise note "No changelog yet; will use `## [Unreleased]`".

**Root-level `CLAUDE.md` conflict.** If a `CLAUDE.md` exists at the project root (outside `.claude/`), surface it and ask:

- Keep the root file as-is and still use `.claude/CLAUDE.md` (default).
- Merge `.claude/CLAUDE.md` content into the root file.
- Copy `.claude/CLAUDE.md` over the root file (destructive — requires explicit confirmation).

Never auto-merge.

**Output:** Each modified file's content hash recorded.

## Phase 5 — Scoped Rules

**Goal:** Keep scoped language rules that apply; remove the rest.

**Candidate set (exactly the 7 files that ship in the template):**

| File | Keep when |
|---|---|
| `.claude/rules/go.md` | Go confidence ≥ Likely |
| `.claude/rules/java.md` | Java or Kotlin confidence ≥ Likely |
| `.claude/rules/python.md` | Python confidence ≥ Likely |
| `.claude/rules/react.md` | React or Next.js confidence ≥ Likely |
| `.claude/rules/rust.md` | Rust confidence ≥ Likely |
| `.claude/rules/tailwind.md` | Tailwind confidence ≥ Likely |
| `.claude/rules/typescript.md` | TypeScript confidence ≥ Likely |

Removal = delete the file from the adapted project's `.claude/rules/`.

No "generate from example template" step — the template ships no example scoped-rule files. If the user needs a framework-specific rule (FastAPI, Django, Svelte, etc.), they author one by hand after setup.

**Output:** Record `phases.5_scoped_rules.kept` and `phases.5_scoped_rules.removed`.

## Phase 6 — Agent Tuning (skipped — agents are plugin-authoritative)

**Goal:** Documented no-op. Stack-specific agent tuning is a plugin-maintenance task, not a per-project setup task.

**Why skipped.** The plugin's `<plugin-root>/agents/` is the authoritative source consumed by the Agent tool. The mirrored copy under `.claude/agents/` (created in Phase 0.b) exists for in-project visibility only. Editing the mirrored copy would either fork the plugin's agents (losing upstream updates) or be invisible if the harness loads from the plugin path. To keep upstream-merge-clean, per-project agent edits are deliberately not performed by this engine.

**Actions:**

1. Print a one-line user-visible note: "Phase 6 skipped — agents are plugin-authoritative; tune via plugin maintenance to keep upstream-merge-clean."
2. Optional stack-pointer drift check: if Phase 5 removed scoped rule files (e.g., `react.md`), scan the mirrored `.claude/agents/*.md` for references to those removed paths and surface as a non-blocking warning (read-only — do NOT edit).
3. Set `phases.6_agents.status: skipped` in the state file. The schema field is preserved for backward compatibility with prior runs.

**Hand-off.** A user who genuinely needs to fork an agent for a specific project should edit `<plugin-root>/agents/<agent>.md` directly (in their plugin checkout) and treat it as a plugin-maintenance change, not a per-project setup change.

**Output:** `phases.6_agents.status: skipped`. No file modifications.

## Phase 7 — Workflow Pack Assessment

**Goal:** Score each of the 15 workflow categories for relevance. Default: keep all.

**15 categories:**

`ai-llm-prompting`, `api-backend`, `api-tooling-clients`, `architecture-design`, `ci-cd-release`, `data-storage`, `devops-infra`, `docs-communication`, `frontend-ui`, `observability-reliability`, `performance-scalability`, `project-tooling`, `security-compliance`, `testing-qa`.

Scoring:

| Category | High relevance when |
|---|---|
| `testing-qa` | Always |
| `docs-communication` | Always |
| `project-tooling` | Always |
| `frontend-ui` | Frontend detected |
| `api-backend` | Backend endpoints detected |
| `ai-llm-prompting` | AI/ML flag true |
| `security-compliance` | Auth / external inputs detected |
| `data-storage` | Database or ORM detected |
| `ci-cd-release` | CI/CD config present |
| `devops-infra` | Docker / K8s / Terraform detected |
| `observability-reliability` | Production deployment signals |
| `performance-scalability` | Explicit performance requirements |
| `architecture-design` | Multi-service or complex system |
| `api-tooling-clients` | API testing tooling detected |

**Do not remove workflow packs by default.** They are loaded on demand and cost nothing when idle. Ask: "Would you like to prune any low-relevance categories, or keep them all?"

If a category is pruned: the entire `.claude/workflows/<category>/` directory is deleted, **and** the entry is removed from `.claude/workflows/catalog.md` and `.claude/workflows/<category>/INDEX.md` is (already) deleted with the dir. Record the pruned category list in state.

## Phase 8 — Verification (executed checks)

**Goal:** Confirm the adapted state is self-consistent and scope-respecting. Replace the old human checkbox list with actual execution.

**Checks (each produces pass/fail/skip):**

1. **Scope audit.** Invoke `scope-guard` against the Phase 1 plan. Any drift → block completion, report to user.
2. **Verifier.** Invoke `verifier` subagent over the files modified by phases 3–7. Checks frontmatter validity, YAML parseability, JSON validity.
3. **Self-consistency.** Every Confirmed stack has its scoped rule file present; every Absent stack's file is absent. Every kept workflow category has its directory present.
4. **JSON parse.** `.claude/settings.json` parses as valid JSON.
5. **State file integrity.** `.claude/.setup-state.json` parses; every recorded content hash matches the current file.
6. **Template marker cleared.** `.claude/CLAUDE.md` contains no `<!-- CUSTOMIZE -->` markers.
7. **Workflow discovery rule present.** `.claude/rules/workflow-discovery.md` exists with no `paths:` frontmatter (confirms always-on loading).
8. **Catalog wiring.** `.claude/workflows/catalog.md` references each kept category's `INDEX.md`, all of which exist on disk.

**Gate-system checks (added under the new architecture).** Each is recorded the same way as checks 1–8. If `plugins.agent_gate: absent` (Phase 0.d), all six are recorded with `passed: skip` and a `detail` reason — Phase 9 still proceeds.

9. **Gate engine present (D1).** `<plugin-root>/hooks/agent-gate.js` exists and is readable.
10. **Gate engine syntax-valid (D2).** Run `node -c <plugin-root>/hooks/agent-gate.js`. Expected exit 0. If Node is not installed, mark `skip` with `detail: "node not on PATH"`.
11. **hooks.json valid JSON (D3).** Parse `<plugin-root>/hooks/hooks.json`. Use `node -e "JSON.parse(require('fs').readFileSync(process.argv[1]))" <plugin-root>/hooks/hooks.json` (or `python3 -c "import json,sys; json.load(open(sys.argv[1]))" <plugin-root>/hooks/hooks.json` if Node is unavailable).
12. **Hook command files exist and are executable (D4).** Parse `hooks.json`, extract every `hooks[].hooks[].command` value (e.g., `bash ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh`), substitute `${CLAUDE_PLUGIN_ROOT}` with the resolved `<plugin-root>`, and assert each referenced `.sh` file exists AND is executable (`-x`).
13. **Ledger directory writable (D5).** Test `[ -d ~/.claude/agent-gates ] || mkdir -p ~/.claude/agent-gates`, then `[ -w ~/.claude/agent-gates ]`. Pass if writable.
14. **Fixture tests pass (D6 — on by default).** Run `bash <plugin-root>/hooks/agent-gate-test.sh`. Expected exit 0. Optional escape hatch: callers may set `SKIP_GATE_FIXTURE=1` to downgrade this check to `skip` without blocking Phase 9 — useful for CI-hostile environments where the fixture's bash semantics or filesystem assumptions don't apply.

Each check is recorded in state as `{"name": "<check>", "passed": true|false|"skip", "detail": "..."}`. Phase 9 cannot run until all non-skip checks pass OR the user explicitly acknowledges a soft failure.

## Phase 9 — Report + Post-Adaptation Pruning

**Step 9.1 — Emit the setup report.**

Write `.claude/reports/<YYYY-MM-DD>-setup.report.md` using the `post-change-documentation-report` skill's format. Report sections:

- **Project profile** (from state file).
- **Plugins detected** (agent-skills present/absent; if absent, recommend `claude plugin add agent-skills` or equivalent).
- **Changes applied** — table of files edited/created/removed with phase attribution.
- **Verification results** — each Phase 8 check with pass/fail.
- **Rollback command** — exact shell command using the captured `baseline_sha`.
- **Re-adaptation command** — exact command to restore pruned setup artifacts if needed.

**Step 9.2 — Mark state completed.** Set `status: completed`, `completed_at: <now>`.

**Step 9.3 — Persist project memory for future sessions.**

After setup completes, seed memory so that future conversations automatically know which rules apply. This step writes up to two files: one for mandatory structural rules, and one for opt-in collaboration gates.

**Step 9.3.a — Mandatory structural rules (always seeded, non-interactive).**

Write a `project`-type memory file `project_setup_rules.md` covering:

1. **Plan lifecycle is mandatory.** Every plan must follow the 6-step lifecycle in `.claude/rules/plan-lifecycle.md` (Save → Review → Validate → Incorporate → Confirm → Scope Audit). Never skip steps.
2. **Workflow catalog discovery is mandatory.** Before planning or implementing, check `.claude/workflows/catalog.md` for relevant domain workflow packs. Matching packs should drive task lists and implementation patterns.
3. **Scope contracts are mandatory.** Every plan must include a Scope Contract section per `.claude/rules/scope-contract.md`. The `scope-guard` subagent audits against it before work is marked complete.
4. **Workflow discovery rule is always-on.** `.claude/rules/workflow-discovery.md` governs how packs are loaded at runtime — follow its Tier 0 → Tier 1 → Tier 2 discovery order.

If `project_setup_rules.md` already exists, update it rather than creating a duplicate. These four rules are structural and not user-selectable.

**Step 9.3.b — Collaboration gate rules (interactive, opt-in).**

Prompt the user with a multi-select checkbox interface (use the `AskUserQuestion` tool) presenting the following 5 rules, **all checked by default**. The user unchecks any they do not want.

1. Do not run tests without asking first.
2. Do not `git add` files to staging without asking first.
3. Do not create `git commit`s without asking first.
4. Do not `git push` without asking first.
5. Always confirm with the user before carrying out any code changes.

Suggested question copy: "Which collaboration gate rules should I follow in this project? Selected rules are saved to memory and apply across all future sessions. Uncheck any you don't want."

Write a `feedback`-type memory file `feedback_confirmation_gates.md` containing **only the selected rules**. For each selected rule, use the standard feedback schema:

- Lead line: the rule itself, restated clearly.
- `**Why:**` line: "User opted in during `/setup` to gate side-effectful actions behind explicit confirmation."
- `**How to apply:**` line: describes when the gate fires (e.g., "Before invoking any test runner — `npm test`, `pytest`, `go test`, etc. — stop and ask the user.").

If the user deselects every rule, skip the file write entirely; do not create an empty file.

If `feedback_confirmation_gates.md` already exists from a previous setup run, load its current rule set and present those as the pre-checked defaults in the prompt. After the user confirms, overwrite the file with the new selection (adds and removes both take effect). Do not silently merge — the user's latest selection is authoritative.

**Step 9.3.c — Update the memory index.**

Update `MEMORY.md` to include a pointer for each memory file written in this phase:

- `project_setup_rules.md` — always.
- `feedback_confirmation_gates.md` — only if Step 9.3.b wrote it.

If a pointer already exists, leave it in place; do not duplicate entries.

**Step 9.4 — Post-adaptation pruning (default ON; suppressed if `template_repo: true`).**

Pruning has two named lists. Missing entries are silently skipped (`rm -f` semantics).

**Setup-only artifacts (always pruned in adapted projects):**

- `.claude/SETUP-GUIDE.md` (if present — file is currently aspirational)
- `.claude/skills/setup/`
- `.claude/skills/adapt-template/`
- `.claude/workflows/project-tooling/adapt-template/`
- Any empty parent directories after the above deletions

**NEVER pruned (plugin-level, not project-local):**

- `<plugin-root>/hooks/` — gate engine, hook entrypoints, fixture tests, session-start, model strip
- `<plugin-root>/agents/` — authoritative agent definitions (the plugin source, not the project mirror)
- `<plugin-root>/skills/` — authoritative skill definitions, except for the two setup-pair skill dirs which are pruned from the project mirror only
- `~/.claude/agent-gates/` — per-session gate ledger (audit trail)
- `~/.claude/logs/agent-gates.log` — gate event log

The pruner targets `.claude/` paths only. It must NEVER write outside the project root, regardless of how plugin-root paths resolve.

**Keep (in project `.claude/`):**

- `.claude/.setup-state.json` (downstream consumers infer adaptation history).
- `.claude/agents/` (mirrored from plugin in Phase 0.b — kept for in-project visibility).
- `.claude/skills/` minus the two pruned setup-pair entries.
- Everything else in `.claude/`.

**Step 9.5 — Post-pruning sanity check.** After pruning, verify `.claude/` still has `rules/`, `workflows/` (kept categories), `CLAUDE.md`, `settings.json`, plus any user-customized files. Do NOT verify presence of `agents/` or `skills/` — those are plugin-level mirrors and a misconfigured prune that removed them is still a project-state issue, not a plugin-state issue (the plugin's authoritative copies remain intact). If any plugin-level path under `<plugin-root>/` was accidentally touched, abort with a recovery hint pointing at the plugin's reinstall instructions.

The report includes the exact re-adaptation command for recovering the deleted artifacts. The command is defensive — it copies BOTH the scaffold artifacts AND the mirrored plugin paths from the plugin source (not from the scaffold), so it works even if a user manually deleted the mirrors after pruning:

```bash
# Re-adaptation: restore setup-pair scaffold artifacts AND plugin mirrors.
# <plugin-root> is the install path used by the original /setup run
# (typically ~/.claude/plugins/agent or ${CLAUDE_PLUGIN_ROOT}).
cp -r <plugin-root>/scaffold/workflows/project-tooling/adapt-template .claude/workflows/project-tooling/
cp -r <plugin-root>/skills/setup .claude/skills/
cp -r <plugin-root>/skills/adapt-template .claude/skills/

# Defensive: re-mirror agents/ and skills/ from the plugin if they were deleted post-prune.
[ -d .claude/agents ] || cp -r <plugin-root>/agents .claude/agents
[ -d .claude/skills ] || cp -r <plugin-root>/skills .claude/skills
```

**Step 9.6 — Print final summary.** One screen: profile, top changes, verification pass count, report path, rollback command, re-adaptation command, gate locations:

- Gate engine: `<plugin-root>/hooks/agent-gate.js`
- Hooks manifest: `<plugin-root>/hooks/hooks.json`
- Per-session ledger: `~/.claude/agent-gates/<session_id>.json`
- Audit log: `~/.claude/logs/agent-gates.log`
- Bypass: launch with `AGENT_GATE_BYPASS=1` (use is logged to the audit log)
- Fixture tests: `bash <plugin-root>/hooks/agent-gate-test.sh`

## Files In-Scope per Phase (reference)

| Phase | May touch |
|---|---|
| 0 | `.claude/.setup-state.json` only |
| 1 | `.claude/plans/<date>-setup.plan.md` |
| 2 | `.claude/.setup-state.json` (state updates only) |
| 3 | `.claude/settings.json` |
| 4 | `.claude/CLAUDE.md`, `.claude/rules/project-structure.md`, `.claude/rules/module-boundaries.md`, `.claude/rules/modular-code-generation.md`, `.claude/rules/changelog.md`, (optionally) `<project-root>/CLAUDE.md` with explicit confirmation |
| 5 | `.claude/rules/{go,java,python,react,rust,tailwind,typescript}.md` (deletion only) |
| 6 | (none — phase is a documented no-op; agents are plugin-authoritative and read-only from the project's perspective) |
| 7 | `.claude/workflows/<category>/` (category-level deletion only, explicit confirm), `.claude/workflows/catalog.md` (if a category is pruned) |
| 8 | `.claude/.setup-state.json` (state updates only) |
| 9 | `.claude/reports/<date>-setup.report.md`, `.claude/.setup-state.json`, and (if pruning) `.claude/SETUP-GUIDE.md`, `.claude/skills/setup/`, `.claude/skills/adapt-template/`, `.claude/workflows/project-tooling/adapt-template/` |

Anything else is out of scope. If the engine finds it must touch a file not listed above, the Change-Trigger Policy fires Stop-and-ask.

## Edge Cases

**Already-adapted project.** Signals: state file present with `status: completed`, OR no `<!-- CUSTOMIZE -->` markers in core rules. Behavior: offer to verify drift (rehash), re-run specific phases, or exit.

**Monorepo.** Phase 2 detects workspace configs. Phase 4's `module-boundaries.md` is rewritten to describe package boundaries. Phase 5 keeps scoped rules for the union of all detected package stacks.

**Polyglot.** Multiple Confirmed languages. All applicable scoped rules kept. `modular-code-generation.md` gets split patterns for each stack.

**Minimal / empty project.** Few files, no manifest. Phase 2 yields low confidence everywhere. Engine asks the user what they plan to build and offers the `project-scaffolder` workflow pack pointer.

**Non-git project.** Phase 0 aborts. Rationale: rollback depends on git. Remediation hint: `git init` and retry.

**Root `CLAUDE.md` exists.** Phase 4 surfaces it and asks — never auto-merges.

**Template repo self-run.** Phase 0 flags `template_repo: true`. Phase 9 pruning is a no-op. All other phases execute (dogfooding).

## Dead References Audit (historical)

The pre-rewrite version of this file referenced the following, none of which exist in the template. They have been removed from this engine:

- Scoped rules: `fastapi.md`, `vue.md`, `svelte.md`, `cpp.md`, `database.md`, `nativescript.md`, `medusa.md`, `beefreeSDK.md`.
- Agents: `ai-pipeline-builder.md`, `data-processor.md`, `deployment-builder.md`.
- Scaffolding: `_EXAMPLE-backend-api.md`, `_EXAMPLE-feature-module.md`, `TEMPLATE-README.md`.
- Counts: "13 agents" / "12 agents" / "11 agents" → **15** (live count under `<plugin-root>/agents/`). Workflow categories → **15**.
- Wording: "/setup and /adapt-template are slash commands" → they are user-invocable skills (registered in `skills/setup/SKILL.md` and `skills/adapt-template/SKILL.md` with `user-invocable: true`), reachable via `/setup` and `/adapt-template` slash invocations that resolve to those skills.
- Phase 6 was previously documented as "edit 12 agent files" — under the plugin/scaffold split, agents are plugin-authoritative and Phase 6 is now a documented no-op.

## How the Skills Route Here

Both `/setup` and `/adapt-template` are thin-alias skills that route to this engine. Their SKILL.md files contain only frontmatter, trigger phrases, and a pointer to this RULE.md. Phase logic lives here only.

## See Also

- `.claude/rules/scope-contract.md` — format used by Phase 1.
- `.claude/rules/plan-lifecycle.md` — Phase 1 follows the plan-lifecycle rule.
- `.claude/agents/scope-guard.md` — invoked by Phase 8.
- `.claude/agents/verifier.md` — invoked by Phase 8.
- `.claude/skills/post-change-documentation-report/SKILL.md` — report format used in Phase 9.
- `.claude/rules/workflow-discovery.md` — Tier-0 rule that governs pack discovery at runtime (created by the rewrite plan alongside this engine).
