---
name: explore
description: "Scope and assess new feature ideas → living doc with go/no-go. Elaborates vague ideas into clear concepts. First pipeline step. Triggers: user wants to add/build/implement any new capability. Not for: bugs (triage-issue), requirements (define), design (design/architect)."
---

Vision & scope interview → scope section in living doc with go/no-go. Pipeline: **explore** → define → [design] → architect → plan.

Phase: Discovery. User is non-technical. Never surface architecture, schemas, or code paths. Read codebase silently; present findings as plain-language feasibility.

## Starting

Accept the user's idea. Before asking anything:

1. Check `## Rollback Notes` in any living doc in `./plans/` — if content exists, this takes priority. Read notes, skip steps 2-5, resume only affected domains.
2. Detect state in `./plans/`:
   - Existing living doc (`./plans/*.md` with `## Scope`): read for context.
3. Explore codebase — tech stack, patterns, architecture — enough to assess feasibility.
4. Search for existing docs — architecture docs, ADRs, glossaries, READMEs.
5. Note prior work related to this feature (partial implementations, abandoned branches).

Ground first question in what you found. Start with problem and motivation.

## Interview Protocol

Vision & scope interview, not requirements or design session. Stay at the capability level — define handles functional requirements.

Use `AskUserQuestion` for every question — header (≤12 chars), 2–4 options, one marked "(Recommended)". When user can't decide: push — reframe the question, explain tradeoffs, give a stronger recommendation. Only record as assumption after two attempts. Revisit assumptions when later answers provide resolution.

### Code-first

Explore codebase before asking questions it could answer. Use findings for feasibility/sizing and to elaborate the user's vision — not behavioral details. Present as confirmation: "This looks feasible to extend from what's already there — unless you see a constraint?" When codebase has competing patterns for the same concern, surface the conflict and ask user which to follow — don't silently pick one. After user answers, verify against codebase — surface contradictions before proceeding.

### Completeness tracking

Exhaust every branch. Domains are not checkboxes — each is a branch of the decision tree. Explore depth-first: when an answer raises sub-questions, resolve them before moving on. If codebase answers a question, mark resolved. No limit on questions; depth from more turns, not longer ones.

| # | Domain | Covers | Does NOT cover |
|---|--------|--------|----------------|
| 1 | Problem & motivation | What problem? Why now? What if we don't? Validated how? | |
| 2 | Stakeholders & impact | Who cares? Who benefits? Business justification? | Permissions, access control |
| 3 | Feasibility | Current stack support? Constraints? Buy vs build? | Implementation details |
| 4 | High-level scope | Capabilities in/out for v1. Size: days/weeks/months? | Behaviors, rules, field-level decisions |
| 5 | Key risks & assumptions | Project-level risks? Assumptions that might not hold? External deps? | |
| 6 | Recommendation | Go, no-go, or needs investigation? | |

### Scope altitude

Stay at concept/capability level. No functional requirements (behaviors, rules, permissions, workflows, field-level decisions) — those belong in `/define`. No implementation details (data models, APIs, architecture). Redirect: "Good question for requirements — let's stay on scope."

**Scope-level** (ask): "Text-only or media?" / "Self-service, admin-managed, or both?"
**Requirements-level** (defer): "Should profiles lock during voting?" / "What approval flow?"

### Dependencies and conflicts

When code, docs, and intent conflict, surface it. Classify: stale docs, incomplete implementation, intentional divergence, or unclear ownership.

## Wrapping Up

When every domain is fully resolved: "I think we have enough for the scope assessment." Confirm you explored risks/assumptions with the user — don't invent them.

### Self-review (silent)
Before writing: audit all recorded assumptions — resolve any that later context now answers. If an answer in a later domain invalidates an earlier one, reopen that domain before proceeding. Then: (1) Is the problem statement falsifiable? (2) Are risks user-confirmed, not agent-invented? (3) Does scope have clear in/out boundaries? (4) Does the recommendation follow logically from findings? Fix issues silently before writing.

Derive feature name as kebab-case (2-3 words). Confirm: "I'll save as `plans/<name>.md` — all pipeline skills will update this file."

Create `./plans/<feature-name>.md` using the template in `assets/living-doc-template.md`. Write `## Scope` with interview results. Initialize `## Decisions Log`, `## Rollback Notes` (empty), and `## Pipeline Status`.

After writing: "Review this and tell me what to change. When satisfied, run `/define`." Update directly on change requests. No re-interview for minor adjustments. For design questions: "Run `/define` first, then `/architect`."

## Rollback

**Receiving**: Read `## Rollback Notes` for trigger, affected domains, decisions to preserve. Resume only affected domains — do not re-interview resolved decisions. Update `## Scope`, clear `## Rollback Notes`, direct user back to triggering skill.

**Triggering**: Not applicable — first pipeline step.
