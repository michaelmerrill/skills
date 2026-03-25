# Interview Domains — Per-Context Variants

Work roughly in order. Earlier domains constrain later ones. Follow user's energy. Adapt per context.

## 1. Product

Project name, one-line description, users, problem. Confirm if already described.

- **Standalone (A/E)**: Project type (web app, CLI, API, library, mobile, monorepo).
- **Monorepo add (B/C)**: What to add — new app, new package/shared library, new service. Placement within workspace (`apps/<name>`, `packages/<name>`, or custom).
- **Existing project add (D)**: What to add — new module, new service, new sub-project. Placement within existing structure.

## 2. Architecture

Frontend/backend split, rendering strategy (if web), API style (if backend), service topology. Skip questions eliminated by project type. When inheriting, present existing architecture as default.

## 3. Tooling

Language+runtime, framework, database+ORM, hosting target, auth approach. When inheriting, language/runtime are resolved — still ask framework (monorepo can have Next.js app AND Hono API) and database/ORM unless shared from an existing workspace package.

## 4. Patterns

Architecture pattern (DDD, clean, feature-sliced, MVC, layered), validation, error handling, state management (if frontend), Effect library (if applicable). When inheriting from CLAUDE.md, present inherited patterns as defaults — still ask about app-specific patterns not covered.

## 5. Structure

- **Standalone (A/E)**: Monorepo vs single package, directory layout (feature/layer/domain-based), naming conventions. Follow framework conventions where strong.
- **Monorepo add (B/C)**: Skip "monorepo vs single" (already a monorepo). Ask: placement directory (confirm `apps/` vs `packages/` vs custom), internal directory layout for the new workspace member. Match existing patterns.
- **Existing project add (D)**: Ask about module/service placement within existing project structure.

## 6. Terminology

Core domain entities (3-7 nouns), key actions/verbs, naming alignment (code, UI, API). Keep lightweight for simple domains. When inheriting from existing GLOSSARY.md or CLAUDE.md terminology, carry those forward — only ask about new domain entities for this app/service.

## 7. Dev Environment

Package manager, linter/formatter, testing framework, git hooks, CI/CD.

- **Standalone (A/E)**: Full interview.
- **Inheriting (B/C/D)**: Mostly skipped — package manager, linter, formatter, test runner, git hooks all inherited. Only ask about app-specific dev needs not already covered (e.g., new database driver for this specific app).
