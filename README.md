# Skills

A collection of Claude Code skills for software development.

## Install

```bash
npx skills add <owner/repo>     # Install skills from a GitHub repo
npx skills update <owner/repo>  # Update to latest version
npx skills remove <owner/repo>  # Remove installed skills
```

## SDLC Planning Pipeline

Some skills form a structured planning pipeline:

```
plan-feature → write-a-prd → review-prd → [glossary] → [design-ux] → design-feature → review-plan → break-into-issues
```

| Skill              | Phase             | Purpose                                                                    |
| ------------------ | ----------------- | -------------------------------------------------------------------------- |
| `plan-feature`     | Planning          | Scoping interview — feasibility, risks, go/no-go                           |
| `write-a-prd`      | Requirements      | Product requirements — users, stories, metrics                             |
| `review-prd`       | Requirements gate | Assess PRD completeness and clarity                                        |
| `glossary`         | Terminology       | Domain glossary — canonical terms, ambiguity resolution                    |
| `design-ux`        | UX design         | User flows, screens, states, components, accessibility                     |
| `design-feature`   | Technical design  | Architecture, data models, APIs, phasing                                   |
| `review-plan`      | Design gate       | Verify design against codebase, pressure-test assumptions, deliver verdict |
| `break-into-issues`| Decomposition     | Break reviewed design into agent-sized implementation issues               |

### When to Use What

Not every change needs the full pipeline. Pick your entry point based on the change:

| Change type                                                           | Entry point       | Steps                                                                      |
| --------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| New user-facing capability                                            | `/plan-feature`   | Full pipeline including design-ux                                          |
| New backend-only capability (API, data pipeline, no UI)               | `/plan-feature`   | Full pipeline, skip design-ux                                              |
| Feature already greenlit, has user-facing UI                          | `/write-a-prd`    | write-a-prd → review-prd → design-ux → design-feature → review-plan       |
| Requirements clear, need UX + technical design                        | `/design-ux`      | design-ux → design-feature → review-plan                                   |
| Requirements and UX clear (spec exists, ticket has detailed AC)       | `/design-feature` | design-feature → review-plan                                               |
| Bug fix, config change, copy update, refactor with no behavior change | None              | Just build it                                                              |

**glossary** is optional. Use it when the feature introduces new domain concepts or the codebase shows terminology drift (e.g., PRD says "workspace," code says "org," UI says "team"). Skip it for straightforward features.

**design-ux** is optional. Use it when the feature introduces new user-facing interactions — screens, flows, or components. Skip it for API-only features, backend changes, CLI tools, or features that exactly replicate an existing UI pattern. If design-ux discovers gaps in the PRD, it tracks them and may recommend revisiting `/write-a-prd` or `/review-prd` before continuing.

### Revision Workflow

When a review gate returns **Revise**:

1. The review skill walks through each issue with suggested resolutions
2. Accept, modify, or skip each resolution
3. The review skill updates the document with all accepted changes
4. Re-run the review skill (`/review-prd` or `/review-plan`) to verify if needed

When a review gate returns **Rethink**:

1. Re-run the authoring skill (`/write-a-prd` or `/design-feature`) to re-interview from scratch

## Other Skills

| Skill           | Purpose                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| `scaffold-repo` | Bootstrap a new project from scratch — interview, blueprint, scaffolding, foundation docs |

## Structure

Each skill has `SKILL.md` (definition) and `evals/evals.json` (test cases). Pipeline outputs go to `./plans/` with suffixes: `-scope.md`, `-prd.md`, `-glossary.md`, `-ux.md`, `-design.md`. Issue decomposition outputs go to `./issues/<plan-name>/`.
