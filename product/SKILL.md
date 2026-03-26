---
name: product
description: "Product requirements interview → standalone prd.md. Covers problem, users, stories, FRs, NFRs, metrics, scope, risks. Triggers: 'product requirements,' 'write a PRD,' 'define requirements,' post-scope. Not for: scoping (scope), UX design (design), technical design (engineering)."
---

Product requirements interview → `./plans/<feature>/prd.md` → quality gate → glossary (when needed). Pipeline: scope → **product** → design → engineering → plan.

## Rules

- **Language barrier**: User is a product person. Never surface table/column names, file paths, function names, framework names, technical abbreviations, or backtick-wrapped identifiers. Read codebase silently; describe findings as product behavior.

| Technical (never say) | Plain language (say this) |
|---|---|
| "The `orders` table has a `status` enum" | "Orders already track their current status" |
| "No WebSocket infrastructure" | "Real-time updates would be built from scratch" |

- **Product altitude**: No schemas, APIs, code paths, or architecture. Redirect: "Captured for engineering phase — let's stay on what users need."
- **Relentless questioning**: When answers are vague, drill deeper — reframe, ask for evidence, propose contrary positions. Record as assumption only when user genuinely can't resolve.
- **Code-first**: Explore codebase before asking questions it could answer. State what exists, what's missing — as product behavior. Surface competing patterns as conflicts; verify user answers against codebase.

## Starting

Before asking anything:

1. Detect state in `./plans/`. Multiple feature folders? List via `AskUserQuestion`, ask which.
   - `## Rollback Notes` with content in `pipeline.md`: priority. Skip steps 2-3, resume only affected domains, clear after resolving.
   - Feature folder with `scope.md`: read for context.
   - `prd.md` populated: skip interview → Quality Gate.
   - `prd.md` with `## Glossary` populated: skip to After Delivering.
   - No feature folder: create `./plans/<name>/pipeline.md` + start from scratch.
2. Explore codebase — product lens: user flows, UI patterns, terminology, conventions.
3. Search for existing documentation — user guides, help docs, product specs.

If scope brief exists: "I've read the scope brief for [feature]. Problem: [X], users: [Y], shaped solution: [Z]. Let's start with target users — who specifically will use this?"

No feature folder? Start from user's description, beginning with problem/motivation. Derive kebab-case name, confirm, create `./plans/<name>/pipeline.md`. No scope.md — user entered pipeline at product.

## Interview Protocol

Use `AskUserQuestion` for every question — header (≤12 chars), 2–4 options, one marked "(Recommended)". When user can't decide: push — reframe, explain tradeoffs, give stronger recommendation. Record assumption in Risks & Open Questions only when genuinely unresolvable. Revisit assumptions when later answers provide resolution.

Walk every branch depth-first. Resolve sub-questions before moving on. Only ask what codebase can't answer. No limit on questions; depth from more turns, not longer ones. After resolving each domain, append `<!-- progress: domain-N resolved -->` to the target section in `prd.md` (create file early if needed). On resume, detect markers and skip resolved domains. Remove markers when writing the final PRD.

## Interview Domains

Track resolution across 10 domains:

1. **Problem & motivation** — skip if scope.md exists (already resolved)
2. **Target users** — personas with needs, current behavior, frequency
3. **User stories** — As a/I want/so that + MoSCoW priority (Must/Should/Could/Won't)
4. **Functional requirements** — step through each story: see, click, receive. Each FR maps to stories (traceability)
5. **Non-functional requirements** — measurable targets + measurement method (relevant only)
6. **Success metrics** — baselines + targets + timeframes (30/60/90d) + instrumentation
7. **Scope** — in/out/future. Rationale for every out-of-scope item
8. **Market context** — **conditional**: only for features with competitors. Skip for internal tools/infra
9. **Dependencies & constraints** — business: pricing, legal, timing, content
10. **Risks & open questions** — adoption, competitive, assumptions, open items

When all domains resolved: audit assumptions — resolve any that later context answers. If a later domain invalidates an earlier one, reopen. Then: "I think we have enough to draft the PRD." Write `prd.md` using template in `assets/prd-template.md`. Proceed to Quality Gate.

## Quality Gate

Work silently — user sees only the verdict.

**Analysis**: (1) Read PRD fully — note underspecified, inconsistent, surprising items. (2) Verify claims against codebase. (3) Check alignment with `scope.md` if exists. (4) Evaluate against gate criteria. (5) Enumerate remaining assumptions — flag any now resolvable.

**Gate criteria**:
- Every story has 2+ acceptance criteria
- Every FR maps to a story, every story maps to an FR (no orphans)
- Success metrics have baselines, targets, timeframes, measurement
- No implementation language in FRs
- Out-of-scope items have rationale
- MoSCoW priority on every story and FR

**Verdicts**:
- **Ready**: Solid enough to design from. Minor issues only.
- **Revise**: Issues to fix before design. Specify what.
- **Rethink**: Fundamental problems — rollback to `/scope`.

**Output**: Verdict header, Strengths (2-4 bullets), Issues (numbered, severity-ordered), Risks.

### On Revise

"Let's work through these issues." Group by section. Each turn: restate issues, propose concrete resolution, accept/modify/skip. Skipped issues become open items. After all resolved, update `prd.md` in single write. Re-run Quality Gate. Repeat until Ready or Rethink.

Guardrails: don't re-explore codebase, don't expand scope, don't re-interview. Batch aggressively if user accepts unchanged.

### On Ready

Check glossary conditions: PRD introduces 3+ domain nouns not in codebase, naming conflicts found, or feature crosses bounded-context boundaries. If any → Glossary. If none → After Delivering.

## Glossary

Run silently. Extract domain terms from PRD. Check codebase naming (models, APIs, types, UI labels, docs). Detect synonyms and homonyms. Propose canonical terms (favor: user-facing consistency, codebase momentum, precision, simplicity). Write as `## Glossary` at bottom of `prd.md`.

Max 1-2 questions. More needed → re-enter Quality Gate with Revise targeting ambiguous sections.

## Rollback

**Receiving**: Read `## Rollback Notes` in `pipeline.md` for trigger, affected domains, decisions to preserve. Resume only affected domains — don't re-interview resolved decisions. After resolving, re-run Quality Gate, clear `## Rollback Notes` in `pipeline.md`.

**Triggering to scope**: If interview reveals scope is wrong (wrong problem, missing stakeholder, infeasible direction): append `## Rollback Notes` to `pipeline.md` with trigger + affected domains + preserved decisions. "This changes the scope, not just requirements. Recommend revisiting `/scope`."

## After Delivering

"Requirements are ready. Design is next — run `/design` to define the user experience, then `/engineering` for technical design." Always suggest `/design` next. "Review and tell me what to change first."

Update directly on change requests. Flag conflicts with earlier decisions before updating.

Update `## Decisions Log` and `## Status` in `pipeline.md` with product row.
