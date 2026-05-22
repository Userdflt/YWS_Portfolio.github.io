
# Changelog Maintenance

- Keep `## [Unreleased]` as the first version section.
- Use release headings as `## [x.y.z] - YYYY-MM-DD`.
- Use user-facing buckets when needed: `### Added`, `### Changed`, `### Fixed`, `### Security`.
- Treat a release as a deployed update users receive.
- Prefer concise, user-impact language in bullets.
- Never include secrets, API keys, or sensitive incident details.

## Update Flow

1. Add new change bullets under `## [Unreleased]`.
2. On release day, create a new version section and move relevant bullets from `Unreleased`.
3. Keep `Unreleased` ready for the next cycle.
