# Docs Communication

READMEs, ADRs, RFCs, changelogs, diagrams, codebase summaries, code explanations.

| Pack | Description | Path |
|---|---|---|
| `adr-writer` | Creates Architecture Decision Records documenting key technical decisions with context, alternatives considered, tradeoffs, consequences, and decision owners. Use when documenting "architecture decisions", "technical choices", "design decisions", or "ADRs". | `.claude/workflows/docs-communication/adr-writer/RULE.md` |
| `changelog-writer` | Generates changelogs and release notes from git commits, PR titles, and issue references. Organizes changes by impact type (breaking, features, fixes, improvements), formats according to Keep a Changelog standard, and provides version tagging and semantic versioning suggestions. Use when users request "create changelog", "write release notes", "document version changes", or "prepare release". | `.claude/workflows/docs-communication/changelog-writer/RULE.md` |
| `codebase-summarizer` | Scans repository structure and generates comprehensive architecture documentation including system overview, entry points, module relationships, data flow diagrams, and "edit here for X" guides. Creates ARCHITECTURE.md for onboarding and navigation. Use when users request "document the codebase", "explain the architecture", "create onboarding docs", or "map the system". | `.claude/workflows/docs-communication/codebase-summarizer/RULE.md` |
| `docs-starter-kit` | Generates comprehensive documentation templates for open-source and internal projects including README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, LICENSE, and other standard docs with suggested sections and best practices. Use when users request "create project docs", "add OSS documentation", "setup standard docs", or "make it open-source ready". | `.claude/workflows/docs-communication/docs-starter-kit/RULE.md` |
| `explaining-code` | Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?" | `.claude/workflows/docs-communication/explaining-code/RULE.md` |
| `jsdoc-typescript-docs` | Documents TypeScript code with JSDoc comments, generates API documentation, and creates type-safe documentation. Use when users request "JSDoc", "code documentation", "API docs", "TypeDoc", or "inline documentation". | `.claude/workflows/docs-communication/jsdoc-typescript-docs/RULE.md` |
| `mermaid-diagram-generator` | Creates Mermaid diagrams for flowcharts, sequence diagrams, ERDs, and architecture visualizations in markdown. Use when users request "Mermaid diagram", "flowchart", "sequence diagram", "ERD diagram", or "architecture diagram". | `.claude/workflows/docs-communication/mermaid-diagram-generator/RULE.md` |
| `readme-generator` | Generates comprehensive README files with badges, installation, usage, API docs, and contribution guidelines. Use when users request "README", "project documentation", "readme template", "documentation generator", or "project setup docs". | `.claude/workflows/docs-communication/readme-generator/RULE.md` |
| `rfc-generator` | Generates Request for Comments documents for technical proposals including problem statement, solution design, alternatives, risks, and rollout plans. Use for "RFC", "technical proposals", "design docs", or "architecture proposals". | `.claude/workflows/docs-communication/rfc-generator/RULE.md` |

---

Tier-1 catalog: `.claude/workflows/catalog.md`. Tier-0 discovery rule: `.claude/rules/workflow-discovery.md`.
