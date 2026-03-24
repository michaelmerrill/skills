---
name: explore
description: "Scope and assess new feature ideas → living doc with go/no-go. Elaborates vague ideas into clear concepts. First pipeline step. Triggers: user wants to add/build/implement any new capability. Not for: bugs (triage-issue), requirements (define), design (design/architect)."
---

## Purpose

Vision & scope interview → scope section in the feature's living document with go/no-go recommendation. Elaborates vague ideas into clear concepts at the capability level, then assesses feasibility and risks. Pipeline: **explore** → define → [design] → architect → plan.

Phase: Discovery. User is non-technical. Never surface architecture, schemas, or code paths. Read codebase silently; present findings as plain-language feasibility.

## Starting

Accept the user's idea. Before asking anything:

1. Detect state in `./plans/`:
   - Existing living doc (`./plans/*.md` with `## Scope`): read for context.
   - If `## Rollback Notes` has content: read for context — resume only affected domains, clear after resolving.
2. Explore the codebase — tech stack, patterns, architecture — enough to assess feasibility.
3. Search for existing documentation — architecture docs, ADRs, glossaries, READMEs.
4. Note any prior work related to this feature (partial implementations, abandoned branches).

Ground your first question in what you found. Start with problem and motivation.

## Interview Protocol

Vision & scope interview, not requirements or design session. Elaborate the user's idea into a clear concept, then assess whether to proceed. Stay at the capability level — define handles functional requirements.

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code/mockup comparisons. User can always pick "Other."

### When the user can't decide

State your recommendation, record as assumption, move on.

### Code-first

Explore the codebase before asking questions it could answer. Use findings for feasibility/sizing and to elaborate the user's vision — not to drill into behavioral details. Present as confirmation: "This looks feasible to extend from what's already there — unless you see a constraint?"

### Completeness tracking

Track whether you've resolved decisions across these domains:

1. **Problem & motivation** — What problem? Why now? What if we don't build it? Validated by feedback, metrics, or intuition?
2. **Stakeholders & impact** — Who cares? Who benefits? Business justification? Don't drill into permissions or access control — that's requirements territory.
3. **Feasibility** — Technically possible with current stack? Constraints or prerequisites? Buy/integrate before build?
4. **High-level scope** — Roughly in for v1? Clearly out? How big — days, weeks, months? "Roughly in" means capabilities (e.g., "candidate profiles"), not behaviors (e.g., "profiles lock during voting").
5. **Key risks & assumptions** — Project-level risks? Assumptions that might not hold? External dependencies?
6. **Recommendation** — Go, no-go, or needs investigation?

Exhaust every branch. Domains are not checkboxes — each is a branch of the decision tree. Explore depth-first: when an answer raises sub-questions, resolve them before moving to the next domain. Keep asking until every sub-question within every domain is fully resolved. If the codebase answers a question, mark it resolved and move on — only ask the user what the codebase can't answer. No limit on number of questions. Questions stay concise; depth comes from more turns, not longer ones.

### Scope

Stay at the concept/capability level. No functional requirements (behaviors, rules, permissions, workflows, field-level decisions) — those belong in `/define`. No implementation details (data models, APIs, architecture). Redirect: "Good question for requirements — let's stay on scope."

**Scope-level** (ask): "Is this text-only or do you need media?" / "Is this self-service, admin-managed, or both?"
**Requirements-level** (defer): "Should profiles lock during voting?" / "What approval flow?" / "Per-candidacy or per-user?"

### Dependencies and conflicts

When code, docs, and intent conflict, surface it. Classify as stale docs, incomplete implementation, intentional divergence, or unclear ownership.

### Wrapping up

When every domain is fully resolved with no remaining sub-questions: "I think we have enough for the scope assessment." Before wrapping, confirm you explored risks/assumptions with the user — don't invent them.

Derive feature name as kebab-case (2-3 words). Confirm: "I'll save as `plans/<name>.md` — all pipeline skills will update this file."

Create `./plans/<feature-name>.md` using the living document template below. Write `## Scope` with interview results. Initialize `## Decisions Log`, `## Rollback Notes` (empty), and `## Pipeline Status`.

After writing: "Review this and tell me what to change. When satisfied, run `/define`."

Update directly on change requests. No re-interview for minor adjustments.

## Rollback

**Receiving**: Read `## Rollback Notes` in the living doc for trigger, affected domains, and decisions to preserve. Resume only affected domains — do not re-interview resolved decisions. After resolving, update `## Scope`, clear `## Rollback Notes`, and direct user back to the triggering skill.

**Triggering**: Not applicable — first pipeline step.

## Living Document Template

Create this file. Write `## Scope` content. Leave other sections absent — downstream skills add them.

```markdown
# Feature: <Feature Name>

> Created: <date> | Last updated: <date>

## Scope

### Problem Statement

### Stakeholders

- **Users**:
- **Business**:
- **Internal**:

### Feasibility Assessment

- **Technical feasibility**:
- **Prior work**:

### High-Level Scope

**Likely in for v1:**
- ...

**Likely out for v1:**
- <thing> — <why>

**Needs investigation** (include only if items exist):
- <thing> — <what to learn>

### Risks & Assumptions

- **Risk**: <statement>. *Likelihood: H/M/L. Impact: <what happens>*
- **Assumption**: <statement>. *If wrong: <consequence>*

### Recommendation

**Verdict**: Go / No-Go / Investigate Further

<Rationale>

## Decisions Log

1. **<Topic>** (explore, <date>): <Decision>. *Rationale: <why>*

## Rollback Notes

*No active rollbacks.*

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| explore | <date> | <verdict> | <summary> |
```

## After Delivering

Answer follow-up questions directly. For requirements: "Run `/define`." For design: "Run `/define` first, then `/architect`."
