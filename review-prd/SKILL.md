---
name: review-prd
description: "Evaluate PRD for completeness, clarity, testability -> verdict (Ready/Revise/Rethink). Triggers: 'review PRD,' 'ready for design?' Silent analysis, no re-interview. On Revise, walks through issues to fix. Not for: plan review (review-plan), creating PRDs (write-a-prd), code review."
---

## Purpose

PRD quality gate. Pipeline: plan-feature -> write-a-prd -> **review-prd** -> glossary -> (design-ux) -> design-feature -> review-plan.

Reads PRD + codebase, identifies gaps/risks, delivers verdict. On Revise, resolves issues with user and updates the PRD.

## Finding the PRD

1. If user names a file, read it.
2. Check `./plans/` for `*-prd.md`. One? Use it. Several? Ask.
3. If PRD was produced earlier in conversation, use context.

No PRD? Say so and stop. Partial draft (missing User Stories or FRs)? Note it and recommend completing before review.

Also check for scope doc (`*-scope.md`) — PRD should be consistent with scope boundaries.

## Analysis Process

Work through silently — user sees only the final verdict.

### Step 1: Understand the PRD

Read fully. Identify problem, target users, key stories, FRs, scope. Note anything underspecified, inconsistent, or surprising.

### Step 2: Verify against product reality

Check PRD claims against actual code/product behavior:
- **Existing behavior mismatches**: PRD describes state that doesn't match code
- **Conflicting features**: proposed behavior conflicts with existing product behavior
- **Missing context**: PRD assumes capabilities that don't exist, or ignores existing features that partially solve the problem

### Step 3: Check scope alignment (if scope doc exists)

Does PRD stay within scope boundaries? Cover "likely in for v1" items? Address scope-level risks?

### Step 4: Evaluate dimensions

Report only where you found something worth noting:
- **Problem clarity** — Well-defined? Evidence it's real?
- **User coverage** — Well-defined personas? Missing user types?
- **Requirements quality** — Specific and testable? Unambiguous for a developer? Implementation prescriptions disguised as requirements?
- **Success metrics** — Measurable? Realistic targets? Would you know at 90 days if it succeeded?
- **Scope control** — v1 appropriately tight? Items to defer? Missing items undermining core value?
- **Feasibility signals** — Red flags visible from codebase? (Light check — deep analysis in design.)
- **Completeness** — Gaps? Stories without acceptance criteria? Unspecified edge cases?

### Step 5: Form verdict

About the PRD document — specific/complete enough for technical design?
- **Ready**: Solid enough to design from. Minor issues only.
- **Revise**: Issues to fix before design. Specify what.
- **Rethink**: Fundamental problems requiring core product decisions revisited.

## Output Format

Concise review in chat:

### Verdict: [Ready / Revise / Rethink]

**Reviewing**: [file]
**Scope doc**: [file or "none found"]

**Strengths** (2-4 bullets)

**Issues** (numbered, most important first)
1. [Category]: Description. Why it matters. What to do.

**Risks** (if any)

**Recommended next step** — one sentence. Suggest `/glossary` first when ANY of: PRD introduces 3+ domain nouns not found in codebase (new bounded context), analysis found naming conflicts (PRD says "workspace," code says "org," UI says "team"), or feature crosses existing bounded-context boundaries (e.g., billing + auth). Otherwise suggest `/design-feature`.

---

If **Revise**, end with numbered actionable items. These become Resolution Phase input.

## Interaction Model

### During analysis

Minimize interaction. Don't re-interview, don't ask questions the codebase/PRD can answer, don't ask user to confirm code findings. Ask only on true blocking ambiguity. Use `AskUserQuestion`: question, header (max 12 chars), 2-4 options with label + description, recommended first with "(Recommended)" suffix.

### After the verdict

**Ready**: Done. Suggest `/glossary` if criteria met (see Recommended next step), otherwise `/design-feature`. **Rethink**: Done. Recommend `/write-a-prd`. **Revise**: Enter Resolution Phase.

## Resolution Phase

Activates on Revise only. Resolve every numbered issue and update the PRD.

After delivering verdict: "Let's work through these issues. I'll suggest a resolution for each — accept, modify, or skip."

### Process

1. Group issues by PRD section they affect. Present each group in one turn.
2. Each turn: issue numbers + restatement, concrete suggested resolution (specific text/criteria/metrics to add/change), invitation to accept/modify/skip.
3. Present your best recommendation. User pushes back if they disagree.
4. If user skips an issue, note as open item. Move on.
5. After all groups resolved, update PRD file in a single write.

Add Pipeline Status entry: `| review-prd | <date> | Revise → Resolved | <N> addressed, <M> skipped |`

After updating: "PRD updated. <N> resolved, <M> skipped. Run `/review-prd` again to verify, or proceed to `/glossary`."

### Guardrails

- Don't re-explore codebase during resolution.
- Don't expand scope — flag and defer to follow-up.
- Don't re-interview — note new questions as risks/open questions.
- If user accepts first group without modification, batch remaining groups more aggressively.
