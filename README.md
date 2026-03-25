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
discovery → product → design → engineering → plan
```

| Skill         | Phase                   | Purpose                                                    |
| ------------- | ----------------------- | ---------------------------------------------------------- |
| `discovery`   | 1 — Product             | Discovery brief — validate concept, feasibility, go/no-go  |
| `product`     | 1 — Product             | PRD — requirements, stories, metrics, scope, glossary      |
| `design`      | 2 — Design              | Design spec — flows, screens, states, components, a11y     |
| `engineering`  | 3 — Engineering         | TDD — architecture, APIs, data, security, observability    |
| `plan`        | 3 — Engineering         | Decompose into agent-sized implementation issues           |

**Phase audiences**: Phase 1 questions are product-level — user need not be technical. Agent reads codebase silently, asks about intent/goals/constraints. Phase 2 translates product decisions into design artifacts; user may or may not be technical. Phase 3 assumes a technical user.

### When to Use What

Not every change needs the full pipeline. Pick your entry point based on the change:

| Change type                                                           | Entry point     | Steps                                           |
| --------------------------------------------------------------------- | --------------- | ----------------------------------------------- |
| New capability (any)                                                  | `/discovery`    | Full pipeline                                   |
| Feature already greenlit                                              | `/product`      | product → design → engineering → plan           |
| Requirements clear, need design + technical                           | `/design`       | design → engineering → plan                     |
| Requirements and design clear (spec exists, detailed AC)              | `/engineering`  | engineering → plan                              |
| Bug fix, regression, something broken                                 | `/triage-issue` | triage-issue → agent implementation             |
| Tech debt / refactoring (no behavior change)                          | `/engineering`  | engineering → plan                              |
| Dependency migration / major upgrade                                  | `/engineering`  | engineering → plan (or `/discovery` if unclear)  |
| Performance optimization                                              | `/triage-issue` | If regression. `/engineering` if systemic        |
| Security hardening                                                    | `/engineering`  | engineering → plan                              |
| Config change, copy update, minor refactor                            | None            | Just build it                                   |
| Prototype / throwaway exploration                                     | None            | Just build it — don't plan throwaway code       |

**product** includes a built-in quality gate and conditional glossary. After producing the PRD, it automatically reviews it (Ready/Revise/Rethink) and generates a domain glossary when naming conflicts or new domain concepts are detected.

**design** includes a built-in quality gate. After producing the design spec, it reviews coverage of PRD stories, screen states, accessibility, and responsive behavior.

**engineering** includes a built-in adversarial review. After producing the TDD, it pressure-tests assumptions, verifies against the codebase, and delivers a verdict.

### Revision & Rollback

When a built-in quality gate returns **Revise**:

1. The skill walks through each issue with suggested resolutions
2. Accept, modify, or skip each resolution
3. The skill updates the document with all accepted changes
4. Re-runs the quality gate to verify

When a quality gate returns **Rethink**:

1. The skill recommends rolling back to an earlier stage (e.g., `/discovery` if scope is wrong)

**Cross-phase rollback**: Any skill can trigger rollback when it discovers a blocking issue from an earlier phase. The triggering skill writes `## Rollback Notes` in `pipeline.md` before directing the user upstream. The receiving skill reads the notes, resumes only affected domains, and clears the section after resolving.

## Other Skills

| Skill             | Purpose                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| `triage-issue`    | Investigate bugs — root cause analysis → issue file with TDD fix plan            |
| `bootstrap`       | Initialize new codebases — standalone project, monorepo app/package, or service  |
| `publish-linear`  | Publish pipeline state to Linear — project, documents, and issues                |

## Checking Pipeline Status

Each feature has a **pipeline.md** with a Status table showing which steps have run and their verdicts. To check where a feature stands:

```bash
ls ./plans/                                  # Which feature folders exist?
cat ./plans/<feature-name>/pipeline.md       # Pipeline status + decisions
ls ./issues/<feature-name>/                  # Issues generated?
```

## Structure

Each skill directory contains a `SKILL.md` definition and optional `evals/`, `assets/`, and `references/` subdirectories. Pipeline skills share a **feature folder** at `./plans/<feature-name>/` containing standalone documents:

- `pipeline.md` — coordination (status, decisions, rollback notes, Linear ID)
- `discovery.md` — discovery brief (from `/discovery`)
- `prd.md` — product requirements document (from `/product`)
- `spec.md` — design specification (from `/design`)
- `tdd.md` — technical design document (from `/engineering`)
- `plan.md` — implementation plan summary (from `/plan`)

Issue decomposition outputs go to `./issues/<feature-name>/`. Bug triage outputs go to `./issues/bugs/`.

## Future Stages

The pipeline will expand to cover the full SDLC:

```
discovery → product → design → engineering → plan → build → validate → operate
```

`build`, `validate`, and `operate` are not yet implemented.
