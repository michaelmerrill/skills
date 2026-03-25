# Convention Inheritance

Read these files when bootstrapping inside an existing repo (contexts B, C, D).

## Files to Read

| File | Extract |
|------|---------|
| `CLAUDE.md` (root or nearest) | Architecture patterns, naming conventions, quality gate commands, project structure |
| `package.json` / `pyproject.toml` / `Cargo.toml` | Language, existing deps |
| Lockfile (`bun.lockb`, `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `uv.lock`) | Package manager |
| `tsconfig.json` / `tsconfig.base.json` | TypeScript config, path aliases, strictness |
| `biome.json` / `.eslintrc*` / `ruff.toml` / `.prettierrc*` | Linter/formatter |
| `vitest.config.*` / `jest.config.*` / `pytest.ini` / `pyproject.toml [tool.pytest]` | Test framework |
| `turbo.json` / `nx.json` / `pnpm-workspace.yaml` | Monorepo tool, workspace structure, pipeline tasks |
| `.husky/*` / `lefthook.yml` | Git hooks |
| Existing `apps/*/package.json`, `packages/*/package.json` | Naming patterns, dependency patterns for workspace members |

## What Inheritance Resolves

Inherited conventions skip the corresponding interview questions. The "Still Ask" column shows what remains open even after inheritance.

| Inherited Convention | Resolves Domain | Still Ask |
|---------------------|----------------|-----------|
| Language + runtime | Tooling (partial) | Framework choice for new app |
| Package manager | Dev Environment (partial) | Nothing |
| Linter/formatter | Dev Environment (partial) | Nothing |
| Test framework | Dev Environment (partial) | Nothing |
| Git hooks | Dev Environment (partial) | Nothing |
| Monorepo tool | Structure (partial) | Placement (which dir) |
| Architecture patterns from CLAUDE.md | Patterns (partial) | App-specific pattern choices |
| Naming conventions | Terminology (partial) | New domain entities |
