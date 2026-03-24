---
name: glossary
description: Extract domain terms from PRD + codebase -> canonical glossary. Triggers: "define terms," "glossary," "ubiquitous language," "align naming," post-PRD-review. Silent analysis, minimal interaction. Not for: requirements (write-a-prd), design (design-feature), plan review (review-plan).
---

## Purpose

DDD-style ubiquitous language glossary from PRD + codebase. Pipeline: plan-feature -> write-a-prd -> review-prd -> **glossary** -> (design-ux) -> design-feature -> review-plan.

Identifies every domain term, flags ambiguities (same concept / different names, same name / different concepts), checks codebase naming, proposes canonical terms. Creates shared vocabulary that design-feature uses as naming source of truth.

## Finding the PRD

1. If user names a file, read it.
2. Check `./plans/` for `*-prd.md`. One? Use it. Several? Ask.
3. If PRD was produced earlier in conversation, use context.

No PRD found? Say so and stop. Also check for scope doc (`*-scope.md`) for additional domain context.

## Analysis Process

Work through silently — user sees only the final glossary.

### Step 1: Extract terms from the PRD

Read fully. Extract every noun/noun phrase naming a domain concept: entities from user stories, objects from FRs, personas/roles, states/transitions, actions implying domain operations. Collect every term — obvious ones most likely to have silent disagreements.

### Step 2: Check codebase naming

Search for each term in: DB models/schemas/migrations, API endpoints/routes, type definitions/interfaces, core domain logic, UI labels/copy, existing docs/glossaries.

Record what the codebase calls each term. Note divergences.

### Step 3: Detect ambiguities

**Synonyms** — same concept, different names (PRD says "workspace," code says "org," UI shows "Team").

**Homonyms** — same name, different concepts ("account" means billing entity in one place, user login in another).

### Step 4: Propose canonical terms

For each concept, propose one canonical term considering: user-facing consistency, codebase momentum (renaming is expensive), precision, simplicity. When codebase and PRD disagree, recommend one with rationale.

### Step 5: Write the glossary

Save to `./plans/<feature-name>-glossary.md`.

## Interaction Model

Minimize interaction. Do not re-interview or rewrite the PRD.

Ask only if: two terms genuinely can't be disambiguated from PRD + codebase alone, or a critical domain concept has zero codebase presence and you can't tell if it's new or renamed.

Max 1-2 questions. More needed? PRD likely needs revision — say so and stop. Use `AskUserQuestion`: question, header (max 12 chars), 2-4 options with label + description, recommended first with "(Recommended)" suffix.

## Glossary Template

```markdown
# Ubiquitous Language: <Feature Name>

> Domain glossary for [<feature-name>-prd.md] (scope: [<feature-name>-scope.md])
> Generated from glossary analysis on <date>

## Glossary

| Term | Definition | Aliases | Code Name | Status |
|------|-----------|---------|-----------|--------|
| <canonical term> | <definition> | <other names in PRD/code/UI> | <current code name, or "new"> | canonical / rename / new |

### Status key
- **canonical**: Term and code name match — no action needed
- **rename**: Code uses different name — design should use canonical, implementation should rename
- **new**: No existing code representation — design introduces using this term

## Ambiguities Resolved

### <Title>
- **Problem**: <naming conflict>
- **Resolution**: <chosen term + why>
- **Action**: <what changes — code, PRD, or both>

## Naming Conventions

<Patterns in codebase that guide new term naming — e.g., "models use singular nouns," "API routes kebab-case plural">

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date or "skipped"> | <verdict> | <summary> |
| write-a-prd | <date or "skipped"> | -- | <summary> |
| review-prd | <date or "skipped"> | <verdict> | <summary> |
| glossary | <date> | -- | <N> terms, <N> ambiguities resolved, <N> renames |
```

## After Delivering

"Review this and tell me what to change. When satisfied, run `/design-feature` — it will use these canonical terms for data models, APIs, and code."

Update directly on change requests. Flag if a change would introduce new ambiguity.
