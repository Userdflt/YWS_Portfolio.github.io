# Git Workflow Rules

<!-- CUSTOMIZE: Adapt this branching model to your project's workflow. The structure below covers a common Git Flow pattern — simplify or extend as needed. -->

## Main Branches

### main
- Contains production-ready code
- Never commit directly to main
- Only accepts merges via Pull Request
- Must be tagged with version number after each release

### develop (or staging)
<!-- CUSTOMIZE: Some teams use `develop`, others use `staging`, and trunk-based teams skip this entirely. Adjust or remove. -->
- Pre-production integration branch
- Source branch for feature branches
- Never commit directly

## Supporting Branches

### feature/*
- Branch from: develop (or main for trunk-based)
- Merge back into: develop (or main)
- Naming convention: `feature/descriptive-name`
- Must be up-to-date with base branch before creating PR
- Delete after merge

### hotfix/*
- Branch from: main
- Merge back into: main and develop
- Naming convention: `hotfix/descriptive-name`
- Only for urgent production fixes
- Delete after merge

### release/* (optional)
- Branch from: develop
- Merge back into: main and develop
- For release stabilization

## Commit Messages

<!-- CUSTOMIZE: Pick the convention that matches your team. Common patterns: -->

### Conventional Commits (recommended for most projects)
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`
- Example: `feat(auth): add OAuth2 login flow`

### Prefix style (alternative)
- Format: `prefix/ description`
- Prefixes: `feat/`, `fix/`, `hotfix/`, `api/`, `ui/`, `refactor/`, `test/`, `docs/`
- Can combine: `ui/feat/ add dark mode toggle`

## Pull Request Rules

1. All changes must go through Pull Requests
2. CI checks must pass
3. No direct commits to protected branches
4. Delete branch after merge

## Branch Protection Rules

### main (and develop/staging if used)
- Require pull request reviews
- Require status checks to pass
- No force pushes
- No deletions
