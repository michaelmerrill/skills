---
name: review-prd
description: MUST USE when the user asks to review, evaluate, or assess a product requirements document (PRD) — especially PRDs in ./plans/ or PRDs produced by the write-a-prd skill. This is the requirements review gate in the planning pipeline (plan-feature → write-a-prd → review-prd → glossary → design-feature). Typical signals — "review this PRD," "are these requirements solid," "check the PRD for gaps," "is this ready for design," "review-prd," or referencing a PRD file by name. Also applies when a user just finished a write-a-prd session and asks for a second opinion on the requirements. This skill reads the PRD and the codebase quietly, then delivers a concise structured verdict — it does NOT restart discovery or re-interview the user. On a Revise verdict, it walks through issues with the user and updates the PRD. Do NOT use for plan review (use review-plan), creating PRDs (use write-a-prd), technical design review, PR/code review, or challenging/stress-testing a plan (use review-plan).
---

## What This Skill Does

Evaluate an existing product requirements document for completeness, clarity, testability, and readiness for technical design. Read the PRD and codebase, identify gaps and risks, deliver a verdict. On a Revise verdict, walk through each issue with the user to resolve it, then update the PRD.

This is the requirements review gate in the planning pipeline (`plan-feature` → `write-a-prd` → **review-prd** → `glossary` → `design-feature` → `review-plan`). This skill determines whether the requirements are specific enough and well-formed enough to hand off to technical design.

## Finding the PRD

Look for the PRD in this order:
1. If the user names a specific file, read that file.
2. Check `./plans/` for PRD files (`*-prd.md`). If there's exactly one, use it. If there are several, ask which one.
3. If the PRD was produced earlier in this conversation (via write-a-prd), use the conversation context.

If no PRD can be found, say so and stop. Do not fabricate a review.

If the PRD is obviously a partial draft (missing major sections like User Stories or Functional Requirements), note this and recommend completing the PRD before a full review. Do not review a half-finished PRD as if it were complete.

### Check for scope document

Also look for a matching scope document (`*-scope.md`) in `./plans/`. If one exists, read it — the PRD should be consistent with the scope boundaries and problem statement established there.

## Analysis Process

Work through these steps before writing any output. Do the investigation silently — the user sees only the final verdict, not a play-by-play of your exploration.

### Step 1: Understand the PRD on its own terms

Read the PRD fully. Identify the problem it addresses, the target users, the key user stories, the functional requirements, and the stated scope. Note anything that feels underspecified, internally inconsistent, or surprising.

### Step 2: Verify against the product reality

The PRD will make claims about existing user experiences, workflows, and pain points. Check these against actual code and product behavior. Look for:
- **Existing behavior mismatches**: The PRD describes a current state that doesn't match what the code actually does.
- **Conflicting features**: The PRD proposes behavior that conflicts with existing product behavior users already rely on.
- **Missing context**: The PRD assumes a capability or workflow exists that doesn't, or ignores an existing feature that already partially solves the problem.

### Step 3: Check scope alignment

If a scope document exists:
- Does the PRD stay within the scope boundaries?
- Does the PRD cover the items listed as "likely in for v1" in the scope document?
- Are any scope-level risks or assumptions addressed in the PRD?

### Step 4: Evaluate across dimensions

Assess the PRD against each of these. Not every dimension will have findings — report only where you found something worth noting.

- **Problem clarity**: Is the problem well-defined? Would a designer or engineer reading this understand what user pain they're solving? Is there evidence the problem is real (user feedback, metrics, support tickets)?
- **User coverage**: Are the target users well-defined? Are there user types affected by this feature that the PRD doesn't address? Are the personas specific enough to make design decisions from?
- **Requirements quality**: Are the functional requirements specific and testable? Could a developer read each requirement and know unambiguously what to build? Are there requirements that are actually implementation prescriptions disguised as requirements?
- **Success metrics**: Are the success metrics measurable? Are the targets realistic? Would you actually know, 90 days after launch, whether this feature succeeded?
- **Scope control**: Is the v1 scope appropriately tight? Are there scope items that should be deferred? Are there missing items that cannot be deferred without undermining the core value proposition?
- **Feasibility signals**: Does anything in the requirements raise feasibility red flags? (e.g., requirements that would need technology the team doesn't have, requirements that conflict with architectural constraints visible in the codebase). This is a light check — deep feasibility analysis happens during design.
- **Completeness**: Are there obvious gaps? User stories without acceptance criteria? Requirements areas that are mentioned but not specified? Edge cases from the user's perspective that aren't addressed?

### Step 5: Form a verdict

Your verdict is about the *PRD document* — is it specific and complete enough to hand off to technical design?

- **Ready**: The PRD is solid enough to design from. Minor issues only.
- **Revise**: The PRD has issues that should be fixed before moving to design. Specify what.
- **Rethink**: The PRD has fundamental problems — unclear problem, missing users, requirements that don't connect to stated goals — that require revisiting core product decisions.

## Output Format

Deliver a concise review in chat. Use this structure:

### Verdict: [Ready / Revise / Rethink]

**Reviewing**: [PRD name/file]
**Scope doc**: [scope doc name/file, or "none found"]

**Strengths** (2-4 bullets)
- What the PRD gets right

**Issues** (numbered, most important first)
1. [Category]: Description. Why it matters. What to do about it.

**Risks** (if any found)
- Product risks the PRD doesn't adequately address

**Recommended next step**
One clear sentence on what to do now. If the feature introduces new domain concepts or the codebase shows terminology drift, suggest `/glossary` first. Otherwise, suggest proceeding to `/design-feature`.

---

Keep the review concise. This is a verdict, not a rewrite. If an issue is best explained with a reference to existing product behavior in the codebase, include it, but don't pad the review with lengthy quotations.

If the verdict is **Revise**, end with a numbered list of specific items to address — phrased as instructions that could be acted on directly. Example: "Add acceptance criteria to the 'Invite Team Member' user story that specify what happens when the invitee already has an account vs. when they don't." These numbered items become the input to the Resolution Phase.

## Interaction Model

### During analysis

This skill minimizes user interaction during the analysis phase. Do not:
- Re-interview the user about their requirements
- Ask questions the codebase or PRD can answer
- Ask the user to confirm what you found in code

Ask a clarifying question only if there is a true blocking ambiguity — for example, the PRD references a user workflow you cannot find any trace of in the codebase or documentation, and you cannot determine whether it exists.

### After the verdict

If the verdict is **Ready**, you're done. Suggest the next pipeline step.

If the verdict is **Rethink**, you're done. Recommend re-running `/write-a-prd`.

If the verdict is **Revise**, enter the Resolution Phase (see below).

## Resolution Phase

This phase activates only on a Revise verdict. The goal is to resolve every numbered issue from the verdict and update the PRD, without re-interviewing the user from scratch.

### Transition

After delivering the verdict, say:

> "Let's work through these issues. I'll suggest a resolution for each — accept, modify, or tell me to skip it."

### Group related issues

Before starting, mentally group the numbered issues by which PRD section they affect. Present each group together in a single turn. For example, if issues 2 and 5 both concern the "User Stories" section, address them in the same turn.

### One turn per issue-group

Each turn contains:
- The issue numbers being addressed and a brief restatement
- A concrete suggested resolution — specific text, criteria, or metrics to add/change in the PRD
- An invitation to accept, modify, or skip

Do not present options. Present your best recommendation. The user will push back if they disagree.

Example:

> **Issues 2 & 5 — User Stories section**
>
> Issue 2: The "Invite Team Member" story has no acceptance criteria for the case where the invitee already has an account.
> Issue 5: The "Remove Team Member" story doesn't specify what happens to their owned resources.
>
> Suggested resolution:
> - Add to "Invite Team Member" acceptance criteria: "If the invitee already has an account, they receive an invitation to join the team (not a signup link) and see the team in their team switcher upon accepting."
> - Add to "Remove Team Member" acceptance criteria: "Owned resources (dashboards, reports) are reassigned to the team admin. The removed member retains access to their personal account but loses access to all team resources immediately."
>
> Accept these, or tell me what to change.

### When the user skips an issue

If the user says to skip an issue, note it as an open item. Do not argue. Move on.

### Updating the PRD

After all issue-groups are resolved, update the PRD file with all accepted and modified resolutions in a single write. Do not update the file incrementally during the Q&A.

Add a Pipeline Status entry to the PRD:

```
| review-prd | <date> | Revise → Resolved | <N> issues addressed, <M> skipped |
```

After updating, say:

> "PRD updated. <N> issues resolved, <M> skipped. [If M > 0: Skipped items are noted as open questions.] Run `/review-prd` again to verify, or proceed to `/glossary` if you're confident."

### Efficiency guardrails

- Do not re-explore the codebase during resolution. You already did that.
- Do not expand scope. If a resolution would add significant new requirements, flag it and suggest deferring to a follow-up write-a-prd session.
- Do not re-interview. If the user's response opens a new product question beyond the original issues, note it as a risk/open question rather than starting a discovery thread.
- If all issues are straightforward and the user accepts the first group without modification, batch the remaining groups more aggressively. Read the user's engagement level.

## Tone

Pragmatic and product-focused. You are a product peer doing a review, not an adversary. Acknowledge what works before noting what doesn't. When raising issues, explain why they matter from a product perspective — will this confuse users? Will this make success unmeasurable? Will this lead to scope creep during design?
