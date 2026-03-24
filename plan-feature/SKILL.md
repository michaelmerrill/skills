---
name: plan-feature
description: "Scoping interview for new features -> scope doc with go/no-go. Triggers: user wants to add/build/implement any new capability. First pipeline step. Not for: bugs, PRDs (write-a-prd), design (design-feature), executing existing specs."
---

## Purpose

Scoping interview -> scope document with go/no-go recommendation. Pipeline: **plan-feature** -> write-a-prd -> review-prd -> glossary -> (design-ux) -> design-feature -> review-plan.

## Starting

Accept the user's idea. Before asking anything:

1. Explore the codebase — tech stack, patterns, architecture — enough to assess feasibility.
2. Search for existing documentation — architecture docs, ADRs, glossaries, READMEs.
3. Note any prior work related to this feature (partial implementations, abandoned branches).

Ground your first question in what you found. Start with problem and motivation.

## Interview Protocol

Scoping interview, not design session. Focus on whether to proceed, not how to build.

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code/mockup comparisons. User can always pick "Other."

### When the user can't decide

State your recommendation, record as assumption, move on.

### Code-first

Explore the codebase before asking questions it could answer. Present as confirmation: "I found [X] in `[file]`. This looks feasible to extend — unless you see a constraint?"

### Completeness tracking

Track whether you've resolved decisions across these domains:

1. **Problem & motivation** — What problem? Why now? What if we don't build it? Validated by feedback, metrics, or intuition?
2. **Stakeholders & impact** — Who cares? Users? Business justification? Internal stakeholders?
3. **Feasibility** — Technically possible with current stack? Constraints or prerequisites? Buy/integrate before build?
4. **High-level scope** — Roughly in for v1? Clearly out? Natural phase boundaries?
5. **Key risks & assumptions** — Project-level risks? Assumptions that might not hold? External dependencies?
6. **Recommendation** — Go, no-go, or needs investigation?

Safety net, not a script. Check for gaps before producing the scope document. Every domain needs at least one decision.

### Scope

No implementation details (data models, APIs, architecture, edge cases, testing, rollout). Redirect: "Captured for PRD/design — let's stay on scope."

### Dependencies and conflicts

When code, docs, and intent conflict, surface it. Classify as stale docs, incomplete implementation, intentional divergence, or unclear ownership.

### Wrapping up

When all domains are covered: "I think we have enough for the scope assessment."

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
