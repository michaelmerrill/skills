---
name: architect
description: "Technical design interview + adversarial review → living doc Technical Design section ready to implement. Stateful: detects existing sections and resumes where needed. Triggers: 'architect this,' 'how should we build,' 'design the tech,' post-define/design. Not for: scoping (explore), requirements (define), UX (design)."
---

## Purpose

Technical design interview → `## Technical Design` section in the living doc → adversarial review. Pipeline: explore → define → [design] → **architect** → plan.

Phase: Engineering. User is technical. Architecture, data models, APIs, build phasing.

## Starting

Before asking anything:

1. Read the living doc (`./plans/*.md`). Look for all sections: `## Scope`, `## Requirements` (including `### Glossary`), `## UX Design`. Use glossary canonical terms for data models, APIs, modules, variables. UX flows map to behavior specs; UX screens/components map to frontend architecture.
   - If `## Technical Design` already populated: skip interview → go to Adversarial Review.
   - If `## Rollback Notes` has content: read for context — resume only affected domains, clear after resolving.
2. Explore the codebase thoroughly — tech stack, patterns, data models, auth, API conventions, testing patterns, deployment setup.
3. Search for architecture docs, ADRs, domain glossaries, process docs, READMEs.
4. If docs and code disagree, note the discrepancy to surface during interview.
5. **Glossary check**: If no `### Glossary` exists under `## Requirements` AND (Requirements introduce 3+ domain nouns not in codebase, OR naming conflicts between Requirements/code/UI detected): generate glossary silently — extract terms, check codebase naming, detect ambiguities, propose canonical terms, write as `### Glossary` under `## Requirements`. Then use canonical terms throughout the interview.

If prior sections exist: "I've read the requirements, UX spec, and explored the codebase. Requirements call for [items]. UX defines [N flows] across [N screens]. Stack uses [tech]. First: [question about architecture/patterns]."

No Requirements? Works — but note that defined requirements make for a better design. No UX Design? Interview will cover frontend concerns as needed. No glossary? Be consistent in naming and note decisions in the Decisions Log.

## Interview Protocol

Walk down each branch of the design tree one decision at a time.

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code snippet/config comparisons. User can always pick "Other."

When the user can't decide: state your recommendation, record as assumption in Assumptions & Unknowns, move on.

Code-first: explore codebase before asking questions it could answer. Present as confirmation: "I found the project handles auth via [pattern] in `[file]`. I'll follow the same approach unless you say otherwise."

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

Exhaust every branch depth-first. Resolve sub-questions before moving to the next domain. Only ask what codebase can't answer. No limit on question count.

### Dependencies and conflicts

Resolve upstream decisions before downstream — earlier choices constrain later ones. When a new decision invalidates an earlier one, flag and propose an update.

When code, docs, and intent conflict, surface it. Classify as stale docs, incomplete implementation, intentional divergence, or unclear ownership.

### Rollback triggers

When a design decision invalidates upstream sections, append to `## Rollback Notes` with trigger, affected domains, and decisions to preserve. Then direct user to the target skill.
- **Data model conflict changes UX**: roll back to `/design`.
- **Architectural constraint invalidates product assumption**: roll back to `/define` or `/explore`.
- Roll back only as far as necessary.

### Producing the spec

When every domain is fully resolved with no remaining sub-questions, proceed to produce.

If Requirements exist, verify every FR and user story maps to at least one behavior spec or build phase. Surface any missing coverage.

Write `## Technical Design` section into the living doc. Then immediately proceed to Adversarial Review.

## Adversarial Review

Work silently — user sees only the verdict.

### Analysis

1. **Understand**: Read `## Technical Design` fully. Identify proposals, key decisions, scope, phasing. Note anything underspecified, inconsistent, or surprising.
2. **Verify against reality**: Check claims against code/docs — mismatches, missing context, stale references, source-of-truth conflicts.
   - **Requirements alignment** (if `## Requirements` exists): all stories addressed? Requirements ignored/contradicted? Unjustified scope creep?
   - **Scope alignment** (if `## Scope` exists): tackles "out of scope" items? Misses "likely in for v1"? Risks acknowledged?
3. **Pressure-test through adversarial lenses** (apply relevant, skip empty, present by severity):
   - Assumptions That May Not Hold
   - Failure Modes & Edge Cases
   - Overengineering
   - Code Design & Coupling
   - Scope Creep / Scope Drift
   - Requirements Coverage Gaps
   - Implementation Readiness
   - Security & Access
   - Operational Readiness
   - Maintenance Burden
   - Simpler Alternatives
   - Should This Be Solved At All?
   - Feasibility & Phasing

### Verdict

Scale response to severity — solid spec gets short review, flawed spec gets full treatment.

```
### Verdict: [Ready / Revise / Rethink]

**Strengths** (2-4 bullets)

**Issues** (severity-ordered, most critical first)
1. [Category]: Description. Why it matters. What to do.

**Risks** (if any)

**Recommended next step** — one sentence.
```

### On Ready

Done. "Design is ready. Run `/plan` to decompose into implementation issues."

### On Revise

"Let's work through these issues. I'll suggest a resolution for each — accept, modify, or skip."

1. Group issues by design subsection. Present each group in one turn.
2. Each turn: issue numbers + restatement, concrete suggested resolution (model fields, behavior spec steps, phase boundaries), invitation to accept/modify/skip.
3. Present best recommendation. User pushes back if they disagree.
4. Skipped issues become open items.
5. After all groups resolved, update `## Technical Design` in a single write.
6. Re-run Adversarial Review. Repeat until Ready or Rethink.

Guardrails: don't re-explore codebase during resolution. Don't expand scope. Don't re-interview. If user accepts first group unchanged, batch remaining groups aggressively.

### On Rethink

Recommend re-interview from affected domains.

**Cross-phase Rethink**: When findings invalidate product assumptions (not just technical design), append to `## Rollback Notes` with trigger, affected upstream domains, and design decisions to preserve. Then direct user:
- Architectural constraint breaks Requirements assumption → `/define` or `/explore`.
- Data model conflict changes UX → `/design`.
Roll back only as far as necessary.

## Technical Design Section Template

Write this as `## Technical Design` in the living doc. Include relevant subsections. Omit any that would say "N/A."

```markdown
## Technical Design

### Data Models

#### <ModelName>
- **Fields**: name, type, constraints
- **Relationships**: foreign keys, associations
- **Migration notes**: changes to existing models

### Behavior Specs

#### <Behavior Name>
- **Trigger**: <what initiates>
- **Steps**: <numbered>
- **Result**: <what user sees>
- **Variations**: <conditional paths>

### Edge Cases & Failure Modes

| Scenario | Expected Behavior | Severity |
|----------|-------------------|----------|
| | | critical / warning / graceful |

### Scope

**In scope (v1):**
- ...

**Out of scope:**
- <thing> — <why>

### Assumptions & Unknowns

- **Assumption**: <statement>. *Risk if incorrect: <impact>*
- **Unknown**: <question>. *Risk if incorrect: <impact>*

### Documentation Impact

- **Must update**: <docs that will become inaccurate>
- **New docs needed**: <new concepts requiring documentation>

### Source-of-Truth Conflicts

| Conflict | Sources | Classification | Resolution |
|----------|---------|---------------|------------|
| | | stale docs / incomplete impl / intentional / unclear | |

### Operational Considerations

- **Rollout strategy**:
- **Backward compatibility**:
- **Feature flags**:
- **Performance / cost**:
- **Monitoring**:
- **Failure recovery**:

### Security & Access

- **Permissions affected**:
- **Sensitive data**:
- **Trust boundaries**:
- **Abuse risks**:

### Code Design & Boundaries

- **Key interfaces/abstractions**:
- **Dependency direction**:
- **Patterns applied**:
- **Extension points**:

### Testing Strategy

- **Unit tests**:
- **Integration tests**:
- **End-to-end tests**:
- **Test data**:
- **Acceptance verification**:

### Phased Build Plan

#### Phase 1: <Title>
**Depends on**: Nothing / Phase N
**Decisions**: #1, #2
**Requirements coverage**: FR-1, FR-2, User Story: <name>
**What**: <vertical slice description>
**Acceptance criteria**:
- [ ] <criterion>
```

Update `## Decisions Log` with design decisions. Update `## Pipeline Status` with architect row.
