---
name: bootstrap
description: "Initialize new codebases — standalone project, monorepo, or new app/package/service within existing repo. Interview + convention inheritance + scaffold + foundation docs. Triggers: 'new project,' 'bootstrap,' 'init,' 'scaffold,' 'add app,' 'add package,' 'new service,' greenfield, empty directory. Not for: adding features (scope), deploying (deploy-to-vercel), hooks on existing repos (setup-pre-commit)."
---

Structured interview → convention inheritance → scaffold → foundation docs. Handles standalone projects, monorepo apps/packages, and modules in existing codebases. Standalone skill. After scaffolding, enter the feature pipeline with `/scope`.

## Starting — Context Detection

Before asking anything, inspect the working directory. Classify:

| Context | Detection | Behavior |
|---------|-----------|----------|
| **A. Empty dir** | No files or only `.git`/README/LICENSE | New standalone project |
| **B. Monorepo root** | `turbo.json`, `pnpm-workspace.yaml`, `nx.json`, or root `workspaces` | Add app/package/service. Run Convention Inheritance. |
| **C. Inside monorepo** | Ancestor has monorepo markers, cwd in `apps/`/`packages/` | Scaffold at this location. Run Convention Inheritance. |
| **D. Existing project** | Framework config, deps, source, no monorepo markers | Warn. Suggest `/scope` or offer to add module/service. |
| **E. Near-empty** | `.git` + README only | Same as A, note existing files |

Contexts B/C/D: run Convention Inheritance next. A/E: skip to Interview.

## Convention Inheritance

For contexts B/C/D only. Read repo conventions — files list and inheritance mapping in `references/convention-inheritance.md`.

Present summary via `AskUserQuestion`: "[monorepo tool], [language], [package manager], [linter], [test runner]. Override anything?"
Options: "Looks good (Recommended)", "Let me override some", "Show me everything you found"

- **Looks good**: Record all, proceed to interview with resolved domains marked.
- **Override**: Present each convention individually with current value as recommended.
- **Show everything**: Display full context, then proceed.

## Interview Protocol

Use `AskUserQuestion` for every question (see CLAUDE.md conventions). When user can't decide: state recommendation, record it, move on.

Inheritance-aware: skip resolved questions, state what was inherited. Collapse obvious sub-decisions ("Next.js implies TypeScript, React, App Router"). Constraint propagation: upstream decisions eliminate downstream questions.

### Completeness tracking

Track 7 domains depth-first. Exhaust sub-questions before moving on. Per-context variants in `references/interview-domains.md`. After resolving each domain, append `<!-- progress: domain-N resolved -->` to the target section in `PROJECT_BLUEPRINT.md` (create file early if needed). On resume, detect markers and skip resolved domains. Remove markers when writing the final blueprint.

| # | Domain | Covers |
|---|--------|--------|
| 1 | Product | Name, description, type, placement (context-dependent) |
| 2 | Architecture | Frontend/backend split, rendering, API style, topology |
| 3 | Tooling | Language, framework, database, hosting, auth |
| 4 | Patterns | Architecture pattern, validation, error handling, state |
| 5 | Structure | Monorepo vs single, directory layout, naming |
| 6 | Terminology | Core domain entities (3-7 nouns), key verbs, naming |
| 7 | Dev Environment | Package manager, linter, test runner, hooks, CI |

## Blueprint Generation

When every domain is fully resolved: "I have enough to draft the project blueprint."

Generate `PROJECT_BLUEPRINT.md` (in `./plans/` if exists, else cwd) using template in `assets/blueprint-template.md`. Include inherited conventions table for contexts B/C/D.

After generating: "Review this blueprint. When happy, I'll start scaffolding."

## Scaffolding Execution

Once approved, execute steps in `references/scaffolding-steps.md`. Read `references/stack-matrix.md` for CLI commands and flags.

Summary:
1. Run official scaffold CLI (or create structure manually)
2. Install additional dependencies from interview
3. Configure quality gates (skip if inherited)
4. Create directory skeleton beyond CLI output
5. Register in workspace (monorepo only)
6. Set up git hooks (skip if inherited)
7. Generate foundation docs (CLAUDE.md, GLOSSARY.md, README.md, .env.example)
8. Initial git commit

## Wrapping Up

1. **Run quality gates** — lint, build, test. Fix issues.
2. **Summarize** — key files/directories, quality gate commands, foundation docs created.
3. **Suggest next steps**:
   - Standalone: "Run `/scope` to scope your first feature." Set up DB, push to GitHub.
   - Monorepo app: "Run `/scope` to scope the first feature for `<app-name>`."
   - Monorepo package: "Start building the package API, or run `/scope`."
   - Module in existing: "Run `/scope` to plan the first capability."
