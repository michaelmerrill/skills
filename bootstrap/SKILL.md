---
name: bootstrap
description: "Initialize new codebases — standalone project, monorepo, or new app/package/service within existing repo. Interview + convention inheritance + scaffold + foundation docs. Triggers: 'new project,' 'bootstrap,' 'init,' 'scaffold,' 'add app,' 'add package,' 'new service,' greenfield, empty directory. Not for: adding features (explore), deploying (deploy-to-vercel), hooks on existing repos (setup-pre-commit)."
---

## Purpose

Initialize new codebases of any kind. Structured interview, convention inheritance when inside existing repos, scaffolding via official CLIs, foundation documents. Handles: (1) new standalone project, (2) new monorepo from scratch, (3) new app/package within existing monorepo, (4) new service/module in existing codebase.

## Starting — Context Detection

Before asking anything, inspect the working directory and classify into one of five contexts:

1. **Check for monorepo markers** at repo root or ancestors: `turbo.json`, `pnpm-workspace.yaml`, `nx.json`, `lerna.json`, root `package.json` with `workspaces` field
2. **Check if cwd is inside** a monorepo's `apps/` or `packages/` subdirectory
3. **Check for existing project markers**: `package.json` with dependencies, `pyproject.toml`, `Cargo.toml`, framework configs (`next.config.*`, `vite.config.*`, etc.), substantial source files
4. **Check for near-empty**: only `.git`, `README.md`, `LICENSE`, or similar

### Contexts

| Context | Detection | Behavior |
|---------|-----------|----------|
| **A. Empty directory** | No files, or only `.git`/README/LICENSE | New standalone project |
| **B. Monorepo root** | Monorepo markers present at cwd | Offer: add new app, package, or service. Run Convention Inheritance. |
| **C. Inside monorepo workspace** | Ancestor has monorepo markers, cwd within `apps/` or `packages/` tree | Adding to this specific workspace location. Run Convention Inheritance. |
| **D. Existing standalone project** | Framework config, deps, substantial source, no monorepo markers | Warn. Suggest `/explore`, or offer to add a new module/service within. |
| **E. Near-empty** | `.git` + README only, no real code | New project (same as A, note existing files) |

### Opening message per context

- **A/E**: "I'll walk you through questions to understand what we're building. I'll recommend along the way. Let's start."
- **B**: "This is a [Turborepo/Nx/pnpm] monorepo. I'll read its conventions and then help you add a new app, package, or service."
- **C**: "You're inside `[path]` in a [tool] monorepo. I'll inherit the workspace conventions and scaffold here."
- **D**: "This directory has an existing [framework] project. Did you mean `/explore`? Or I can add a new module/service within this project."

## Convention Inheritance

Runs for contexts B, C, D only. Skipped for A/E.

### Files to read and extract

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
| Existing `apps/*/package.json`, `packages/*/package.json` | Naming patterns, dependency patterns for existing workspace members |

### Present inherited conventions

After reading, present a single summary confirmation via `AskUserQuestion`:

> "This monorepo uses: [language], [package manager], [linter/formatter], [test framework], [monorepo tool]. Apps follow `apps/<name>` with [framework]. I'll use these conventions for the new [app/package]. Override anything?"

Options: "Looks good (Recommended)", "Let me override some", "Show me everything you found"

- **Looks good**: Record all inherited conventions, proceed to interview with resolved domains marked.
- **Override**: Present each inherited convention individually via `AskUserQuestion` with current value as recommended + alternatives.
- **Show everything**: Display full extracted context, then proceed.

### What inheritance resolves

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

## Interview Protocol

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code/config comparisons. User can always pick "Other."

### Inheritance-aware

When conventions were inherited, skip resolved questions. State what was inherited and why you're skipping. If user wants to revisit, allow it.

### Lead with recommendations

Never blank questions. Always lead with a recommendation: "Based on [context], I'd recommend [choice] because [reason]. Does that work?"

### Collapse obvious choices

When a decision implies sub-decisions, collapse: "Next.js implies TypeScript, React, App Router. I'll assume those. For hosting, Vercel is natural — sound good?"

### Graceful deferral

If user defers ("whatever you think"), state recommendation, record it, move on. Capture as "Recommended defaults" in blueprint.

### Constraint propagation

Upstream decisions eliminate downstream questions. Language gates tooling, framework gates CLI, project type gates scope. Don't ask questions prior decisions already answered.

### Completeness tracking

Track 7 domains. Exhaust every branch — each domain is a branch of the decision tree, not a checkbox. Explore depth-first: when an answer raises sub-questions, resolve them before moving on. Keep asking until fully resolved. If context or inheritance answers a question, mark it resolved. No limit on question count. Questions stay concise; depth comes from more turns, not longer ones.

## Interview Domains

Work roughly in order. Earlier domains constrain later ones. Follow user's energy. Adapt per context.

### 1. Product

Project name, one-line description, users, problem. Confirm if already described.

- **Standalone (A/E)**: Project type (web app, CLI, API, library, mobile, monorepo).
- **Monorepo add (B/C)**: What to add — new app, new package/shared library, new service. Placement within workspace (`apps/<name>`, `packages/<name>`, or custom).
- **Existing project add (D)**: What to add — new module, new service, new sub-project. Placement within existing structure.

### 2. Architecture

Frontend/backend split, rendering strategy (if web), API style (if backend), service topology. Skip questions eliminated by project type. When inheriting, present existing architecture as default.

### 3. Tooling

Language+runtime, framework, database+ORM, hosting target, auth approach. When inheriting, language/runtime are resolved — still ask framework (monorepo can have Next.js app AND Hono API) and database/ORM unless shared from an existing workspace package.

### 4. Patterns

Architecture pattern (DDD, clean, feature-sliced, MVC, layered), validation, error handling, state management (if frontend), Effect library (if applicable). When inheriting from CLAUDE.md, present inherited patterns as defaults — still ask about app-specific patterns not covered.

### 5. Structure

- **Standalone (A/E)**: Monorepo vs single package, directory layout (feature/layer/domain-based), naming conventions. Follow framework conventions where strong.
- **Monorepo add (B/C)**: Skip "monorepo vs single" (already a monorepo). Ask: placement directory (confirm `apps/` vs `packages/` vs custom), internal directory layout for the new workspace member. Match existing patterns.
- **Existing project add (D)**: Ask about module/service placement within existing project structure.

### 6. Terminology

Core domain entities (3-7 nouns), key actions/verbs, naming alignment (code, UI, API). Keep lightweight for simple domains. When inheriting from existing GLOSSARY.md or CLAUDE.md terminology, carry those forward — only ask about new domain entities for this app/service.

### 7. Dev Environment

Package manager, linter/formatter, testing framework, git hooks, CI/CD.

- **Standalone (A/E)**: Full interview (current behavior).
- **Inheriting (B/C/D)**: Mostly skipped — package manager, linter, formatter, test runner, git hooks all inherited. Only ask about app-specific dev needs not already covered (e.g., new database driver for this specific app).

## Blueprint Generation

When every domain is fully resolved with no remaining sub-questions: "I have enough to draft the project blueprint."

Generate `PROJECT_BLUEPRINT.md` (in `./plans/` if exists, else current directory). User reviews before scaffolding.

```markdown
# Project Blueprint: <Name>

> Generated from bootstrap interview on <date>
> Context: <standalone project | new app in [monorepo-name] | new package in [monorepo-name] | new module in [project-name]>

## Product
- **Name**: | **Description**: | **Users**: | **Problem**: | **Type**:

## Inherited Conventions
<!-- Only present for contexts B, C, D -->
| Convention | Source | Value | Overridden? |
|-----------|--------|-------|-------------|
| Language | tsconfig.json | TypeScript | No |
| Package manager | pnpm-lock.yaml | pnpm | No |

## Decisions

| # | Domain | Decision | Rationale |
|---|--------|----------|-----------|
| 1 | Architecture | <choice> | <why> |

## Defaults Accepted
- <deferred decisions with chosen defaults>

## Scaffolding Plan
1. <context-appropriate steps — see Scaffolding Execution>

## Domain Glossary (Preview)
| Term | Definition | Code Name |
|------|-----------|-----------|
```

After generating: "Review this blueprint. When happy, I'll start scaffolding."

## Scaffolding Execution

Once approved, execute in order. Read `references/stack-matrix.md` for correct CLI commands/flags.

### Step 1: Run official scaffold CLI (or create structure)

- **Standalone**: Use the framework's project creation tool. Never write boilerplate from scratch when a CLI exists. Adapt flags based on interview decisions.
- **Monorepo app**: Run CLI within the target directory (e.g., `cd apps && bunx create-next-app@latest dashboard ...`).
- **Monorepo package**: No CLI usually — create `packages/<name>/` with `package.json` (name: `@<scope>/<name>`), `tsconfig.json` extending base, `src/index.ts` with exports.
- **Module in existing**: Create directory structure within existing project layout.

### Step 2: Install additional dependencies

Packages chosen during interview (ORM, auth, validation, etc.). Latest versions unless known compatibility issue.

- **Monorepo**: Install within the new workspace member's directory. Use workspace protocol for internal deps (`"@repo/ui": "workspace:*"`).

### Step 3: Configure quality gates

- **Standalone**: Set up linter, formatter, test runner. Create/update configs. Add scripts: `lint`, `format`, `test`, `build`.
- **Inheriting**: Skip if inherited from workspace root. Only configure app-specific overrides (e.g., `tsconfig.json` extending `../../packages/config-typescript/tsconfig.json`).

### Step 4: Create directory skeleton

Build agreed structure beyond what CLI created. Only create directories + placeholders that establish the pattern — minimum to show "this is how new features go." Match existing monorepo patterns when inheriting.

### Step 5: Register in workspace (monorepo contexts only)

- Add to `pnpm-workspace.yaml` if needed (often automatic via glob patterns).
- Ensure `turbo.json` tasks apply (usually automatic with Turborepo).
- Add internal workspace deps where appropriate (`workspace:*`).
- **Standalone/module**: Skip this step.

### Step 6: Set up git hooks (if chosen)

- **Standalone**: Using selected tool (Husky, lefthook, etc.). Typical: lint-staged running formatter on staged files.
- **Inheriting**: Skip — already set up at repo root.

### Step 7: Generate foundation documents

#### Standalone (A/E)

- **CLAUDE.md**: Most important output. Teaches future Claude sessions how this codebase works. Sections: Development Stage, Quality Gates, Architecture (DB, backend, frontend, auth, API), Patterns (validation, error handling, state), Directory Structure, Naming Conventions. Adapt to what's relevant.
- **GLOSSARY.md**: Domain terms from interview. Format: Term | Definition | Code Name | Notes.
- **.env.example** (if applicable): Template with DATABASE_URL, auth secrets, API keys.
- **README.md**: Project name, description, prerequisites, setup instructions, quality gate commands.

#### Monorepo app/package (B/C)

- **Scoped CLAUDE.md** within the new workspace member (e.g., `apps/dashboard/CLAUDE.md`). Focus on app-specific architecture, patterns, and structure — reference root CLAUDE.md for shared conventions.
- **Update root CLAUDE.md**: Append the new member to directory structure / architecture section.
- **Scoped README.md**: App-specific setup, dev commands, purpose.
- **GLOSSARY.md**: Add new terms to root GLOSSARY.md if it exists. Otherwise create scoped one.
- **.env.example** (if applicable): App-specific environment variables.

#### Module in existing (D)

- **Scoped README.md** for the module/service.
- **Update root CLAUDE.md** to reference the new module.

### Step 8: Initial git commit

- **Standalone**: If not already a repo: `git init`. Stage and commit: `feat: scaffold <name> with <framework> + <key tools>`
- **Inheriting**: Commit only (no `git init`). Message: `feat(<workspace-name>): scaffold <name> with <framework> + <key tools>`

## Wrapping Up

1. **Run quality gates** — lint, build, test. Fix issues.
2. **Summarize** — key files/directories, quality gate commands, foundation docs.
3. **Suggest next steps**:
   - Standalone: "Run `/explore` to scope your first feature," "Set up DB in `.env`," "Push to GitHub."
   - Monorepo app: "Run `/explore` to scope the first feature for `<app-name>`."
   - Monorepo package: "Start building the package API, or run `/explore` if it needs planning."
   - Module in existing: "Run `/explore` to plan the first capability for this module."
