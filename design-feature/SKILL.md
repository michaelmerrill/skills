---
name: design-feature
description: "Technical design interview -> design doc (architecture, data models, behavior specs, build phases). Triggers: 'design this,' 'how should we build this,' 'architect this,' post-PRD/UX. Not for: scoping (plan-feature), requirements (write-a-prd), UX (design-ux), plan review (review-plan)."
---

## Purpose

Technical design interview -> design document. Pipeline: plan-feature -> write-a-prd -> review-prd -> glossary -> (design-ux) -> **design-feature** -> review-plan.

## Starting

Before asking anything:

1. Look in `./plans/` for: PRD (`*-prd.md`), scope doc (`*-scope.md`), glossary (`*-glossary.md`), UX spec (`*-ux.md`). Read all found. Use glossary canonical terms for data models, APIs, modules, variables. UX flows map to behavior specs; UX screens/components map to frontend architecture.
2. Explore the codebase thoroughly — tech stack, patterns, data models, auth, API conventions, testing patterns, deployment setup.
3. Search for architecture docs, ADRs, domain glossaries, process docs, READMEs.
4. If docs and code disagree, note the discrepancy to surface during interview.

If prior docs exist: "I've read the PRD, UX spec, and explored the codebase. Requirements call for [items]. UX defines [N flows] across [N screens]. Stack uses [tech]. First: [question about architecture/patterns]."

No PRD? Works — but note that defined requirements make for a better design. No UX spec? Interview will cover frontend concerns as needed. No glossary? Be consistent in naming and note decisions in the Decisions Log.

## Interview Protocol

Walk down each branch of the design tree one decision at a time.

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code snippet/config comparisons. User can always pick "Other."

### When the user can't decide

State your recommendation, record as assumption in Assumptions & Unknowns, move on.

### Code-first

Explore the codebase before asking questions it could answer. Present as confirmation: "I found the project handles auth via [pattern] in `[file]`. I'll follow the same approach unless you say otherwise."

### Completeness tracking

Track whether you've resolved decisions across these domains:

1. **Architecture & patterns** — System design, service/module boundaries, API design. New components, fit with existing architecture, pattern deviations.
2. **Data & state** — CRUD operations, models, schemas, migrations, state management locations (DB, cache, session, client).
3. **Core behavior (technical)** — Implementation approach for each user story/FR. Step-by-step: what happens in the system when the user acts?
4. **Edge cases & failure modes** — Race conditions, partial failures, concurrent access, error handling, data validation, boundary conditions.
5. **Integration & dependencies** — External systems, third-party APIs, internal services. Integration contracts.
6. **Operational & rollout** — Backward compatibility, feature flags, migrations, monitoring, performance budget, cost.
7. **Security & access** — Permissions, trust boundaries, sensitive data, input validation, abuse prevention.
8. **Testing strategy** — Unit/integration/e2e approach per component. Test data, mocking, acceptance verification.
9. **Code design & boundaries** — Interfaces, abstractions, dependency direction, injection points. Existing patterns to follow. Coupling/cohesion tradeoffs.
10. **Phased build plan** — Vertical slices delivering working functionality. Dependency ordering. Acceptance criteria per phase tied to interview decisions.

Safety net, not a script. Check for gaps before producing the design. Every domain needs at least one decision.

### Dependencies and conflicts

Resolve upstream decisions before downstream — earlier choices constrain later ones. When a new decision invalidates an earlier one, flag and propose an update.

When code, docs, and intent conflict, surface it. Classify as stale docs, incomplete implementation, intentional divergence, or unclear ownership.

### Wrapping up

If PRD exists, verify every FR and user story maps to at least one behavior spec or build phase. Surface any missing coverage before producing the document.

Save to `./plans/<feature-name>-design.md`. After writing: "Review this and tell me what to change. When satisfied, run `/review-plan`."

Update directly on change requests. No re-interview for minor adjustments. Flag conflicts with earlier decisions.

## Technical Design Template

Include relevant sections. Omit any that would say "N/A."

```markdown
# Design: <Feature Name>

> Technical design for [<feature-name>-prd.md] (scope: [<feature-name>-scope.md], UX: [<feature-name>-ux.md])
> Generated from design-feature interview on <date>

## Decisions Log

1. **<Topic>**: <Decision>. *Rationale: <why>*

## Data Models

### <ModelName>
- **Fields**: name, type, constraints
- **Relationships**: foreign keys, associations
- **Migration notes**: changes to existing models

## Behavior Specs

### <Behavior Name>
- **Trigger**: <what initiates>
- **Steps**: <numbered>
- **Result**: <what user sees>
- **Variations**: <conditional paths>

## Edge Cases & Failure Modes

| Scenario | Expected Behavior | Severity |
|----------|-------------------|----------|
| | | critical / warning / graceful |

## Scope

**In scope (v1):**
- ...

**Out of scope:**
- <thing> — <why>

## Assumptions & Unknowns

- **Assumption**: <statement>. *Risk if incorrect: <impact>*
- **Unknown**: <question>. *Risk if incorrect: <impact>*

## Documentation Impact

- **Must update**: <docs that will become inaccurate>
- **New docs needed**: <new concepts requiring documentation>

## Source-of-Truth Conflicts

| Conflict | Sources | Classification | Resolution |
|----------|---------|---------------|------------|
| | | stale docs / incomplete impl / intentional / unclear | |

## Operational Considerations

- **Rollout strategy**:
- **Backward compatibility**:
- **Feature flags**:
- **Performance / cost**:
- **Monitoring**:
- **Failure recovery**:

## Security & Access

- **Permissions affected**:
- **Sensitive data**:
- **Trust boundaries**:
- **Abuse risks**:

## Code Design & Boundaries

- **Key interfaces/abstractions**:
- **Dependency direction**:
- **Patterns applied**:
- **Extension points**:

## Testing Strategy

- **Unit tests**:
- **Integration tests**:
- **End-to-end tests**:
- **Test data**:
- **Acceptance verification**:

## Phased Build Plan

### Phase 1: <Title>
**Depends on**: Nothing / Phase N
**Decisions**: #1, #2
**PRD coverage**: FR-1, FR-2, User Story: <name>
**What**: <vertical slice description>
**Acceptance criteria**:
- [ ] <criterion>

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date or "skipped"> | <verdict> | <summary> |
| write-a-prd | <date or "skipped"> | -- | <summary> |
| review-prd | <date or "skipped"> | <verdict> | <summary> |
| glossary | <date or "skipped"> | -- | <summary> |
| design-ux | <date or "skipped"> | -- | <summary> |
| design-feature | <date> | -- | <summary> |
```
