---
name: scaffold-repo
description: MUST USE when a user wants to start a new project, scaffold a repository, create a new app, initialize a codebase, or set up a fresh development environment from scratch. Typical signals — "new project," "scaffold," "init," "bootstrap," "start fresh," "greenfield," "set up a new repo," "create a new app," or describing something they want to build when no codebase exists yet (e.g., "I want to build a SaaS for X," "let's start a Next.js app," "new Python API"). Also applies when the user opens an empty directory and says "let's build something." Conducts a structured interview about product, architecture, tooling, patterns, terminology, and dev environment, then scaffolds the project using official CLIs, installs dependencies, and generates foundation documents (CLAUDE.md, GLOSSARY.md). Do NOT use for adding features to existing projects (use plan-feature), deploying existing projects (use deploy-to-vercel), or setting up hooks on existing repos (use setup-pre-commit).
---

## What This Skill Does

Scaffold a new project from an empty (or near-empty) directory. Conduct a structured interview to understand what's being built, why, and how — then execute the scaffolding using official CLI tools, install dependencies at latest versions, and generate foundation documents that future Claude sessions can build on.

The goal is a codebase foundation with clear patterns that can be replicated for every feature built on top of it. The interview is thorough because getting the foundation right matters more than getting it fast.

## Starting

Before asking anything, inspect the current working directory:

1. **Check what exists.** Run `ls -la` and look for project markers: `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `.git/`, `CLAUDE.md`, `src/`, etc.

2. **If a project already exists** (has a framework config, dependency file, or substantial source code): warn the user. Say something like: "This directory already has a [Next.js / Python / etc.] project. Did you mean to add a feature (`/plan-feature`) or start a fresh project in a subdirectory?" Let them decide before proceeding.

3. **If files exist but it's minimal** (just a README, .git, or a few stray files): note what's there and proceed. Mention what you found so the user knows you're aware.

4. **If empty or nearly empty**: proceed directly to the interview.

Then open with context:

> "I'll walk you through a series of questions to understand what we're building and how. I'll make recommendations along the way — accept, modify, or reject as you like. Let's start with the big picture."

## Interview Protocol

### One question per turn

Each response contains exactly one question (occasionally two if they're tightly coupled) with:
- The question, clearly stated
- 2-4 concrete options when applicable
- Your recommended answer with a brief rationale grounded in what the user has already told you
- An invitation to accept, modify, or reject

Batching questions produces shallow answers. One question, fully resolved, then move on.

### Lead with recommendations

Never ask a blank question like "what language?" — always lead with a recommendation based on what you know so far:

> "Based on a customer-facing web app with real-time features, I'd recommend TypeScript with Next.js on Bun. It gives you SSR, API routes, and a fast dev loop. Does that work, or are you thinking something different?"

### Collapse obvious choices

When a decision implies several sub-decisions, collapse them into a confirmation:

> "Next.js implies TypeScript, React, and the App Router. I'll assume all of those unless you say otherwise. For hosting, Vercel is the natural fit — sound good?"

Only break out implied decisions if the user signals they want to override one.

### Graceful deferral

If the user says "whatever you think," "I don't know," or "you decide" — state your recommended choice explicitly, record it, and move on. Capture deferred decisions in the blueprint as "Recommended defaults." Don't stall the interview on indecision.

### Constraint propagation

Upstream decisions eliminate downstream questions. Track these automatically:

- **Language gates everything**: Python → pip/uv/poetry, Ruff, Pytest, pyproject.toml. TypeScript → npm/pnpm/bun/yarn, Biome/ESLint, Vitest/Jest, package.json. Rust → cargo, rustfmt, cargo test, Cargo.toml.
- **Framework gates CLI**: Next.js → `create-next-app`. Vite → `create-vite`. FastAPI → `uv init` + `uv add`. Rust → `cargo init`.
- **Project type gates scope**: CLI tool → no frontend rendering questions. Frontend-only → no database questions. Library → no hosting questions.

Don't ask questions that prior decisions have already answered.

### Completeness tracking

Follow the natural conversation, but internally track whether you've resolved decisions across these 7 domains. When the conversation winds down, check for gaps and ask about any unresolved domain before generating the blueprint.

## Interview Domains

Work through these roughly in order. Earlier domains constrain later ones, but follow the user's energy — if they jump ahead, go with them and circle back.

### 1. Product (1-2 questions)

Understand what's being built and why. Resolve:
- **Project name** — used for directory, package name, repo name
- **One-line description** — what it does
- **Users** — who uses it (developers, consumers, internal team, etc.)
- **Problem** — what pain point it solves
- **Project type** — web app, CLI, API/backend, library/package, mobile app, monorepo with multiple packages

If the user already described the product in their initial message, confirm rather than re-ask.

### 2. Architecture (1-2 questions)

Determine the system shape. Resolve:
- **Frontend/backend split** — frontend-only, full-stack (single app), backend-only, or separate frontend + API
- **Rendering strategy** (if web) — SSR, SPA, static, hybrid/ISR
- **API style** (if backend exists) — REST, GraphQL, tRPC, gRPC, or framework-native (Next.js route handlers, etc.)
- **Service topology** — monolith, modular monolith, microservices, serverless functions

Skip questions eliminated by project type (CLI → no rendering strategy, library → no API style).

### 3. Tooling (2-3 questions)

Pin the technology choices. Resolve:
- **Language and runtime** — TypeScript+Node, TypeScript+Bun, Python, Rust, Go, etc.
- **Framework** — Next.js, Vite+React, Vite+Vue, FastAPI, Django, Axum, Express, Hono, etc.
- **Database** — Postgres, SQLite, MongoDB, none, etc. Plus ORM/query builder if applicable.
- **Hosting target** — Vercel, AWS, Fly.io, Cloudflare, Railway, self-hosted, undecided
- **Auth approach** — Better Auth, NextAuth, Clerk, Lucia, Auth0, none, custom, undecided

### 4. Patterns (1-2 questions)

Establish the code patterns that will be replicated across the codebase. Resolve:
- **Architecture pattern** — DDD, clean architecture, feature-sliced, simple MVC, layered (repository → service → handler), none/organic
- **Validation** — Zod, Effect Schema, Valibot, Pydantic, Joi, built-in, etc.
- **Error handling** — Effect, Result types, exceptions with error classes, framework defaults
- **State management** (if frontend) — React Query/SWR, Zustand, Redux, Jotai, framework defaults
- **Effect library** — if using Effect (TypeScript), this shapes the entire backend pattern (services, layers, tagged errors)

These choices define the "how we do things here" that every future feature follows.

### 5. Structure (1-2 questions)

Define how code is organized. Resolve:
- **Monorepo vs single package** — if monorepo, which tool (Turborepo, Nx, pnpm workspaces, Cargo workspaces)
- **Directory layout** — feature-based (`src/features/auth/`), layer-based (`src/server/`, `src/client/`), domain-based (`src/server/users/`, `src/server/billing/`), or framework default
- **Naming conventions** — file casing (kebab-case, camelCase, PascalCase), component naming, module naming

When a framework has strong conventions (Next.js App Router, Rust Cargo), follow them and note deviations rather than asking from scratch.

### 6. Terminology (1-2 questions)

Establish the ubiquitous language for the domain. Resolve:
- **Core domain entities** — the 3-7 most important nouns in the system (e.g., User, Organization, Campaign, Election)
- **Key actions/verbs** — what users do (e.g., "cast a vote" vs "submit a ballot" vs "record a response")
- **Naming alignment** — ensure entity names match what will appear in code (table names, model names, API endpoints, UI labels)

If the domain is simple or generic (a todo app, a blog), keep this lightweight. If the domain has specific terminology the team uses, capture it carefully — misaligned naming causes confusion across every future feature.

### 7. Dev Environment (1-2 questions)

Configure the development toolchain. Resolve:
- **Package manager** — npm, pnpm, bun, yarn, uv, pip, cargo (often implied by runtime choice)
- **Linter/formatter** — Biome, ESLint+Prettier, Ruff, rustfmt, gofmt, etc.
- **Testing framework** — Vitest, Jest, Pytest, cargo test, Go testing, etc.
- **Git hooks** — Husky+lint-staged, lefthook, pre-commit, none
- **CI/CD** — GitHub Actions, Vercel auto-deploy, none for now

## Blueprint Generation

When all domains are resolved, say: "I have enough to draft the project blueprint. Let me put it together."

Generate `PROJECT_BLUEPRINT.md` in the current directory (or `./plans/` if that directory exists). This is the user's chance to review every decision before any scaffolding happens.

### Blueprint Template

```markdown
# Project Blueprint: <Name>

> Generated from scaffold-repo interview on <date>

## Product
- **Name**: <name>
- **Description**: <one-liner>
- **Users**: <who>
- **Problem**: <what pain>
- **Type**: <web app / CLI / API / library / monorepo>

## Decisions

| # | Domain | Decision | Rationale |
|---|--------|----------|-----------|
| 1 | Architecture | <choice> | <why> |
| 2 | Language/Runtime | <choice> | <why> |
| ... | ... | ... | ... |

## Defaults Accepted
- <decisions the user deferred, with the recommended default chosen>

## Scaffolding Plan
1. Run `<CLI command with flags>`
2. Install additional deps: `<package list>`
3. Configure <linter/formatter/testing>
4. Create directory skeleton
5. Generate CLAUDE.md, GLOSSARY.md, .env.example
6. Initialize git and create initial commit

## Domain Glossary (Preview)
| Term | Definition | Code Name |
|------|-----------|-----------|
| <entity> | <meaning> | <variable/table name> |
```

After generating, say: "Review this blueprint. When you're happy with it, I'll start scaffolding."

## Scaffolding Execution

Once the user approves the blueprint, execute in this order. Read `references/stack-matrix.md` for the correct CLI commands and flags for the chosen stack.

### Step 1: Run the official scaffold CLI

Use the framework's official project creation tool. Never write framework boilerplate from scratch when a CLI exists. Examples:
- Next.js: `bunx create-next-app@latest <name> --typescript --tailwind --app --src-dir`
- Vite: `bunx create-vite@latest <name> --template react-ts`
- Python: `uv init <name>` or `mkdir <name> && cd <name> && uv init`
- Rust: `cargo init <name>`

Use the package manager chosen in the interview to run the CLI. Adapt flags based on interview decisions (e.g., `--no-tailwind` if not using Tailwind).

### Step 2: Install additional dependencies

After the scaffold CLI finishes, install additional packages chosen during the interview (ORM, auth library, validation, state management, etc.) using the chosen package manager. Always install latest versions — don't pin to specific versions unless there's a known compatibility issue.

### Step 3: Configure quality gates

Set up linter, formatter, and test runner based on interview choices. Create or update config files (`biome.json`, `.prettierrc`, `vitest.config.ts`, `ruff.toml`, etc.). Add scripts to `package.json` / `pyproject.toml` / `Makefile`:
- `lint` — run linter
- `format` — run formatter (or combined with lint)
- `test` — run test suite
- `build` — production build (if applicable)

### Step 4: Create directory skeleton

Build out the agreed directory structure beyond what the scaffold CLI created. For example, if the user chose a domain-based layout:
```
src/
  server/
    shared/        # cross-cutting concerns
    <domain>/      # one per core entity
      service.ts
      repository.ts
  hooks/           # custom React hooks
  lib/             # shared utilities, configs
  emails/          # email templates (if applicable)
```

Only create directories and placeholder files that establish the pattern. Don't create empty files just to have them — create the minimum needed to show "this is how new features go here."

### Step 5: Set up git hooks (if chosen)

If the user chose git hooks, set them up using the selected tool (Husky, lefthook, etc.). Typical pre-commit: lint-staged running the formatter on staged files.

### Step 6: Generate foundation documents

#### CLAUDE.md

This is the most important output. It teaches every future Claude session how this codebase works. Model it after a well-structured project guide with these sections:

```markdown
## Development Stage
This app is in active development. Breaking changes are acceptable...

## Quality Gates
<the lint/build/test commands set up in Step 3>

## Architecture
- **Database**: <db + ORM>
- **Backend**: <pattern description>
- **Frontend**: <framework + state management>
- **Auth**: <approach>
- **API**: <style + conventions>

## Patterns
- **Validation**: <library + approach>
- **Error handling**: <approach>
- **State management**: <library>

## Directory Structure
- src/server/ — backend services
- src/app/ — pages and routes
- ...

## Naming Conventions
- Files: <casing>
- Components: <casing>
- Database tables: <casing>
- API routes: <convention>
```

Adapt sections to what's relevant. A CLI tool doesn't need a "Frontend" section. A library doesn't need "Auth." Only include sections that apply.

#### GLOSSARY.md

Standalone ubiquitous language document capturing the domain terms from interview Domain 6:

```markdown
# Glossary: <Project Name>

> Domain terminology for <project>. Use these terms consistently in code, UI, docs, and conversation.

| Term | Definition | Code Name | Notes |
|------|-----------|-----------|-------|
| <Entity> | <what it means in this domain> | <how it appears in code: table name, class name> | <usage notes, synonyms to avoid> |
```

Include the core entities, key actions, and any terminology decisions made during the interview. If the domain is simple, this might only be 5-10 entries — that's fine.

#### .env.example (if applicable)

If the project needs environment variables (database URL, auth secrets, API keys), create a template:
```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Auth
BETTER_AUTH_SECRET=your-secret-here
```

#### README.md

Update or create with: project name, description, prerequisites, setup instructions (clone, install, env setup, run), and the quality gate commands.

### Step 7: Initial git commit

If not already a git repo, run `git init`. Stage all files and create the initial commit:
```
feat: scaffold <project-name> with <framework> + <key tools>
```

## Wrapping Up

After scaffolding is complete:

1. **Run quality gates** — execute the lint, build, and test commands to verify everything works out of the box. Fix any issues.

2. **Summarize what was created** — list the key files and directories, what each quality gate command does, and where to find the foundation documents.

3. **Suggest next steps** — based on the project, recommend what to build first. Examples:
   - "Run `/write-a-prd` to define your first feature"
   - "Set up your database connection in `.env` and run migrations"
   - "Push to GitHub and configure Vercel for auto-deploys"
