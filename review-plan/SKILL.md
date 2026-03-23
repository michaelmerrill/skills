---
name: review-plan
description: MUST USE when the user asks to review, evaluate, critique, assess, challenge, or stress-test a technical design — especially designs in ./plans/ or designs produced by the design-feature skill. This is the design review step in the planning pipeline (plan-feature → write-a-prd → review-prd → glossary → design-feature → review-plan). Typical signals — "review this plan," "is this plan solid," "check the plan for gaps," "does this look ready to build," "what's wrong with this plan," "challenge this plan," "poke holes in this," "what could go wrong," "devil's advocate," "stress-test this plan," "find risks," "is this overengineered," "review-plan," or referencing a plan file by name. Also applies when a user just finished a design-feature session and asks for a second opinion or sanity check. This skill reads the technical design and the codebase quietly, then delivers a concise structured verdict — it does NOT restart discovery, re-interview the user, or produce new documents. Do NOT use for PRD review (use review-prd), PR/code review, creating plans (use design-feature), or reviewing non-plan documentation.
---

## What This Skill Does

Evaluate and pressure-test an existing feature plan for technical soundness, system fit, feasibility, scope control, and implementation readiness. Read the plan and codebase, verify claims against reality, apply adversarial analysis lenses to surface hidden risks and overengineering, deliver a verdict. No new documents are produced.

This is the design review step in the planning pipeline (`plan-feature` → `write-a-prd` → `review-prd` → `glossary` → `design-feature` → **review-plan**). This is the last checkpoint before implementation — your job is to find what was missed, underweighted, or left unsaid.

## Finding the Plan

Look for the plan in this order:
1. If the user names a specific file, read that file.
2. Check `./plans/` for design files (`*-design.md`). If there's exactly one, use it. If there are several, ask which one.
3. If the plan was produced earlier in this conversation (via design-feature), use the conversation context.

If no plan can be found, say so and stop. Do not fabricate a review.

If the plan is obviously a partial draft (missing major sections like the Phased Build Plan), note this and recommend completing the plan before a full review. Do not review a half-finished plan as if it were complete.

### Check for upstream documents

After finding the plan, also look in `./plans/` for:
- A matching PRD (`*-prd.md`) — the requirements the design is supposed to implement.
- A matching scope document (`*-scope.md`) — the boundaries the design is supposed to stay within.

If either exists, read them. Discrepancies between the design and its upstream documents are findings.

## Analysis Process

Work through these steps before writing any output. Do the investigation silently — the user sees only the final verdict, not a play-by-play of your exploration.

### Step 1: Understand the plan on its own terms

Read the plan fully. Identify what it proposes to build, the key design decisions, the stated scope, and the phasing. Note anything that feels underspecified, internally inconsistent, or surprising.

### Step 2: Verify against reality

The plan will make claims about the current system — existing models, patterns, auth approaches, API conventions. Check these against actual code and project documentation (READMEs, ADRs, architecture docs, inline doc comments). Look for:
- **Mismatches**: The plan says "we use X" but the code shows Y.
- **Missing context**: The plan assumes a capability exists that doesn't, or ignores a constraint that does.
- **Stale references**: Files, functions, or patterns mentioned in the plan that have moved or changed.
- **Source-of-truth conflicts**: Where plan, code, and documentation disagree. Classify each: stale docs, incomplete implementation, intentional divergence, or unclear.

A plan that doesn't match the codebase it will be built on is not ready — no matter how elegant the design.

#### PRD alignment

If a PRD exists for this feature, verify that the technical design covers all functional requirements:
- Are all user stories addressed by at least one behavior spec or build phase?
- Are there PRD requirements that the design ignores or contradicts?
- Does the design introduce behavior not called for by the PRD? If so, is this justified (technical necessity) or scope creep?

#### Scope alignment

If a scope document exists, verify that the design stays within scope boundaries:
- Does the design tackle items marked as "out of scope" in the scope document?
- Does the design miss items marked as "likely in for v1"?
- Are scope-level risks and assumptions acknowledged?

### Step 3: Pressure-test through adversarial lenses

Work through these lenses. Include only the ones that surface real concerns. **Present them in order of severity, not in the order listed below.** Skip any section where you'd be reaching or padding.

#### Assumptions That May Not Hold
What is the plan taking for granted? Dependencies that might not exist, performance characteristics that haven't been measured, user behavior that hasn't been validated, third-party services that might not support what's needed. Name each assumption and explain why it's shaky.

#### Failure Modes & Edge Cases
What happens when things go wrong? Not the happy path — the 2am pager path. Race conditions, partial failures, data corruption scenarios, rollback complexity, error propagation. Think about what breaks in production at scale, not just in a dev environment.

#### Overengineering & Unnecessary Complexity
Where is the plan doing more than needed? Premature abstractions, configurable things that will only ever have one value, infrastructure that anticipates scale that hasn't arrived, layers of indirection that make the code harder to debug. The best code is code you don't write.

#### Code Design & Coupling
Does the design create appropriate boundaries between components? Are there places where tight coupling will make future changes painful — where changing one module forces changes in several others? Conversely, are there unnecessary abstractions where direct coupling would be simpler and sufficient? Does the dependency direction make sense — do high-level modules depend on low-level details that should be behind an interface? Does the design follow or intentionally deviate from patterns already established in the codebase?

#### Scope Creep Risks
Where might this expand beyond what was intended? Features that invite follow-up requests, abstractions that beg to be generalized, boundaries that are fuzzy enough that adjacent work starts bleeding in. Identify the slippery slopes.

#### Scope Drift
Does the technical design actually solve the problem defined in the scope document and PRD? Or has the design drifted — solving an adjacent problem, gold-plating requirements, or reinterpreting the problem statement to fit a preferred technical approach?

#### PRD Coverage Gaps
Are there functional requirements from the PRD that the technical design doesn't address? Walk through the PRD's user stories and functional requirements and identify any that have no corresponding behavior spec, build phase, or design decision. Requirements that evaporate during technical design are a common failure mode.

#### Implementation Readiness
Could a developer pick this up and start building? What questions would they immediately have? Are acceptance criteria specific enough to verify? Is the testing strategy adequate?

#### Security & Access
Does the plan handle permissions, tenancy, trust boundaries, and sensitive data appropriately? What are the security implications of each design decision?

#### Operational Readiness
Are rollout, backward compatibility, monitoring, and failure recovery addressed? Feature flags? Migration strategy?

#### Maintenance Burden
What will this cost to maintain over time? Dependencies that will need updating, custom implementations that duplicate what a library does, patterns that future developers will find confusing, test coverage gaps that will allow regressions.

#### Simpler Alternatives
Is there a way to achieve the same goal with less? A library instead of a custom implementation, a simpler architecture that trades some flexibility for clarity, a phased approach that delivers value sooner with less risk, an existing feature that could be extended rather than building from scratch.

#### Should This Be Solved At All?
The most radical question. Is the problem real? Is it worth solving now? Could the team's time be better spent elsewhere? Is this solving a symptom rather than a root cause?

#### Feasibility & Phasing
Is the proposed phasing realistic? Are dependencies in the right order — does any phase assume infrastructure from a later phase? Are there hidden complexities the plan glosses over?

## Output Format

Deliver a concise review in chat. Use this structure:

### Verdict: [Ready / Revise / Rethink]

**Reviewing**: [plan name/file]

**Strengths** (2-4 bullets)
- What the plan gets right

**Issues** (severity-ordered, most critical first)
1. [Category]: Description. Why it matters. What to do about it.

**Risks** (if any found)
- Risks the plan doesn't adequately address

**Recommended next step**
One clear sentence on what to do now.

---

Keep the review concise. This is a verdict, not a rewrite. If an issue is best explained with a code snippet from the codebase, include it, but don't pad the review with lengthy quotations.

Scale your response to the severity of what you find. A solid plan with minor gaps gets a short, focused review. A fundamentally flawed plan gets the full treatment. The length of your review should itself signal severity.

If the verdict is **Revise**, end with a numbered list of specific items to address — phrased as instructions that could be acted on directly. Example: "Update the data model section to use the existing `users` table structure from `src/db/schema.ts`."

## Interaction Model

### During analysis

This skill minimizes user interaction during the analysis phase. Do not:
- Re-interview the user about their requirements
- Ask questions the codebase can answer
- Ask the user to confirm what you found in code

Ask a clarifying question only if there is a true blocking ambiguity — for example, the plan references a system you cannot find any trace of in the codebase or documentation, and you cannot determine whether it exists. If there are two plausible interpretations that lead to very different risk profiles, briefly note both rather than asking which one is correct.

### After the verdict

If the verdict is **Ready**, you're done. Suggest `/break-into-issues`.

If the verdict is **Rethink**, you're done. Recommend re-running `/design-feature`.

If the verdict is **Revise**, enter the Resolution Phase (see below).

## Resolution Phase

This phase activates only on a Revise verdict. The goal is to resolve every numbered issue from the verdict and update the design, without re-interviewing the user from scratch.

### Transition

After delivering the verdict, say:

> "Let's work through these issues. I'll suggest a resolution for each — accept, modify, or tell me to skip it."

### Group related issues

Before starting, mentally group the numbered issues by which design section they affect. Present each group together in a single turn. For example, if issues 1 and 4 both concern the Data Models section, address them in the same turn.

### One turn per issue-group

Each turn contains:
- The issue numbers being addressed and a brief restatement
- A concrete suggested resolution — specific changes to make in the design (updated data model fields, revised behavior spec steps, modified phase boundaries, etc.)
- An invitation to accept, modify, or skip

Do not present options. Present your best recommendation. The user will push back if they disagree.

Example:

> **Issues 1 & 4 — Data Models section**
>
> Issue 1: The `billing_subscriptions` table doesn't account for the existing `plans` table structure in `src/db/schema.ts`.
> Issue 4: The migration strategy doesn't address the foreign key from `invoices` to the current `subscriptions` table.
>
> Suggested resolution:
> - Update `billing_subscriptions` to extend the existing `plans` table with an `is_team` boolean and `team_id` foreign key, rather than creating a parallel table.
> - Add a migration step between Phase 1 and Phase 2 that backfills `team_id` on existing rows before adding the NOT NULL constraint.
>
> Accept these, or tell me what to change.

### When the user skips an issue

If the user says to skip an issue, note it as an open item. Do not argue. Move on.

### Updating the design

After all issue-groups are resolved, update the design file with all accepted and modified resolutions in a single write. Do not update the file incrementally during the Q&A.

Add a Pipeline Status entry to the design:

```
| review-plan | <date> | Revise → Resolved | <N> issues addressed, <M> skipped |
```

After updating, say:

> "Design updated. <N> issues resolved, <M> skipped. [If M > 0: Skipped items are noted in Assumptions & Unknowns.] Run `/review-plan` again to verify, or proceed to `/break-into-issues` if you're confident."

### Efficiency guardrails

- Do not re-explore the codebase during resolution. You already did that.
- Do not expand scope. If a resolution would add significant new design components, flag it and suggest deferring to a follow-up design-feature session.
- Do not re-interview. If the user's response opens a new technical question beyond the original issues, note it as an assumption/unknown rather than starting a discovery thread.
- If all issues are straightforward and the user accepts the first group without modification, batch the remaining groups more aggressively. Read the user's engagement level.

## Tone

Be direct, specific, and unapologetic. Name the file, the component, the dependency, the assumption. Generic warnings ("make sure to handle errors") are worthless — say what error, in what scenario, with what consequence.

Acknowledge what works — a good critic knows what's solid — but don't soften genuine problems. If the plan has issues, the team needs to hear it now, not after two weeks of implementation.
