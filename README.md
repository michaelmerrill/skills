# Skills

A collection of Claude Code skills for software development.

## Install

```bash
npx skills add <owner/repo>     # Install skills from a GitHub repo
npx skills update <owner/repo>  # Update to latest version
npx skills remove <owner/repo>  # Remove installed skills
```

## SDLC Pipeline

Skills form a structured pipeline across three phases:

```
explore → define → [design] → architect → plan
```

| Skill       | Phase                   | Purpose                                                    |
| ----------- | ----------------------- | ---------------------------------------------------------- |
| `explore`   | 1 — Product             | Vision & scope — elaborate concept, feasibility, go/no-go  |
| `define`    | 1 — Product             | Requirements + quality gate + domain glossary              |
| `design`    | 2 — Design (optional)   | UX flows, screens, states, components, accessibility       |
| `architect` | 3 — Engineering         | Technical design + adversarial review                      |
| `plan`      | 3 — Engineering         | Decompose into agent-sized implementation issues           |

**Phase audiences**: Phase 1 questions are product-level — user need not be technical. Agent reads codebase silently, asks about intent/goals/constraints. Phase 2 translates product decisions into design artifacts; user may or may not be technical. Phase 3 assumes a technical user.

### When to Use What

Not every change needs the full pipeline. Pick your entry point based on the change:

| Change type                                                           | Entry point  | Steps                                           |
| --------------------------------------------------------------------- | ------------ | ----------------------------------------------- |
| New user-facing capability                                            | `/explore`   | Full pipeline including design                  |
| New backend-only capability (API, data pipeline, no UI)               | `/explore`   | Full pipeline, skip design                      |
| Feature already greenlit, has user-facing UI                          | `/define`    | define → design → architect → plan              |
| Requirements clear, need UX + technical design                        | `/design`    | design → architect → plan                       |
| Requirements and UX clear (spec exists, ticket has detailed AC)       | `/architect` | architect → plan                                |
| Bug fix, regression, something broken                                 | `/triage-issue` | triage-issue → agent implementation          |
| Tech debt / refactoring (no behavior change)                          | `/architect` | architect → plan (scope is known, need design)  |
| Dependency migration / major upgrade                                  | `/architect` | architect → plan (or `/explore` if scope unclear)|
| Performance optimization                                              | `/triage-issue` | If regression. `/architect` if systemic       |
| Security hardening                                                    | `/architect` | architect → plan                                |
| Config change, copy update, minor refactor                            | None         | Just build it                                   |
| Prototype / throwaway exploration                                     | None         | Just build it — don't plan throwaway code       |

**design** is optional. Use it when the feature introduces new user-facing interactions — screens, flows, or components. Skip it for API-only features, backend changes, CLI tools, or features that exactly replicate an existing UI pattern.

**define** includes a built-in quality gate and conditional glossary. After producing the Requirements section, it automatically reviews it (Ready/Revise/Rethink) and generates a domain glossary when naming conflicts or new domain concepts are detected.

**architect** includes a built-in adversarial review. After producing the technical spec, it automatically pressure-tests assumptions, verifies against the codebase, and delivers a verdict.

### Revision & Rollback

When a built-in quality gate returns **Revise**:

1. The skill walks through each issue with suggested resolutions
2. Accept, modify, or skip each resolution
3. The skill updates the document with all accepted changes
4. Re-runs the quality gate to verify

When a quality gate returns **Rethink**:

1. The skill recommends rolling back to an earlier stage (e.g., `/explore` if scope is wrong)

**Cross-phase rollback**: Any skill can trigger rollback when it discovers a blocking issue from an earlier phase. The triggering skill writes a `## Rollback Notes` section in the living doc before directing the user upstream. The receiving skill reads it, resumes only affected domains, and clears the section after resolving.

## Other Skills

| Skill           | Purpose                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| `triage-issue`  | Investigate bugs — root cause analysis → issue file with TDD fix plan            |
| `bootstrap`     | Initialize new codebases — standalone project, monorepo app/package, or service  |

## Checking Pipeline Status

Each living doc has a **Pipeline Status** table (at the bottom) showing which steps have run and their verdicts. To check where a feature stands:

```bash
ls ./plans/                         # Which living docs exist?
tail -20 ./plans/<feature-name>.md  # Pipeline Status table
ls ./issues/<feature-name>/         # Issues generated?
```

## Structure

Each skill directory contains a `SKILL.md` definition and optional `evals/`, `assets/`, and `references/` subdirectories. Pipeline skills share a single **living document** per feature at `./plans/<feature-name>.md` — each skill appends its section (`## Scope`, `## Requirements`, `## UX Design`, `## Technical Design`, `## Implementation Plan`). Issue decomposition outputs go to `./issues/<feature-name>/`. Bug triage outputs go to `./issues/bugs/`.

## Future Stages

The pipeline will expand to cover the full SDLC:

```
explore → define → [design] → architect → plan → build → validate → operate
```

`build`, `validate`, and `operate` are not yet implemented.
