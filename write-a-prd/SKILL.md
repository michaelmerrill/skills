---
name: write-a-prd
description: "Product requirements interview -> PRD focused on WHAT to build. Triggers: 'write a PRD,' 'define requirements,' 'spec this out,' post-scoping. Not for: technical design (design-feature), scoping (plan-feature), plan review (review-plan)."
---

## Purpose

Structured interview -> PRD specifying what to build from the user's perspective. Pipeline: plan-feature -> **write-a-prd** -> review-prd -> glossary -> (design-ux) -> design-feature -> review-plan.

## Starting

Before asking anything:

1. Look for a scope document in `./plans/` (`*-scope.md`). If found, read it fully — problem statement, stakeholders, feasibility, and scope are your starting context.
2. Explore the codebase for the product perspective — existing user flows, UI patterns, terminology, conventions.
3. Search for existing documentation — user guides, help docs, product specs, onboarding flows.

If scope doc exists, ground your first question in it: "I've read the scope for [feature]. The problem is [X], stakeholders are [Y], scope includes [Z]. First question: [question about target users]."

No scope doc? Start from the user's description, beginning with problem/motivation.

## Interview Protocol

Product discovery interview. Focus on user needs, behaviors, and success criteria — not technical implementation.

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code/mockup comparisons. User can always pick "Other."

### When the user can't decide

State your recommendation, record as assumption in Risks & Open Questions, move on.

### Code-first (product lens)

Explore the codebase before asking questions it could answer. Look through a product lens: "The app currently shows [behavior] when users [action]. Should we extend that or introduce something new?"

### Completeness tracking

Track whether you've resolved decisions across these domains:

1. **Problem & motivation** — Confirm/deepen from scope doc. User pain point in their words? What they do today instead?
2. **Target users & personas** — Who specifically? Distinct user types? Technical sophistication? Usage frequency?
3. **User stories & JTBD** — Key user stories (As a [user], I want [action], so that [outcome])? What job is the user hiring this feature to do?
4. **Functional requirements** — What must it do? Walk each user story: what does the user see, click, receive at each step?
5. **Non-functional requirements** — Performance, accessibility, device/browser support, data retention, compliance. Only what's relevant.
6. **Success metrics & KPIs** — How will we know it's successful? What to measure? What does "good" look like at 30/60/90 days?
7. **Scope definition** — Detailed in/out/future. For each "out": why deferred. For each "future": trigger for inclusion.
8. **Dependencies & constraints (business)** — Pricing decisions, partner agreements, legal, timing, content needs.
9. **Risks & open questions** — Product risks (adoption, competitive response, cannibalization), open questions needing answers before/during implementation.

Safety net, not a script. Check for gaps before producing the PRD. Every domain needs at least one decision.

### Scope

No technical implementation (schemas, APIs, architecture, build ordering, technology selection, operational concerns). Redirect: "Captured for design phase — let's stay on what users need."

### Wrapping up

When all domains are covered: "I think we have enough to draft the PRD."

Match naming prefix from scope doc if it exists (e.g., `team-billing-scope.md` -> `team-billing-prd.md`). Otherwise derive kebab-case name and confirm.

Save to `./plans/<feature-name>-prd.md`. After writing: "Review this and tell me what to change. When satisfied, run `/review-prd`."

Update directly on change requests. No re-interview for minor adjustments. If a change conflicts with an earlier decision, flag and confirm before updating.

## PRD Template

Include relevant sections. Omit any that would say "N/A."

```markdown
# PRD: <Feature Name>

> Product requirements for [feature] (scope: [<feature-name>-scope.md])
> Generated from write-a-prd interview on <date>

## Problem Statement

## Target Users

### <Persona Name>
- **Who**:
- **Current behavior**:
- **Key need**:
- **Usage frequency**:

## User Stories

### <Story Name>
- **As a** <persona>, **I want** <action>, **so that** <outcome>
- **Acceptance criteria**:
  - [ ] <criterion>

## Functional Requirements

### <Requirement Area>
- FR-1: <requirement>

## Non-Functional Requirements

- NFR-1: <requirement>

## Success Metrics

| Metric | Target | Measurement | Timeframe |
|--------|--------|-------------|-----------|
| | | | |

## Scope

**In scope (v1):**
- ...

**Out of scope:**
- <thing> — <why>

**Future (conditional):**
- <thing> — <trigger>

## Dependencies & Constraints

- **Dependency**: <statement>. *Status: resolved/pending*
- **Constraint**: <statement>. *Impact: <what this limits>*

## Risks & Open Questions

- **Risk**: <statement>. *Mitigation: <approach>*
- **Open question**: <question>. *Needed by: <when>. Impact if unresolved: <consequence>*

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date or "skipped"> | <verdict> | <summary> |
| write-a-prd | <date> | -- | <summary> |
```
