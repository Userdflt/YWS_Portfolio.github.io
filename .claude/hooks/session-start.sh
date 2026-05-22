#!/bin/bash
# .claude/hooks/session-start.sh — template session-start hook
#
# Runs at the start of every Claude Code session (when registered in
# .claude/settings.json). Injects a short reminder about the template's
# always-loaded core rules and the three-tier workflow discovery mechanism,
# so Claude starts each session aware of what's available without opening
# any files first.
#
# Unlike the agent plugin's session-start.sh (which loads the using-agent-skills
# meta-skill), this template-side hook points Claude at workflow-discovery.md
# (the Tier-0 enforcement rule) and the scope-contract / plan-lifecycle rules.
# No dependency on the agent plugin — fires standalone in any project that
# has .claude/ scaffolded.
#
# Suppress-if-plugin-detected: if the `agent` plugin is installed at the
# standard user-global path, its own SessionStart hook already injects a
# combined reminder (meta-skill flowchart + template-integration note). To
# avoid double-firing, this script exits silently in that case.
#
# Output is a single JSON object with "priority" and "message" fields,
# consumed by Claude Code's hook system. An empty exit (exit 0 with no
# stdout) is a valid no-op for the hook system.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$CLAUDE_DIR")"

# ── Suppress-if-plugin-detected ────────────────────────────────────────────
# The agent plugin's session-start.sh covers both the lifecycle-flowchart
# greeting AND a template-integration note referencing our core rules.
# When the plugin is installed, running this template hook in parallel would
# produce a redundant second reminder. Detect the plugin's manifest and bail.
#
# Override: set TEMPLATE_HOOK_FORCE=1 to fire this hook even when the plugin
# is present (useful for debugging or if you've intentionally disabled the
# plugin's hook but want the template reminder to keep firing).
AGENT_PLUGIN_MANIFEST="${HOME}/.claude/plugins/agent/.claude-plugin/plugin.json"
if [ -f "$AGENT_PLUGIN_MANIFEST" ] && [ "${TEMPLATE_HOOK_FORCE:-0}" != "1" ]; then
  # Plugin is present — defer to its SessionStart hook. Silent no-op.
  exit 0
fi

# Probe for the rules we expect to exist. Absence = degraded or partially scaffolded.
WORKFLOW_DISCOVERY="$CLAUDE_DIR/rules/workflow-discovery.md"
PLAN_LIFECYCLE="$CLAUDE_DIR/rules/plan-lifecycle.md"
SCOPE_CONTRACT="$CLAUDE_DIR/rules/scope-contract.md"
CATALOG="$CLAUDE_DIR/workflows/catalog.md"

missing=""
[ -f "$WORKFLOW_DISCOVERY" ] || missing="${missing} workflow-discovery.md"
[ -f "$PLAN_LIFECYCLE" ]     || missing="${missing} plan-lifecycle.md"
[ -f "$SCOPE_CONTRACT" ]     || missing="${missing} scope-contract.md"
[ -f "$CATALOG" ]            || missing="${missing} workflows/catalog.md"

if [ -n "$missing" ]; then
  cat <<EOF
{
  "priority": "INFO",
  "message": "template session-start: .claude/ is partially scaffolded. Missing:${missing}. Run /setup to complete the scaffold."
}
EOF
  exit 0
fi

# Full template detected — emit the reminder message.
cat <<'EOF'
{
  "priority": "IMPORTANT",
  "message": "Template harness active. Key reminders for this session:\n\n1. Core rules auto-loaded (authoritative): clean-code, codequality, root-cause-debugging, module-boundaries, modular-code-generation, project-structure, plan-lifecycle, planning-output-contract, scope-contract, workflow-discovery, changelog.\n\n2. Workflow pack discovery is TIERED (not announced at session start). Consult .claude/workflows/catalog.md (Tier 1) before claiming a workflow is unavailable. See .claude/rules/workflow-discovery.md for the full three-tier rule.\n\n3. Plans: any non-trivial work persists to .claude/plans/<date>-<name>.plan.md following plan-lifecycle.md (6 steps). Each plan MUST include a Scope Contract (Audit Baseline / In-Scope / Non-Goals / Change-Trigger Policy) per scope-contract.md.\n\n4. If the agent plugin is also installed, its lifecycle skills (/spec /plan /build /test /review /code-simplify /ship) compose with these template rules via the Template Integration sections in each skill.\n\n5. simplify-ignore hook (if configured in settings.json) protects code blocks marked `simplify-ignore-start` ... `simplify-ignore-end` from AI modification."
}
EOF
