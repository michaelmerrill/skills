---
name: define
description: "Product requirements → living doc Requirements section + quality gate + domain glossary. Stateful: detects existing sections and resumes where needed. Triggers: 'define this,' 'write a PRD,' 'define requirements,' 'spec this out,' post-explore. Not for: scoping (explore), UX (design), technical design (architect)."
---

Product requirements interview → `## Requirements` in living doc → quality gate → glossary (when needed). Pipeline: explore → **define** → [design] → architect → plan.

Phase: Product. User is non-technical. Never surface schemas, APIs, or code paths. Read codebase silently; present findings as product behavior.

## Starting

Before asking anything:

1. Detect state in `./plans/`. If multiple `.md` files found, list them via `AskUserQuestion` and ask which feature to work on.
   - `## Rollback Notes` with content: this takes priority. Skip steps 2-3, resume only affected domains, clear after resolving.
   - Living doc with `## Scope`: read for context.
   - Living doc with `## Requirements` populated: skip interview → Quality Gate.
   - Living doc with `### Glossary` populated: skip to After Delivering.
   - No living doc: create one (user skipped explore).
2. Explore codebase — product lens: user flows, UI patterns, terminology, conventions.
3. Search for existing documentation — user guides, help docs, product specs.

If scope exists: "I've read the scope for [feature]. Problem: [X], stakeholders: [Y], scope: [Z]. Let's start with target users — who specifically will use this?"

No living doc? Start from user's description, beginning with problem/motivation. Derive kebab-case name, confirm, create `./plans/<name>.md` with `## Scope` marked *Skipped — entered pipeline at define.*

## Interview Protocol

Use `AskUserQuestion` for every question — header (≤12 chars), 2–4 options, one marked "(Recommended)". When user can't decide: push — reframe the question, explain tradeoffs, give a stronger recommendation. Record assumption in Risks & Open Questions only when the user genuinely can't resolve it — not after a fixed attempt count. Revisit assumptions when later answers provide resolution.

Code-first: explore codebase before asking; present as product behavior. "The app currently [behavior]. Extend or introduce new?" When codebase has competing patterns for the same concern, surface the conflict and ask user which to follow — don't silently pick one. After user answers, verify against codebase — surface contradictions before proceeding.

## Interview: Requirements

Track whether you've resolved decisions across these 9 domains:

1. **Problem & motivation** — skip if scope exists (already resolved)
2. **Target users & personas** — distinct types, sophistication, frequency
3. **User stories & JTBD** — As a/I want/so that + jobs-to-be-done
4. **Functional requirements** — step through each story: see, click, receive
5. **Non-functional requirements** — performance, accessibility, compliance (relevant only)
6. **Success metrics** — measurable outcomes at 30/60/90 days
7. **Scope definition** — in/out/future with rationale for each
8. **Dependencies & constraints** — business: pricing, legal, timing, content
9. **Risks & open questions** — adoption, competitive, open items needing answers

Exhaust every branch depth-first. Resolve sub-questions before moving on. Only ask what codebase can't answer. No limit on questions; depth from more turns, not longer ones.

No technical implementation (schemas, APIs, architecture, technology selection). Redirect: "Captured for architect phase — let's stay on what users need."

When all domains resolved: audit all recorded assumptions — resolve any that later context now answers. If an answer in a later domain invalidates an earlier one, reopen that domain. Then: "I think we have enough to draft the requirements." Write `## Requirements` using template in `assets/requirements-template.md`. Proceed to Quality Gate.

## Quality Gate

Work silently — user sees only the verdict.

**Analysis**: (1) Read requirements fully — note underspecified, inconsistent, or surprising items. (2) Verify claims against actual code/product behavior. (3) Check scope alignment if `## Scope` exists. (4) Evaluate: problem clarity, user coverage, requirements quality (specific? testable? prescriptions disguised as requirements?), success metrics, scope control, completeness. (5) Enumerate remaining assumptions — flag any now resolvable.

**Verdicts**:
- **Ready**: Solid enough to design from. Minor issues only.
- **Revise**: Issues to fix before design. Specify what.
- **Rethink**: Fundamental problems — rollback to `/explore`.

**Output**: Verdict header, Strengths (2-4 bullets), Issues (numbered, severity-ordered), Risks.

### On Revise

"Let's work through these issues." Group by section. Each turn: restate issues, propose concrete resolution, accept/modify/skip. Skipped issues become open items. After all resolved, update `## Requirements` in single write. Re-run Quality Gate. Repeat until Ready or Rethink.

Guardrails: don't re-explore codebase, don't expand scope, don't re-interview. Batch aggressively if user accepts unchanged.

### On Ready

Check glossary conditions: requirements introduce 3+ domain nouns not in codebase, naming conflicts found (PRD says "workspace," code says "org"), or feature crosses bounded-context boundaries. If any → Glossary. If none → After Delivering.

## Glossary

Run silently. Extract domain terms from requirements. Check codebase naming (models, APIs, types, UI labels, docs). Detect synonyms and homonyms. Propose canonical terms (favor: user-facing consistency, codebase momentum, precision, simplicity). Write as `### Glossary` under `## Requirements`.

Max 1-2 questions. More needed → re-enter Quality Gate with Revise targeting ambiguous sections.

## Rollback

**Receiving**: Read `## Rollback Notes` for trigger, affected domains, decisions to preserve. Resume only affected domains — don't re-interview resolved decisions. After resolving, re-run Quality Gate, clear `## Rollback Notes`.

**Triggering to explore**: If interview reveals scope is wrong (wrong problem, missing stakeholder, infeasible direction): append `## Rollback Notes` with trigger + affected domains + preserved decisions. "This changes the scope, not just requirements. Recommend revisiting `/explore`."

## After Delivering

Analyze requirements for UI-facing stories (screens, user flows, visual interactions). If any exist: "Requirements are ready. This feature introduces [N] user-facing stories — I recommend `/design` next, then `/architect`." If none: "Requirements are ready. This is backend-only — skip `/design` and run `/architect`." Either way: "Review and tell me what to change first."

Update directly on change requests. Flag conflicts with earlier decisions before updating.

Update `## Decisions Log` and `## Pipeline Status` with define row.
