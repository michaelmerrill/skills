# Skills

A collection of Claude Code skills.

## Pipeline

```
plan-feature → write-a-prd → review-prd → ubiquitous-language → design-feature → review-plan
```

| Skill                 | Phase             | Purpose                                                                    |
| --------------------- | ----------------- | -------------------------------------------------------------------------- |
| `plan-feature`        | Planning          | Scoping interview — feasibility, risks, go/no-go                           |
| `write-a-prd`         | Requirements      | Product requirements — users, stories, metrics                             |
| `review-prd`          | Requirements gate | Assess PRD completeness and clarity                                        |
| `ubiquitous-language` | Terminology       | Domain glossary — canonical terms, ambiguity resolution                    |
| `design-feature`      | Design            | Technical design — architecture, data models, phasing                      |
| `review-plan`         | Design gate       | Verify design against codebase, pressure-test assumptions, deliver verdict |

## When to Use What

Not every change needs the full pipeline. Pick your entry point based on the change:

| Change type                                                           | Entry point       | Steps                                                   |
| --------------------------------------------------------------------- | ----------------- | ------------------------------------------------------- |
| New capability, new domain concepts, cross-cutting changes            | `/plan-feature`   | Full pipeline                                           |
| Feature already greenlit, need to define requirements                 | `/write-a-prd`    | write-a-prd → review-prd → design-feature → review-plan |
| Requirements already clear (spec exists, ticket has detailed AC)      | `/design-feature` | design-feature → review-plan                            |
| Bug fix, config change, copy update, refactor with no behavior change | None              | Just build it                                           |

**ubiquitous-language** is optional. Use it when the feature introduces new domain concepts or the codebase shows terminology drift (e.g., PRD says "workspace," code says "org," UI says "team"). Skip it for straightforward features.

## Revision Workflow

When a review gate returns **Revise**:

1. Edit the document to address the numbered items in the verdict
2. Re-run the review skill (`/review-prd` or `/review-plan`) to verify

When a review gate returns **Rethink**:

1. Re-run the authoring skill (`/write-a-prd` or `/design-feature`) to re-interview from scratch

## Structure

Each skill has `SKILL.md` (definition) and `evals/evals.json` (test cases). Outputs go to `./plans/` with suffixes: `-scope.md`, `-prd.md`, `-glossary.md`, `-design.md`.
