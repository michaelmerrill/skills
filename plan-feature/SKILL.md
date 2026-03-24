---
name: plan-feature
description: "Vision & scope interview for new features -> scope doc with go/no-go. Elaborates vague ideas into clear concepts at the capability level. Triggers: user wants to add/build/implement any new capability. First pipeline step. Not for: bugs, functional requirements (write-a-prd), design (design-feature), executing existing specs."
---

## Purpose

Vision & scope interview -> scope document with go/no-go recommendation. Elaborates vague ideas into clear concepts at the capability level, then assesses feasibility and risks. Pipeline: **plan-feature** -> write-a-prd -> review-prd -> glossary -> (design-ux) -> design-feature -> review-plan.

## Starting

Accept the user's idea. Before asking anything:

1. Explore the codebase — tech stack, patterns, architecture — enough to assess feasibility.
2. Search for existing documentation — architecture docs, ADRs, glossaries, READMEs.
3. Note any prior work related to this feature (partial implementations, abandoned branches).

Ground your first question in what you found. Start with problem and motivation.

## Interview Protocol

Vision & scope interview, not requirements or design session. Elaborate the user's idea into a clear concept, then assess whether to proceed. Stay at the capability level — write-a-prd handles functional requirements.

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code/mockup comparisons. User can always pick "Other."

### When the user can't decide

State your recommendation, record as assumption, move on.

### Code-first

Explore the codebase before asking questions it could answer. Use findings for feasibility/sizing and to elaborate the user's vision — not to drill into behavioral details. Present as confirmation: "I found [X] in `[file]`. This looks feasible to extend — unless you see a constraint?"

### Completeness tracking

Track whether you've resolved decisions across these domains:

1. **Problem & motivation** — What problem? Why now? What if we don't build it? Validated by feedback, metrics, or intuition?
2. **Stakeholders & impact** — Who cares? Who benefits? Business justification? Don't drill into permissions or access control — that's PRD territory.
3. **Feasibility** — Technically possible with current stack? Constraints or prerequisites? Buy/integrate before build?
4. **High-level scope** — Roughly in for v1? Clearly out? How big — days, weeks, months? "Roughly in" means capabilities (e.g., "candidate profiles"), not behaviors (e.g., "profiles lock during voting").
5. **Key risks & assumptions** — Project-level risks? Assumptions that might not hold? External dependencies?
6. **Recommendation** — Go, no-go, or needs investigation?

Exhaust every branch. Domains are not checkboxes — each is a branch of the decision tree. Explore depth-first: when an answer raises sub-questions, resolve them before moving to the next domain. Keep asking until every sub-question within every domain is fully resolved. If the codebase answers a question, mark it resolved and move on — only ask the user what the codebase can't answer. No limit on number of questions. Questions stay concise; depth comes from more turns, not longer ones.

### Scope

Stay at the concept/capability level. No functional requirements (behaviors, rules, permissions, workflows, field-level decisions) — those belong in write-a-prd. No implementation details (data models, APIs, architecture). Redirect: "Good question for the PRD — let's stay on scope."

**Scope-level** (ask): "Is this text-only or do you need media?" / "Is this self-service, admin-managed, or both?"
**PRD-level** (defer): "Should profiles lock during voting?" / "What approval flow?" / "Per-candidacy or per-user?"

### Dependencies and conflicts

When code, docs, and intent conflict, surface it. Classify as stale docs, incomplete implementation, intentional divergence, or unclear ownership.

### Wrapping up

When every domain is fully resolved with no remaining sub-questions: "I think we have enough for the scope assessment." Before wrapping, confirm you explored risks/assumptions with the user — don't invent them.

Derive feature name as kebab-case (2-3 words). Confirm: "I'll save as `plans/<name>-scope.md` — all pipeline docs will use this prefix."

Save to `./plans/<feature-name>-scope.md`. After writing: "Review this and tell me what to change. When satisfied, run `/write-a-prd`."

Update directly on change requests. No re-interview for minor adjustments.

## Scope Document Template

Include relevant sections. Omit any that would say "N/A."

```markdown
# Scope: <Feature Name>

> Generated from plan-feature scoping interview on <date>

## Problem Statement

## Stakeholders

- **Users**:
- **Business**:
- **Internal**:

## Feasibility Assessment

- **Technical feasibility**:
- **Prior work**:

## High-Level Scope

**Likely in for v1:**
- ...

**Likely out for v1:**
- <thing> — <why>

**Needs investigation:**
- <thing> — <what to learn>

## Key Risks & Assumptions

- **Risk**: <statement>. *Likelihood: H/M/L. Impact: <what happens>*
- **Assumption**: <statement>. *If wrong: <consequence>*

## Recommendation

**Verdict**: Go / No-Go / Investigate Further

<Rationale>

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date> | <verdict> | <summary> |
```

## After Delivering

Answer follow-up questions directly. For requirements: "Run `/write-a-prd`." For design: "Run `/write-a-prd` first, then `/design-feature`."
