---
name: plan
description: "Decompose technical design into agent-sized implementation issues → numbered markdown files + standalone plan.md. Triggers: 'plan this,' 'break into issues,' 'create tasks,' 'ready to implement,' post-engineering. Not for: designs without file paths/phases (run engineering first)."
---

Decompose reviewed design into agent-sized issues → `./plans/<feature>/plan.md` + `./issues/<feature>/NN-slug.md`. Pipeline: scope → product → design → engineering → **plan** → publish-linear.

Phase: Engineering. User is technical.

## Starting

Ask user for feature name or list `./plans/*/pipeline.md` and ask via `AskUserQuestion`.

If `## Rollback Notes` has content in `pipeline.md`: read notes, skip validation, resume only affected domains, clear after resolving.

Validate by checking for `tdd.md` with `## Phased Build Plan`:
- **Has tdd.md + Phased Build Plan**: Proceed.
- **Has prd.md but no tdd.md**: Stop. "Run `/engineering` first."
- **Has scope.md only**: Stop. "Run `/product` then `/engineering` first."
- **Simple fix plan** (specific file changes, no phases): Accept — produces 1-2 issues.

## Process

### 1. Read the codebase

1. Read `CLAUDE.md` and `AGENTS.md` for conventions and quality gates.
2. Read `prd.md` (for requirements coverage), `spec.md` (for UX context), `tdd.md` (for build plan).
3. Read every source file referenced in the design. For each: line count, key interfaces/types + line numbers, pattern landmarks (insertion points, code to follow), import paths.
4. For each new file the plan calls for, find the closest existing analog as "pattern reference."

### 2. Decompose into vertical slices

Break into **vertical slices** (tracer bullets). Each issue delivers one working capability through all layers it touches — schema + service + route + UI together when they serve one feature. Each slice must be independently demoable or verifiable.

**Anti-pattern — horizontal layers**: Issue 1 = "all schema tables", Issue 2 = "all services", Issue 3 = "all UI pages". Also bad: splitting "template service" and "template UI" into separate issues — same capability, should be one issue. Instead: Issue 1 = "template CRUD" (schema + service + settings UI), Issue 2 = "public signing" (page + action + customer linking). Each issue is a thin vertical thread, not a thick horizontal slab.

**Foundation exception**: A schema-only issue is acceptable when its tables serve 3+ downstream issues (shared migration). Otherwise merge schema into its first consuming capability.

**Sizing**: 1-6 files per issue, hard cap 8. If exceeding 6, split by feature boundary — not by layer. A capability's service and UI belong in the same issue. Cross-cutting concerns (email, notifications, cron) get own issues after the code they wire into. Each issue includes its own tests. Zero design decisions remaining.

Classify each: **Auto** (agent implements autonomously) or **HITL** (needs human review — UX layout, visual design, open tradeoffs).

### 3. Present breakdown

Show table with columns: #, Title, Files, Depends on, Type, Parallel with. Ask for approval via `AskUserQuestion` — header (≤12 chars), 2–4 options, one marked "(Recommended)".

Solicit feedback on: granularity (too coarse / too fine?), dependency correctness, slices to merge or split, Auto/HITL classification. Max 3 targeted questions if genuine ambiguities exist. If unambiguous: "No questions — the design resolves all decisions. Approve?"

Iterate until approved.

### 4. Validate coverage

Cross-check that every FR from `prd.md` and every phase from `tdd.md` `## Phased Build Plan` is covered by ≥1 issue. Flag gaps before generating files.

### 5. Generate issues

Create `./issues/<feature-name>/` (kebab-case from feature folder name). Write each issue in dependency order using the template in `assets/issue-template.md`. No `00-overview.md` — that content goes in `plan.md`.

### 6. Write plan.md

Write `./plans/<feature>/plan.md` using the template in `assets/plan-template.md`. Update `## Status` in `pipeline.md` with plan row. Update `## Decisions Log` with planning decisions.

### 7. Finish

Print overview table. Note Auto vs HITL. Suggest: "To start, hand `01-...` to an agent. Parallelizable issues can run concurrently in separate worktrees. Run `/publish-linear` to sync this feature to Linear for team visibility."

## Rollback

**Receiving**: Read `## Rollback Notes` in `pipeline.md` for trigger, affected domains, decisions to preserve. Resume only affected domains — do not re-decompose resolved issues. Update plan, clear `## Rollback Notes`, direct user back to triggering skill.

**Triggering**:
- **Scope too large** (>15 issues or phases with unclear boundaries) → roll back to `/engineering`.
- **Underspecified** (missing file paths, acceptance criteria, or behavior specs) → roll back to `/engineering`.
- **Product gap** (missing user story or contradictory requirements) → roll back to `/engineering` (may cascade to `/product`).

Append trigger details and decisions to preserve to `## Rollback Notes` in `pipeline.md`.
