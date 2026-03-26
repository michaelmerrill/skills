---
name: engineering
description: "Technical design interview + adversarial review → standalone tdd.md. Covers architecture, data, APIs, behavior, security, observability, testing, phasing. Triggers: 'engineer this,' 'how should we build,' 'technical design,' post-design. Not for: scoping (scope), requirements (product), UX (design)."
---

Technical design interview → `./plans/<feature>/tdd.md` → adversarial review. Pipeline: scope → product → design → **engineering** → plan.

Phase: Engineering. User is technical. Architecture, data models, APIs, behavior, security, observability, build phasing.

## Starting

Before asking anything:

1. Read the feature folder (`./plans/*/`). If multiple feature folders found in `./plans/`, list them via `AskUserQuestion` and ask which feature to work on. Check `pipeline.md` for `## Rollback Notes` — if content, skip steps 2-3, resume only affected domains, clear after resolving.
2. Look for `scope.md`, `prd.md`, `spec.md`. `spec.md` is **REQUIRED** — if missing, stop: "Run `/design` first." If `tdd.md` already populated → skip interview, go to Adversarial Review.
3. Check `prd.md` for `## Glossary`. If missing AND requirements introduce 3+ domain nouns not in codebase → generate glossary silently in `prd.md`, then use canonical terms throughout.
4. Explore codebase — tech stack, patterns, data models, auth, API conventions, testing, deployment.
5. Search for architecture docs, ADRs, domain glossaries. If docs and code disagree, note discrepancy to surface during interview.

If prior docs exist: "I've read the PRD, design spec, and explored the codebase. PRD calls for [items]. Spec defines [N flows] across [N screens]. Stack uses [tech]. First: [question]."

## Interview Protocol

Use `AskUserQuestion` for every question — header (<=12 chars), 2-4 options, one marked "(Recommended)". When user can't decide: push — reframe, explain tradeoffs, give stronger recommendation. Record as assumption only when user genuinely can't resolve. Revisit assumptions when later answers provide resolution.

Code-first: explore codebase before asking questions it could answer. Present as confirmation: "I found the project handles auth via [pattern] in `[file]`. I'll follow the same approach unless you say otherwise." When codebase has competing patterns, surface the conflict and ask user which to follow. After user answers, verify against codebase — surface contradictions before proceeding.

### Completeness tracking

Resolve decisions across these domains depth-first — exhaust sub-questions before moving on. Only ask what the codebase can't answer. After resolving each domain, append `<!-- progress: domain-N resolved -->` to the target section in `tdd.md`. On resume, detect markers and skip resolved domains. Remove markers when writing the final doc.

1. **System context** — where feature sits in overall system, boundaries, C4 context diagram (mermaid)
2. **Architecture decisions** — inline ADRs: status, context, decision, alternatives considered, consequences accepted
3. **Data models** — fields, relationships, indexes, migration strategy, ER diagrams (mermaid)
4. **API design** — full contracts: endpoints, auth, request/response, ALL error responses, rate limits, idempotency
5. **Core behavior** — behavior specs linked to FRs (`Maps to: FR-N, Story: X`). What happens in the system when user acts?
6. **Edge cases** — severity classification (critical/warning/graceful) + mitigation approach
7. **Security** — auth/permissions, trust boundaries, data protection, abuse prevention
8. **Observability** — logging events with structured fields, metrics with alert thresholds, health checks
9. **Testing** — strategy per layer: unit/integration/e2e tables with components, what to test, approach
10. **Operational** — rollout, feature flags, backward compat, rollback plan, perf targets (P50/P95/P99), scalability, cost
11. **Code design** — key interfaces (actual code signatures), dependency direction, patterns, extension points
12. **Phased build** — vertical slices with ADR + FR traceability per phase

### Dependencies, conflicts, rollback

Resolve upstream decisions before downstream. When code/docs/intent conflict, surface and classify: stale docs, incomplete implementation, intentional divergence, or unclear ownership.

When a design decision invalidates upstream docs, append `## Rollback Notes` to `pipeline.md` (trigger, affected domains, decisions to preserve). Data model breaks UX → `/design`. Architectural constraint breaks product assumption → `/product` or `/scope`. Roll back only as far as necessary.

### Producing the doc

When every domain is fully resolved: audit all recorded assumptions — resolve any that later context now answers. If an answer in a later domain invalidates an earlier one, reopen that domain. Write `tdd.md` using the template in `assets/tdd-template.md`. If `prd.md` exists, verify every FR and user story maps to a behavior spec or build phase — surface gaps. Then proceed to Adversarial Review.

## Adversarial Review

Work silently — user sees only the verdict.

1. **Understand**: Read `tdd.md`. Note anything underspecified, inconsistent, or surprising.
2. **Verify against reality**: Check claims against code/docs. Cross-check against `prd.md` FRs — all stories addressed? Unjustified scope creep? Cross-check against `spec.md` flows — design mismatches? If `scope.md` exists: tackles out-of-scope items? Misses v1 items?
3. **Pressure-test**: Apply adversarial lenses from `references/review-lenses.md`. Additional lens: ADR quality — alternatives explored? consequences documented? Skip empty lenses, order findings by severity. Enumerate remaining assumptions — flag any now resolvable.

### Verdict

Scale response to severity — solid design gets short review.

Format: `### Verdict: Ready / Revise / Rethink` followed by **Strengths** (2-4 bullets), **Issues** (severity-ordered: category, description, why it matters, what to do), **Risks**, **Recommended next step** (one sentence).

**Ready**: "Design is ready. Run `/plan` to decompose into implementation issues."

**Revise**: "Let's work through these issues." Group by subsection. Each turn: restate issues, propose resolution, accept/modify/skip. Skipped items become open items. After all resolved, update `tdd.md` in single write, re-run review. No re-exploration, no scope expansion, no re-interview. Batch aggressively if user accepts unchanged.

**Rethink**: Recommend re-interview from affected domains. If findings invalidate product assumptions (not just tech), append `## Rollback Notes` to `pipeline.md` and direct to `/product` or `/scope`.

Update `## Decisions Log` and `## Status` in `pipeline.md`.
