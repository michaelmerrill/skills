---
name: plan
description: "Decompose technical design into agent-sized implementation issues → numbered markdown files. Triggers: 'plan this,' 'break into issues,' 'create tasks,' 'ready to implement,' post-architect. Not for: designs without file paths/phases (run architect first)."
---

## Purpose

Decompose reviewed design into agent-sized implementation issues. Output: `## Implementation Plan` section in the living doc + numbered markdown files in `./issues/<feature-name>/`.

Pipeline: explore → define → [design] → architect → **plan** → agent implementation.

Phase: Engineering. User is technical.

## Process

### 1. Locate and validate the living doc

Ask user for living doc path or list `./plans/*.md` and ask.

Validate by checking for `## Technical Design` with `### Phased Build Plan`:
- **Has Technical Design + Phased Build Plan**: Proceed.
- **Has Requirements but no Technical Design**: Stop. "Run `/architect` first."
- **Has Scope only**: Stop. "Run `/define` then `/architect` first."
- **Simple fix plan** (specific file changes, no phases): Accept — produces 1-2 issues.

#### Rollback triggers

During validation or decomposition, if a rollback is needed: append to `## Rollback Notes` in the living doc with trigger, affected architect domains, and decisions to preserve. Then direct user to the target skill.
- **Scope too large** (>15 issues or phases with unclear boundaries): roll back to `/architect`. Trigger includes: issue count estimate, which phases are too broad.
- **Underspecified** (missing file paths, acceptance criteria, or behavior specs): roll back to `/architect`. Trigger includes: which sections are underspecified.
- **Product gap** (missing user story or contradictory requirements): roll back to `/architect` (which may cascade to `/define`).

### 2. Read the codebase

1. Read `CLAUDE.md` and `AGENTS.md` for conventions and quality gates.
2. Read every source file referenced in the design. For each: line count, key interfaces/types + line numbers, pattern landmarks (insertion points, code to follow), import paths.
3. For each new file the plan calls for, find the closest existing analog as "pattern reference."

This exploration is the main value-add — saves every implementing agent from re-doing it.

### 3. Decompose into slices

Break into **vertical slices** (tracer bullets). Each issue delivers one working capability through all layers it touches — schema + service + route + UI together when they serve one feature.

**Anti-pattern — horizontal layers**: Issue 1 = "all schema tables", Issue 2 = "all services", Issue 3 = "all UI pages". Also bad: splitting "template service" and "template UI" into separate issues — same capability, should be one issue. Instead: Issue 1 = "template CRUD" (schema + service + settings UI), Issue 2 = "public signing" (page + action + customer linking). Each issue is a thin vertical thread, not a thick horizontal slab.

**Foundation exception**: A schema-only issue is acceptable when its tables serve 3+ downstream issues (shared migration). Otherwise merge schema into its first consuming capability.

**Sizing**: Target 1-6 files per issue, hard cap at 8. If an issue exceeds 6, first check whether it can be split by feature boundary (not by layer). If splitting would break vertical integrity, keep it together. Zero design decisions (all resolved). New patterns (first file upload, first cron job) get own issue. Each issue includes its own tests.

**Splitting**: A capability's service and UI belong in the same issue — never split them by layer. UI depends on API, never reverse. Cross-cutting concerns (email, notifications, cron) get own issues after the code they wire into. Quality-gate-only phases get absorbed into final issue. When a design phase spans multiple user-facing capabilities, split by capability, not by schema/service/UI.

Classify each: **AFK** (agent implements autonomously) or **HITL** (needs human review — UX layout, visual design, open tradeoffs).

### 4. Present the breakdown

Show table and ask for approval:

```
I've read the living doc and explored the referenced files:

| # | Title | Files | Depends on | Type | Parallel with |
|---|-------|-------|-----------|------|--------------|
| 1 | Template CRUD (schema + service + settings UI) | 6 | — | AFK | — |
| 2 | Public signing page (route + action + customer link) | 5 | #1 | AFK | #3 |

[Max 3 targeted questions using AskUserQuestion if genuine ambiguities.]

Approve this breakdown?
```

If unambiguous: "No questions — the design resolves all decisions. Approve?"

Iterate until approved.

### 5. Generate issue files

Create `./issues/<feature-name>/` (kebab-case from living doc filename).

Write each issue in dependency order. No `00-overview.md` — that content goes in the living doc's `## Implementation Plan` section.

#### Naming: `01-<slug>.md`, `02-<slug>.md`, ... Slugs: 2-4 word kebab-case.

#### Issue template

```markdown
# <Title>

> Part of: [<feature-name>](../../plans/<feature-name>.md)
> Issue: <N> of <total>
> Type: AFK | HITL

## Blocked by

- [01-slug.md](./01-slug.md) — needs <specific dependency>
- Or: None — can start immediately.

## What to build

<2-4 sentences: concrete deliverable with endpoint paths, method names, guard requirements — not vague summaries.>

## Files to modify

| File | What changes |
|------|-------------|
| `path/to/file.ts` | Add `methodName` after existing `otherMethod` (line ~N) |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `path/to/new.ts` | <purpose> | Follow `path/to/existing.ts` |

## Context

### Patterns to follow
<2-3 specific files with line numbers the implementing agent should read before coding.>

### Key types
<Exact type signatures the agent will consume or produce. Don't make the agent grep for these.>

### Wiring notes
<Layer composition changes — adding to provide chains, updating layers, etc. Omit if none.>

## Acceptance criteria

- [ ] <specific testable criterion>
- [ ] `<lint command>` passes
- [ ] `<build command>` passes
- [ ] `<test command>` passes

## Verification

```bash
<quality gate commands>
```

### Manual verification
<Steps to verify manually — curl commands, UI interactions, DB checks. Omit if none.>

## Notes

<Edge cases, gotchas. Omit if none.>
```

### 6. Write Implementation Plan section

Write `## Implementation Plan` into the living doc with dependency graph, execution order, and plan coverage.

```markdown
## Implementation Plan

### Dependency Graph

​```mermaid
graph TD
  I1["01: Title"] --> I2["02: Title"]
​```

### Execution Order

| Order | Issue | Parallel with | Scope |
|-------|-------|--------------|-------|
| 1 | 01-slug.md | — | N files, N layers |

### Plan Coverage

| Design phase / section | Issue |
|----------------------|-------|
| Phase 1: <name> | 01-slug.md |
```

Update `## Pipeline Status` with plan row.

### 7. Finish

Print overview table. Note AFK vs HITL. Suggest: "To start, hand `01-...` to an agent. Parallelizable issues can run concurrently in separate worktrees."
