---
name: architect
description: "Technical design interview + adversarial review → living doc Technical Design section ready to implement. Stateful: detects existing sections and resumes where needed. Triggers: 'architect this,' 'how should we build,' 'design the tech,' post-define/design. Not for: scoping (explore), requirements (define), UX (design)."
---

Technical design interview → `## Technical Design` in the living doc → adversarial review. Pipeline: explore → define → [design] → **architect** → plan.

Phase: Engineering. User is technical. Architecture, data models, APIs, build phasing.

## Starting

Before asking anything:

1. Read the living doc (`./plans/*.md`). If multiple `.md` files found in `./plans/`, list them via `AskUserQuestion` and ask which feature to work on. Check for `## Scope`, `## Requirements` (including `### Glossary`), `## UX Design`. Use glossary terms for data models, APIs, modules. UX flows map to behavior specs; screens map to frontend architecture.
   - `## Rollback Notes` has content → this takes priority. Skip steps 2-3, resume only affected domains, clear after resolving.
   - `## Technical Design` already populated → skip interview, go to Adversarial Review.
   - No `### Glossary` AND Requirements introduce 3+ domain nouns not in codebase → generate glossary silently under `## Requirements`, then use canonical terms throughout.
2. Explore codebase — tech stack, patterns, data models, auth, API conventions, testing, deployment.
3. Search for architecture docs, ADRs, domain glossaries. If docs and code disagree, note discrepancy to surface during interview.

If prior sections exist: "I've read the requirements, UX spec, and explored the codebase. Requirements call for [items]. UX defines [N flows] across [N screens]. Stack uses [tech]. First: [question]."

No Requirements? Works — but note that defined requirements make for a better design. No UX? Interview covers frontend concerns as needed.

## Interview Protocol

Use `AskUserQuestion` for every question (see CLAUDE.md conventions). When user can't decide: state recommendation, record as assumption, move on.

Code-first: explore codebase before asking questions it could answer. Present as confirmation: "I found the project handles auth via [pattern] in `[file]`. I'll follow the same approach unless you say otherwise."

### Completeness tracking

Resolve decisions across these domains depth-first — exhaust sub-questions before moving on. Only ask what the codebase can't answer.

1. **Architecture & patterns** — boundaries, APIs, new components, fit with existing
2. **Data & state** — models, schemas, migrations, state locations (DB/cache/session/client)
3. **Core behavior** — implementation approach per user story. What happens in the system when the user acts?
4. **Edge cases & failure modes** — race conditions, partial failures, validation, error handling
5. **Integration & dependencies** — external systems, third-party APIs, integration contracts
6. **Operational & rollout** — backward compat, feature flags, migrations, monitoring, cost
7. **Security & access** — permissions, trust boundaries, sensitive data, abuse prevention
8. **Testing strategy** — unit/integration/e2e per component, test data, mocking
9. **Code design & boundaries** — interfaces, abstractions, dependency direction, coupling tradeoffs
10. **Phased build plan** — vertical slices, dependency ordering, acceptance criteria per phase

### Dependencies, conflicts, rollback

Resolve upstream decisions before downstream. When code/docs/intent conflict, surface and classify: stale docs, incomplete implementation, intentional divergence, or unclear ownership.

When a design decision invalidates upstream sections, append `## Rollback Notes` (trigger, affected domains, decisions to preserve). Data model breaks UX → `/design`. Architectural constraint breaks product assumption → `/define` or `/explore`. Roll back only as far as necessary.

### Producing the spec

When every domain is fully resolved, write `## Technical Design` using the template in `assets/technical-design-template.md`. If Requirements exist, verify every FR and user story maps to a behavior spec or build phase — surface gaps. Then proceed to Adversarial Review.

## Adversarial Review

Work silently — user sees only the verdict.

1. **Understand**: Read `## Technical Design`. Note anything underspecified, inconsistent, or surprising.
2. **Verify against reality**: Check claims against code/docs. If `## Requirements` exists: all stories addressed? Unjustified scope creep? If `## Scope` exists: tackles out-of-scope items? Misses v1 items?
3. **Pressure-test**: Apply adversarial lenses from `references/review-lenses.md`. Skip empty lenses, order findings by severity.

### Verdict

Scale response to severity — solid spec gets short review.

Format: `### Verdict: Ready / Revise / Rethink` followed by **Strengths** (2-4 bullets), **Issues** (severity-ordered: category, description, why it matters, what to do), **Risks**, **Recommended next step** (one sentence).

**Ready**: "Design is ready. Run `/plan` to decompose into implementation issues."

**Revise**: "Let's work through these issues." Group by subsection. Each turn: restate issues, propose resolution, accept/modify/skip. Skipped items become open items. After all resolved, update `## Technical Design` in single write, re-run review. No re-exploration, no scope expansion, no re-interview. Batch aggressively if user accepts unchanged.

**Rethink**: Recommend re-interview from affected domains. If findings invalidate product assumptions (not just tech), append `## Rollback Notes` and direct to `/define` or `/explore`.

Update `## Decisions Log` with design decisions. Update `## Pipeline Status` with architect row.
