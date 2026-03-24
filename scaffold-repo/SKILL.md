---
name: scaffold-repo
description: "Interview + scaffold new project from empty directory -> code + CLAUDE.md + GLOSSARY.md. Triggers: 'new project,' 'scaffold,' 'init,' 'bootstrap,' greenfield, empty directory. Not for: adding features (plan-feature), deploying (deploy-to-vercel), hooks on existing repos (setup-pre-commit)."
---

## Purpose

Scaffold a new project from empty/near-empty directory. Structured interview -> scaffolding via official CLIs, dependency installation, foundation documents (CLAUDE.md, GLOSSARY.md).

## Starting

Before asking anything, inspect the working directory:

1. **Existing project** (framework config, deps, substantial source): Warn. "This has a [framework] project. Did you mean `/plan-feature` or start fresh in a subdirectory?"
2. **Minimal files** (just README, .git, stray files): Note what's there, proceed.
3. **Empty**: Proceed directly.

Open with: "I'll walk you through questions to understand what we're building. I'll recommend along the way — accept, modify, or reject. Let's start."

## Interview Protocol

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code/config comparisons. User can always pick "Other."

### Lead with recommendations

Never blank questions. Always lead with a recommendation: "Based on [context], I'd recommend [choice] because [reason]. Does that work?"

### Collapse obvious choices

When a decision implies sub-decisions, collapse: "Next.js implies TypeScript, React, App Router. I'll assume those. For hosting, Vercel is natural — sound good?"

### Graceful deferral

If user defers ("whatever you think"), state recommendation, record it, move on. Capture as "Recommended defaults" in blueprint.

### Constraint propagation

Upstream decisions eliminate downstream questions. Language gates tooling, framework gates CLI, project type gates scope. Don't ask questions prior decisions already answered.

### Completeness tracking

Track 7 domains. Exhaust every branch — each domain is a branch of the decision tree, not a checkbox. Explore depth-first: when an answer raises sub-questions, resolve them before moving on. Keep asking until fully resolved. If context answers a question, mark it resolved. No limit on question count. Questions stay concise; depth comes from more turns, not longer ones.

## Interview Domains

Work roughly in order. Earlier domains constrain later ones. Follow user's energy.

### 1. Product
Project name, one-line description, users, problem, project type (web app, CLI, API, library, mobile, monorepo). Confirm if already described.

### 2. Architecture
Frontend/backend split, rendering strategy (if web), API style (if backend), service topology. Skip questions eliminated by project type.

### 3. Tooling
Language+runtime, framework, database+ORM, hosting target, auth approach.

### 4. Patterns
Architecture pattern (DDD, clean, feature-sliced, MVC, layered), validation, error handling, state management (if frontend), Effect library (if applicable).

### 5. Structure
Monorepo vs single package, directory layout (feature/layer/domain-based), naming conventions. Follow framework conventions where strong.

### 6. Terminology
Core domain entities (3-7 nouns), key actions/verbs, naming alignment (code, UI, API). Keep lightweight for simple domains.

### 7. Dev Environment
Package manager, linter/formatter, testing framework, git hooks, CI/CD.

## Blueprint Generation

When every domain is fully resolved with no remaining sub-questions: "I have enough to draft the project blueprint."

Generate `PROJECT_BLUEPRINT.md` (in `./plans/` if exists, else current directory). User reviews before scaffolding.

```markdown
# Project Blueprint: <Name>

> Generated from scaffold-repo interview on <date>

## Product
- **Name**: | **Description**: | **Users**: | **Problem**: | **Type**:

## Decisions

| # | Domain | Decision | Rationale |
|---|--------|----------|-----------|
| 1 | Architecture | <choice> | <why> |

## Defaults Accepted
- <deferred decisions with chosen defaults>

## Scaffolding Plan
1. Run `<CLI command>`
2. Install deps: `<packages>`
3. Configure linter/formatter/testing
4. Create directory skeleton
5. Generate CLAUDE.md, GLOSSARY.md, .env.example
6. Init git + initial commit

## Domain Glossary (Preview)
| Term | Definition | Code Name |
|------|-----------|-----------|
```

After generating: "Review this blueprint. When happy, I'll start scaffolding."

## Scaffolding Execution

Once approved, execute in order. Read `references/stack-matrix.md` for correct CLI commands/flags.

### Step 1: Run official scaffold CLI

Use the framework's project creation tool. Never write boilerplate from scratch when a CLI exists. Adapt flags based on interview decisions.

### Step 2: Install additional dependencies

Packages chosen during interview (ORM, auth, validation, etc.). Latest versions unless known compatibility issue.

### Step 3: Configure quality gates

Set up linter, formatter, test runner. Create/update configs. Add scripts: `lint`, `format`, `test`, `build`.

### Step 4: Create directory skeleton

Build agreed structure beyond what CLI created. Only create directories + placeholders that establish the pattern — minimum to show "this is how new features go."

### Step 5: Set up git hooks (if chosen)

Using selected tool (Husky, lefthook, etc.). Typical: lint-staged running formatter on staged files.

### Step 6: Generate foundation documents

#### CLAUDE.md
Most important output. Teaches future Claude sessions how this codebase works. Sections: Development Stage, Quality Gates, Architecture (DB, backend, frontend, auth, API), Patterns (validation, error handling, state), Directory Structure, Naming Conventions. Adapt to what's relevant — CLI doesn't need Frontend, library doesn't need Auth.

#### GLOSSARY.md
Domain terms from interview Domain 6. Format: Term | Definition | Code Name | Notes. Include core entities, key actions, terminology decisions.

#### .env.example (if applicable)
Template with DATABASE_URL, auth secrets, API keys.

#### README.md
Project name, description, prerequisites, setup instructions, quality gate commands.

### Step 7: Initial git commit

If not already a repo: `git init`. Stage and commit: `feat: scaffold <name> with <framework> + <key tools>`

## Wrapping Up

1. **Run quality gates** — lint, build, test. Fix issues.
2. **Summarize** — key files/directories, quality gate commands, foundation docs.
3. **Suggest next steps** — "Run `/write-a-prd` to define your first feature," "Set up DB in `.env`," "Push to GitHub."
