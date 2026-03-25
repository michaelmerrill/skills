# Scaffolding Steps

Execute in order after blueprint approval. Read `references/stack-matrix.md` for correct CLI commands/flags per stack.

## Step 1: Run Official Scaffold CLI

- **Standalone**: Use the framework's project creation tool. Never write boilerplate from scratch when a CLI exists. Adapt flags based on interview decisions.
- **Monorepo app**: Run CLI within the target directory (e.g., `cd apps && bunx create-next-app@latest dashboard ...`).
- **Monorepo package**: No CLI usually — create `packages/<name>/` with `package.json` (name: `@<scope>/<name>`), `tsconfig.json` extending base, `src/index.ts` with exports.
- **Module in existing**: Create directory structure within existing project layout.

## Step 2: Install Additional Dependencies

Packages chosen during interview (ORM, auth, validation, etc.). Latest versions unless known compatibility issue.

- **Monorepo**: Install within the new workspace member's directory. Use workspace protocol for internal deps (`"@repo/ui": "workspace:*"`).

## Step 3: Configure Quality Gates

- **Standalone**: Set up linter, formatter, test runner. Create/update configs. Add scripts: `lint`, `format`, `test`, `build`.
- **Inheriting**: Skip if inherited from workspace root. Only configure app-specific overrides (e.g., `tsconfig.json` extending base).

## Step 4: Create Directory Skeleton

Build agreed structure beyond what CLI created. Only create directories + placeholders that establish the pattern — minimum to show "this is how new features go." Match existing monorepo patterns when inheriting.

## Step 5: Register in Workspace (monorepo only)

- Add to `pnpm-workspace.yaml` if needed (often automatic via glob patterns).
- Ensure `turbo.json` tasks apply (usually automatic with Turborepo).
- Add internal workspace deps where appropriate (`workspace:*`).
- **Standalone/module**: Skip this step.

## Step 6: Set Up Git Hooks (if chosen)

- **Standalone**: Using selected tool (Husky, lefthook, etc.). Typical: lint-staged running formatter on staged files.
- **Inheriting**: Skip — already set up at repo root.

## Step 7: Generate Foundation Documents

### Standalone (A/E)

- **CLAUDE.md**: Most important output. Teaches future Claude sessions how this codebase works. Sections: Development Stage, Quality Gates, Architecture (DB, backend, frontend, auth, API), Patterns (validation, error handling, state), Directory Structure, Naming Conventions. Adapt to what's relevant.
- **GLOSSARY.md**: Domain terms from interview. Format: Term | Definition | Code Name | Notes.
- **.env.example** (if applicable): Template with DATABASE_URL, auth secrets, API keys.
- **README.md**: Project name, description, prerequisites, setup instructions, quality gate commands.

### Monorepo App/Package (B/C)

- **Scoped CLAUDE.md** within the new workspace member (e.g., `apps/dashboard/CLAUDE.md`). Focus on app-specific architecture — reference root CLAUDE.md for shared conventions.
- **Update root CLAUDE.md**: Append the new member to directory structure / architecture section.
- **Scoped README.md**: App-specific setup, dev commands, purpose.
- **GLOSSARY.md**: Add new terms to root GLOSSARY.md if it exists. Otherwise create scoped one.
- **.env.example** (if applicable): App-specific environment variables.

### Module in Existing (D)

- **Scoped README.md** for the module/service.
- **Update root CLAUDE.md** to reference the new module.

## Step 8: Initial Git Commit

- **Standalone**: If not already a repo: `git init`. Stage and commit: `feat: scaffold <name> with <framework> + <key tools>`
- **Inheriting**: Commit only (no `git init`). Message: `feat(<workspace-name>): scaffold <name> with <framework> + <key tools>`
