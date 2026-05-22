# Plans Directory

This directory holds active and archived implementation plans created during development.

Plans are project-specific work items — start with an empty directory for a new project.

## Plan file format

```yaml
---
name: Plan Title
overview: Brief description
todos:
  - id: task-id
    content: Task description
    status: pending | in-progress | completed
---

# Plan Title

Detailed sections with context, implementation details, etc.
```

## Usage

- Plans are saved here automatically when exiting plan mode in Claude Code.
- Archive completed plans by moving them to an `archived/` subdirectory.
