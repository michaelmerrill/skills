---
name: review-plan
description: "Evaluate technical design -> verdict (Ready/Revise/Rethink). Adversarial analysis: verify against codebase, pressure-test assumptions, find gaps. Triggers: 'review plan,' 'stress-test,' 'poke holes,' 'is this ready to build.' Not for: PRD review (review-prd), creating designs (design-feature), code review."
---

## Purpose

Design quality gate — last checkpoint before implementation. Pipeline: plan-feature -> write-a-prd -> review-prd -> glossary -> (design-ux) -> design-feature -> **review-plan**.

Reads design + codebase, verifies claims against reality, applies adversarial lenses, delivers verdict. On Revise, resolves issues with user and updates the design.

## Finding the Plan

1. If user names a file, read it.
2. Check `./plans/` for `*-design.md`. One? Use it. Several? Ask.
3. If plan was produced earlier in conversation, use context.

No plan? Say so and stop. Partial draft (missing Phased Build Plan)? Recommend completing before review.

Also check for PRD (`*-prd.md`) and scope doc (`*-scope.md`) — discrepancies between design and upstream docs are findings.

## Analysis Process

Work through silently — user sees only the final verdict.

### Step 1: Understand the plan

Read fully. Identify what it proposes, key decisions, scope, phasing. Note anything underspecified, inconsistent, or surprising.

### Step 2: Verify against reality

Check plan claims against actual code and documentation:
- **Mismatches**: plan says "we use X" but code shows Y
- **Missing context**: plan assumes capability that doesn't exist, or ignores existing constraint
- **Stale references**: files, functions, patterns mentioned that have moved/changed
- **Source-of-truth conflicts**: where plan, code, and docs disagree — classify as stale docs, incomplete impl, intentional divergence, or unclear

#### PRD alignment (if PRD exists)
- All user stories addressed by behavior spec or build phase?
- Requirements the design ignores or contradicts?
- Design introduces behavior not in PRD — justified (technical necessity) or scope creep?

#### Scope alignment (if scope doc exists)
- Design tackles "out of scope" items?
- Design misses "likely in for v1" items?
- Scope-level risks acknowledged?

### Step 3: Pressure-test through adversarial lenses

Apply relevant lenses. Present by severity, skip empty ones.

- **Assumptions That May Not Hold** — Dependencies, performance assumptions, unvalidated user behavior, third-party limitations. Name each + why it's shaky.
- **Failure Modes & Edge Cases** — Race conditions, partial failures, data corruption, rollback complexity. What breaks at scale, not just in dev.
- **Overengineering** — Premature abstractions, config that'll only have one value, infrastructure for scale that hasn't arrived, indirection that hinders debugging.
- **Code Design & Coupling** — Appropriate boundaries? Tight coupling causing change cascading? Unnecessary abstractions? Dependency direction sensible? Follows/deviates from established patterns?
- **Scope Creep Risks** — Features inviting follow-ups, abstractions begging generalization, fuzzy boundaries.
- **Scope Drift** — Does design actually solve the PRD problem, or has it drifted to an adjacent problem or gold-plated requirements?
- **PRD Coverage Gaps** — FRs and user stories with no corresponding behavior spec, build phase, or design decision.
- **Implementation Readiness** — Could a developer start building? Unanswered questions? Acceptance criteria specific enough?
- **Security & Access** — Permissions, tenancy, trust boundaries, sensitive data.
- **Operational Readiness** — Rollout, backward compatibility, monitoring, failure recovery, feature flags.
- **Maintenance Burden** — Dependencies needing updates, custom code duplicating libraries, confusing patterns, test coverage gaps.
- **Simpler Alternatives** — Library instead of custom? Simpler architecture? Phased approach delivering value sooner?
- **Should This Be Solved At All?** — Problem real? Worth solving now? Solving symptom vs root cause?
- **Feasibility & Phasing** — Phases realistic? Dependencies in right order? Hidden complexities?

## Output Format

Concise review in chat. Scale response to severity — solid plan gets short review, flawed plan gets full treatment.

### Verdict: [Ready / Revise / Rethink]

**Reviewing**: [file]

**Strengths** (2-4 bullets)

**Issues** (severity-ordered, most critical first)
1. [Category]: Description. Why it matters. What to do.

**Risks** (if any)

**Recommended next step** — one sentence.

---

If **Revise**, end with numbered actionable items for Resolution Phase.

## Interaction Model

### During analysis

Minimize interaction. Don't re-interview, don't ask questions the codebase can answer. Ask only on true blocking ambiguity — if two interpretations lead to very different risk profiles, note both rather than asking. Use `AskUserQuestion`: question, header (max 12 chars), 2-4 options with label + description, recommended first with "(Recommended)" suffix.

### After the verdict

**Ready**: Done. Suggest `/break-into-issues`. **Rethink**: Done. Recommend `/design-feature`. **Revise**: Enter Resolution Phase.

## Resolution Phase

Activates on Revise only. Resolve every numbered issue and update the design.

After delivering verdict: "Let's work through these issues. I'll suggest a resolution for each — accept, modify, or skip."

### Process

1. Group issues by design section they affect. Present each group in one turn.
2. Each turn: issue numbers + restatement, concrete suggested resolution (specific design changes — model fields, behavior spec steps, phase boundaries), invitation to accept/modify/skip.
3. Present your best recommendation. User pushes back if they disagree.
4. If user skips an issue, note as open item. Move on.
5. After all groups resolved, update design file in a single write.

Add Pipeline Status entry: `| review-plan | <date> | Revise → Resolved | <N> addressed, <M> skipped |`

After updating: "Design updated. <N> resolved, <M> skipped. Run `/review-plan` again to verify, or proceed to `/break-into-issues`."

### Guardrails

- Don't re-explore codebase during resolution.
- Don't expand scope — flag and defer to follow-up design-feature session.
- Don't re-interview — note new questions as assumptions/unknowns.
- If user accepts first group without modification, batch remaining groups more aggressively.
