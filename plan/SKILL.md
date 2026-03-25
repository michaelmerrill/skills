---
name: plan
description: "Decompose technical design into agent-sized implementation issues → numbered markdown files. Triggers: 'plan this,' 'break into issues,' 'create tasks,' 'ready to implement,' post-architect. Not for: designs without file paths/phases (run architect first)."
---

Decompose reviewed design into agent-sized implementation issues → `## Implementation Plan` section in the living doc + numbered issue files in `./issues/<feature-name>/`.

Pipeline: explore → define → [design] → architect → **plan** → agent implementation.

Phase: Engineering. User is technical.

## Starting

Ask user for living doc path or list `./plans/*.md` and ask.

If `## Rollback Notes` has content: this takes priority. Read notes, skip validation, resume only affected domains, clear after resolving.

Validate by checking for `## Technical Design` with `### Phased Build Plan`:
- **Has Technical Design + Phased Build Plan**: Proceed.
- **Has Requirements but no Technical Design**: Stop. "Run `/architect` first."
- **Has Scope only**: Stop. "Run `/define` then `/architect` first."
- **Simple fix plan** (specific file changes, no phases): Accept — produces 1-2 issues.

## Process

### 1. Read the codebase

1. Read `CLAUDE.md` and `AGENTS.md` for conventions and quality gates.
2. Read every source file referenced in the design. For each: line count, key interfaces/types + line numbers, pattern landmarks (insertion points, code to follow), import paths.
3. For each new file the plan calls for, find the closest existing analog as "pattern reference."

### 2. Decompose into vertical slices

Break into **vertical slices** (tracer bullets). Each issue delivers one working capability through all layers it touches — schema + service + route + UI together when they serve one feature.

**Anti-pattern — horizontal layers**: Issue 1 = "all schema tables", Issue 2 = "all services", Issue 3 = "all UI pages". Also bad: splitting "template service" and "template UI" into separate issues — same capability, should be one issue. Instead: Issue 1 = "template CRUD" (schema + service + settings UI), Issue 2 = "public signing" (page + action + customer linking). Each issue is a thin vertical thread, not a thick horizontal slab.

**Foundation exception**: A schema-only issue is acceptable when its tables serve 3+ downstream issues (shared migration). Otherwise merge schema into its first consuming capability.

**Sizing**: 1-6 files per issue, hard cap 8. If exceeding 6, split by feature boundary — not by layer. A capability's service and UI belong in the same issue. Cross-cutting concerns (email, notifications, cron) get own issues after the code they wire into. Each issue includes its own tests. Zero design decisions remaining.

Classify each: **AFK** (agent implements autonomously) or **HITL** (needs human review — UX layout, visual design, open tradeoffs).

### 3. Present breakdown

Show table with columns: #, Title, Files, Depends on, Type, Parallel with. Ask for approval via `AskUserQuestion`. Max 3 targeted questions if genuine ambiguities exist.

If unambiguous: "No questions — the design resolves all decisions. Approve?"

Iterate until approved.

### 4. Generate issues

Create `./issues/<feature-name>/` (kebab-case from living doc filename). Write each issue in dependency order using the template in `assets/issue-template.md`. No `00-overview.md` — that content goes in the living doc.

### 5. Write Implementation Plan

Write `## Implementation Plan` into the living doc using the template in `assets/implementation-plan-template.md`. Update `## Pipeline Status` with plan row.

### 6. Finish

Print overview table. Note AFK vs HITL. Suggest: "To start, hand `01-...` to an agent. Parallelizable issues can run concurrently in separate worktrees."

## Rollback

**Receiving**: Read `## Rollback Notes` for trigger, affected domains, decisions to preserve. Resume only affected domains — do not re-decompose resolved issues. Update plan, clear `## Rollback Notes`, direct user back to triggering skill.

**Triggering**:
- **Scope too large** (>15 issues or phases with unclear boundaries) → roll back to `/architect`.
- **Underspecified** (missing file paths, acceptance criteria, or behavior specs) → roll back to `/architect`.
- **Product gap** (missing user story or contradictory requirements) → roll back to `/architect` (may cascade to `/define`).

Append trigger details and decisions to preserve to `## Rollback Notes` in the living doc.
