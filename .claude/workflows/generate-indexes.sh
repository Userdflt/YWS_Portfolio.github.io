#!/bin/bash
# Generator: creates .claude/workflows/<category>/INDEX.md for every category.
# Reads each pack's RULE.md YAML frontmatter, extracts `name` and `description`,
# emits a markdown table. RULE.md files are NEVER modified — this script is strictly read-only
# against them and write-only for INDEX.md files.
#
# Usage: bash .claude/workflows/generate-indexes.sh
# Idempotent: overwrites INDEX.md per run; leaves RULE.md untouched.

set -euo pipefail

WORKFLOWS_DIR=".claude/workflows"

if [ ! -d "$WORKFLOWS_DIR" ]; then
  echo "ERROR: $WORKFLOWS_DIR not found. Run from template repo root."
  exit 1
fi

# Map category slug → one-line coverage summary (manually curated for readability).
# Falls back to the slug if absent.
declare -A COVERAGE
COVERAGE[ai-llm-prompting]="LLM integration, RAG, prompt engineering, embeddings, evaluation, and agent orchestration."
COVERAGE[api-backend]="HTTP/GraphQL/WebSocket endpoint design, documentation, mocking, contracts, and versioning."
COVERAGE[api-tooling-clients]="API client collections and request runners (Postman, Insomnia, Bruno, cURL, REST Client)."
COVERAGE[architecture-design]="System design, domain modeling, service boundaries, background jobs, refactors, migrations."
COVERAGE[ci-cd-release]="CI pipelines, preview environments, quality gates, release automation, rollback workflows, SBOM."
COVERAGE[data-storage]="Schema, migrations, seeding, integrity, retention, ORM patterns, query optimization, ETL."
COVERAGE[devops-infra]="Container, Kubernetes, Nginx, and Terraform configuration and optimization."
COVERAGE[docs-communication]="READMEs, ADRs, RFCs, changelogs, diagrams, codebase summaries, code explanations."
COVERAGE[frontend-ui]="Components, layouts, state, data fetching, styling, accessibility, and animations."
COVERAGE[observability-reliability]="Logging, alerting, dashboards, incident response, postmortems, error handling."
COVERAGE[performance-scalability]="Profiling, caching, load testing, capacity planning, Core Web Vitals, cost/latency."
COVERAGE[project-tooling]="Project setup, linters/formatters, dependencies, monorepo, git hygiene, tech debt, scaffolding."
COVERAGE[security-compliance]="Auth, RBAC, OAuth/OIDC, secrets, input validation, rate limiting, threat modeling, headers."
COVERAGE[testing-qa]="Unit, integration, E2E, contract, visual regression, coverage, mocking, flaky-test triage."

# Extract the `description:` field from a YAML frontmatter file.
extract_description() {
  local file="$1"
  awk '
    /^---$/ { count++; if (count == 2) exit; next }
    count == 1 && /^description:/ {
      sub(/^description:[[:space:]]*/, "");
      gsub(/\\"/, "\"");
      print;
      exit
    }
  ' "$file"
}

# Extract the `name:` field similarly.
extract_name() {
  local file="$1"
  awk '
    /^---$/ { count++; if (count == 2) exit; next }
    count == 1 && /^name:/ {
      sub(/^name:[[:space:]]*/, "");
      print;
      exit
    }
  ' "$file"
}

# Escape pipe characters for markdown table cells.
md_escape() {
  sed 's/|/\\|/g'
}

# Process each category directory.
for category_dir in "$WORKFLOWS_DIR"/*/; do
  category=$(basename "$category_dir")
  [ "$category" = "*" ] && continue

  index_file="$category_dir/INDEX.md"
  coverage="${COVERAGE[$category]:-$category workflow packs.}"

  # Title-case the category for display.
  display=$(echo "$category" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++){$i=toupper(substr($i,1,1))substr($i,2)}print}')

  {
    echo "# $display"
    echo
    echo "$coverage"
    echo
    echo "| Pack | Description | Path |"
    echo "|---|---|---|"

    for pack_dir in "$category_dir"*/; do
      pack=$(basename "$pack_dir")
      [ "$pack" = "*" ] && continue
      rule_file="$pack_dir/RULE.md"
      [ ! -f "$rule_file" ] && continue

      name=$(extract_name "$rule_file" | md_escape)
      desc=$(extract_description "$rule_file" | md_escape)
      # Fallback to pack slug if name was missing
      [ -z "$name" ] && name="$pack"
      [ -z "$desc" ] && desc="(no description)"

      echo "| \`$pack\` | $desc | \`.claude/workflows/$category/$pack/RULE.md\` |"
    done

    echo
    echo "---"
    echo
    echo "Tier-1 catalog: \`.claude/workflows/catalog.md\`. Tier-0 discovery rule: \`.claude/rules/workflow-discovery.md\`."
  } > "$index_file"

  pack_count=$(find "$category_dir" -mindepth 2 -maxdepth 2 -name "RULE.md" | wc -l)
  echo "Wrote $index_file ($pack_count packs)"
done

echo
echo "Done. Generated $(find "$WORKFLOWS_DIR" -mindepth 2 -maxdepth 2 -name "INDEX.md" | wc -l) INDEX.md files."
