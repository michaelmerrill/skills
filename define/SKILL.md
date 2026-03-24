---
name: define
description: "Product requirements → living doc Requirements section + quality gate + domain glossary. Stateful: detects existing sections and resumes where needed. Triggers: 'define this,' 'write a PRD,' 'define requirements,' 'spec this out,' post-explore. Not for: scoping (explore), UX (design), technical design (architect)."
---

## Purpose

Product requirements interview → `## Requirements` section in the living doc → quality gate → glossary (when needed). Pipeline: explore → **define** → [design] → architect → plan.

Phase: Product. User is non-technical. Never surface schemas, APIs, or code paths. Read codebase silently; present findings as product behavior.

## Starting

Before asking anything:

1. Detect state in `./plans/`:
   - Living doc with `## Scope`: read for context.
   - Living doc with `## Requirements` populated: skip interview → go to Quality Gate.
   - Living doc with `### Glossary` populated: skip to After Delivering.
   - `## Rollback Notes` with content: read for context — resume only affected domains, clear after resolving.
   - No living doc found: will create one (user skipped explore).
2. Explore the codebase — product lens: user flows, UI patterns, terminology, conventions.
3. Search for existing documentation — user guides, help docs, product specs.

If living doc with Scope exists: "I've read the scope for [feature]. Problem: [X], stakeholders: [Y], scope: [Z]. Let's start with target users — who specifically will use this?"

No living doc? Start from the user's description, beginning with problem/motivation. Derive kebab-case name, confirm, create `./plans/<name>.md` with `## Scope` marked as *Skipped — entered pipeline at define.*

## Interview Protocol

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for code/mockup comparisons. User can always pick "Other."

When the user can't decide: state your recommendation, record as assumption in Risks & Open Questions, move on.

Code-first (product lens): explore codebase before asking questions it could answer. "The app currently shows [behavior] when users [action]. Should we extend that or introduce something new?"

## Interview: Requirements

Product discovery interview. Focus on user needs, behaviors, and success criteria.

Track whether you've resolved decisions across these domains:

1. **Problem & motivation** — *Skip if scope exists (already resolved).* Otherwise: user pain point in their words? What they do today instead?
2. **Target users & personas** — Who specifically? Distinct user types? Technical sophistication? Usage frequency?
3. **User stories & JTBD** — Key user stories (As a [user], I want [action], so that [outcome])? What job is the user hiring this feature to do?
4. **Functional requirements** — What must it do? Walk each user story: what does the user see, click, receive at each step?
5. **Non-functional requirements** — Performance, accessibility, device/browser support, data retention, compliance. Only what's relevant.
6. **Success metrics & KPIs** — How will we know it's successful? What to measure? What does "good" look like at 30/60/90 days?
7. **Scope definition** — Detailed in/out/future. For each "out": why deferred. For each "future": trigger for inclusion.
8. **Dependencies & constraints (business)** — Pricing decisions, partner agreements, legal, timing, content needs.
9. **Risks & open questions** — Product risks (adoption, competitive response, cannibalization), open questions needing answers before/during implementation.

Exhaust every branch depth-first. Resolve sub-questions before moving to the next domain. Only ask what codebase can't answer. No limit on question count. Questions stay concise; depth from more turns, not longer ones.

No technical implementation (schemas, APIs, architecture, build ordering, technology selection). Redirect: "Captured for architect phase — let's stay on what users need."

### Producing the Requirements

When every domain is fully resolved: "I think we have enough to draft the requirements."

Write `## Requirements` section into the living doc (create file if needed). Then immediately proceed to Quality Gate.

## Quality Gate

Work silently — user sees only the verdict.

### Analysis

1. **Understand**: Read `## Requirements` fully. Identify problem, target users, key stories, FRs, scope. Note anything underspecified, inconsistent, or surprising.
2. **Verify against codebase**: Check claims against actual code/product behavior — existing behavior mismatches, conflicting features, missing context.
3. **Check scope alignment** (if `## Scope` exists): Requirements within scope boundaries? Covers "likely in for v1"? Addresses scope risks?
4. **Evaluate dimensions** (report only noteworthy): problem clarity, user coverage, requirements quality (specific/testable? prescriptions disguised as requirements?), success metrics, scope control, feasibility signals, completeness.

### Verdict

- **Ready**: Solid enough to design from. Minor issues only.
- **Revise**: Issues to fix before design. Specify what.
- **Rethink**: Fundamental problems — rollback to `/explore` (scope wrong). Pass: what's wrong + resolved decisions to preserve.

### Output

```
### Verdict: [Ready / Revise / Rethink]

**Strengths** (2-4 bullets)

**Issues** (numbered, most important first)
1. [Category]: Description. Why it matters. What to do.

**Risks** (if any)
```

### On Revise

"Let's work through these issues. I'll suggest a resolution for each — accept, modify, or skip."

1. Group issues by section. Present each group in one turn.
2. Each turn: issue numbers + restatement, concrete suggested resolution, invitation to accept/modify/skip.
3. Present best recommendation. User pushes back if they disagree.
4. Skipped issues become open items.
5. After all groups resolved, update `## Requirements` in a single write.
6. Re-run Quality Gate. Repeat until Ready or Rethink.

Guardrails: don't re-explore codebase during resolution. Don't expand scope. Don't re-interview. If user accepts first group unchanged, batch remaining groups aggressively.

### On Ready

Check glossary conditions: Requirements introduce 3+ domain nouns not in codebase, analysis found naming conflicts (PRD says "workspace," code says "org," UI says "team"), or feature crosses bounded-context boundaries. If any met → proceed to Glossary. If none → skip to After Delivering.

## Glossary

Run silently — user sees only the glossary output.

1. **Extract terms** from Requirements: every noun/noun phrase naming a domain concept — entities, objects, personas, states, actions.
2. **Check codebase naming**: search DB models, API endpoints, type defs, domain logic, UI labels, existing docs. Record what code calls each term.
3. **Detect ambiguities**: synonyms (same concept, different names) and homonyms (same name, different concepts).
4. **Propose canonical terms**: one term per concept considering user-facing consistency, codebase momentum, precision, simplicity.
5. **Write** as `### Glossary` subsection under `## Requirements` in the living doc.

Max 1-2 questions during glossary. More needed → re-enter Quality Gate with Revise verdict targeting the ambiguous sections.

## Rollback

**Receiving**: Read `## Rollback Notes` in the living doc for trigger, affected domains, and decisions to preserve. Read existing `## Requirements`. Resume only affected domains — do not re-interview resolved decisions. After resolving, re-run Quality Gate and clear `## Rollback Notes`.

**Triggering to explore**: If interview reveals the scope itself is wrong (wrong problem framing, missing stakeholder, infeasible direction): append to `## Rollback Notes` with trigger, affected scope domains, and resolved requirements decisions to preserve. Then: "This changes the scope, not just requirements. Recommend revisiting `/explore`."

## After Delivering

"Requirements are ready. Review and tell me what to change. When satisfied, run `/design` (UI features) or `/architect` (backend-only)."

Update directly on change requests. If a change conflicts with an earlier decision, flag and confirm before updating.

## Requirements Section Template

Write this as `## Requirements` in the living doc. Include relevant subsections. Omit any that would say "N/A."

```markdown
## Requirements

### Problem Statement

### Target Users

#### <Persona Name>
- **Who**:
- **Current behavior**:
- **Key need**:
- **Usage frequency**:

### User Stories

#### <Story Name>
- **As a** <persona>, **I want** <action>, **so that** <outcome>
- **Acceptance criteria**:
  - [ ] <criterion>

### Functional Requirements

#### <Requirement Area>
- FR-1: <requirement>

### Non-Functional Requirements

- NFR-1: <requirement>

### Success Metrics

| Metric | Target | Measurement | Timeframe |
|--------|--------|-------------|-----------|
| | | | |

### Scope

**In scope (v1):**
- ...

**Out of scope:**
- <thing> — <why>

**Future (conditional):**
- <thing> — <trigger>

### Dependencies & Constraints

- **Dependency**: <statement>. *Status: resolved/pending*
- **Constraint**: <statement>. *Impact: <what this limits>*

### Risks & Open Questions

- **Risk**: <statement>. *Mitigation: <approach>*
- **Open question**: <question>. *Needed by: <when>. Impact if unresolved: <consequence>*

### Glossary

| Term | Definition | Aliases | Code Name | Status |
|------|-----------|---------|-----------|--------|
| <canonical term> | <definition> | <other names> | <current code name, or "new"> | canonical / rename / new |

#### Ambiguities Resolved
- **<Title>**: <naming conflict> → <chosen term + why>

#### Naming Conventions
<Patterns in codebase that guide new term naming>
```

Update `## Decisions Log` with any decisions made during interview. Update `## Pipeline Status` with define row.
