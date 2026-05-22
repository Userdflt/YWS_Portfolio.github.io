<!-- OPTIONAL: Remove this file if your project does not use Python. The /setup skill handles this automatically. -->
---
paths:
  - "**/*.py"
  - "pyproject.toml"
  - "setup.cfg"
  - "requirements*.txt"
---

# Python Best Practices

## Project Structure
- Follow standard Python packaging conventions (`src/` layout or flat layout)
- Use `__init__.py` for package initialization and public API exports
- Keep modules focused: one responsibility per module
- Use `pyproject.toml` for project configuration (PEP 621)

## Type Hints
- Use type annotations for all public function signatures
- Prefer `str | None` over `Optional[str]` (Python 3.10+)
- Use `TypedDict` for structured dictionaries
- Use `Protocol` for structural subtyping instead of ABCs when possible
- Run `mypy` or `pyright` in strict mode

## Naming Conventions
- `snake_case` for functions, methods, variables, modules
- `PascalCase` for classes and type aliases
- `UPPER_SNAKE_CASE` for constants
- Prefix private members with `_`
- Descriptive names: `user_count` not `n`, `is_valid` not `flag`

## Code Organization
- Imports at the top: stdlib, then third-party, then local (enforce with `isort`)
- One class per file for complex classes; group small related classes
- Keep functions under 30 lines when practical
- Use `dataclasses` or `pydantic` models over raw dicts for structured data

## Error Handling
- Raise specific exceptions, not generic `Exception`
- Create custom exception classes for domain errors
- Use `try/except` only for expected failure modes, not control flow
- Always log or re-raise — never silently swallow exceptions
- Use context managers (`with`) for resource management

## Testing
- Use `pytest` as the test framework
- Follow `test_<module>.py` naming convention
- Use fixtures for test setup and teardown
- Prefer `pytest.raises` for exception testing
- Use `parametrize` for data-driven tests
- Mock external services at the boundary, not internal logic

## Async Patterns
- Use `async/await` for I/O-bound operations
- Prefer `asyncio.gather` for concurrent I/O
- Use `httpx` or `aiohttp` for async HTTP clients
- Keep CPU-bound work out of the event loop (use `run_in_executor`)

## Dependencies
- Pin versions in `requirements.txt` or `pyproject.toml` for reproducibility
- Use virtual environments (`venv`, `uv`, `poetry`)
- Prefer well-maintained packages with active security updates
- Check for known vulnerabilities with `pip-audit` or `safety`

## Code Quality
- Format with `ruff format` or `black`
- Lint with `ruff` (replaces flake8, isort, pyupgrade)
- Type check with `mypy` or `pyright`
- Docstrings for public functions using Google or NumPy style
