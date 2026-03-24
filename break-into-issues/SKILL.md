---
name: break-into-issues
description: Decompose technical design into agent-sized implementation issues -> numbered markdown files. Triggers: "break into issues," "create tasks," "ready to implement," post-design-review. Not for: designs without file paths/phases (run design-feature first).
---

## Purpose

Decompose reviewed design into agent-sized implementation issues. Output: numbered markdown files in `./issues/<plan-name>/`.

Pipeline: plan-feature -> write-a-prd -> review-prd -> glossary -> (design-ux) -> design-feature -> review-plan -> **break-into-issues** -> agent implementation.

## Process

### 1. Locate and validate the plan

Ask user for plan file path or list `./plans/*.md` and ask.

Classify:
- **Technical design** (file paths, data models, phased build plan, decisions log): Proceed.
- **PRD** (user stories, FRs, no file paths/phases): Stop. "Run `/design-feature` first."
- **Scope doc** (feasibility, no implementation detail): Stop. "Run `/write-a-prd` then `/design-feature` first."
- **Simple fix plan** (specific file changes, no phases): Accept — produces 1-2 issues.

### 2. Read the codebase

1. Read `CLAUDE.md` and `AGENTS.md` for conventions and quality gates.
2. Read every source file referenced in the plan. For each: line count, key interfaces/types + line numbers, pattern landmarks (insertion points, code to follow), import paths.
3. For each new file the plan calls for, find the closest existing analog as "pattern reference."

This exploration is the main value-add — saves every implementing agent from re-doing it.

### 3. Decompose into slices

Break into **vertical slices** (tracer bullets). Each issue is thin end-to-end, NOT a horizontal layer.

**Sizing**: 1-6 files ideal (>8 split). 1-2 layers ideal. Zero design decisions (all resolved). New patterns (first file upload, first cron job) get own issue. Each issue includes its own tests.

**Splitting**: Schema can share with repo/service but NOT UI. UI depends on API, never reverse. Cross-cutting concerns (email, notifications, cron) get own issues after the code they wire into. Quality-gate-only phases get absorbed into final issue.

Classify each: **AFK** (agent implements autonomously) or **HITL** (needs human review — UX layout, visual design, open tradeoffs).

### 4. Present the breakdown

Show table and ask for approval:

```
I've read [plan-name] and explored the referenced files:

| # | Title | Files | Depends on | Type | Parallel with |
|---|-------|-------|-----------|------|--------------|
| 1 | Schema + repo + service | 6 | — | AFK | — |
| 2 | API routes | 3 | #1 | AFK | #4 |

[Max 3 targeted questions using AskUserQuestion if genuine ambiguities.]

Approve this breakdown?
```

If unambiguous: "No questions — the design resolves all decisions. Approve?"

Iterate until approved.

### 5. Generate issue files

Create `./issues/<plan-name>/` (kebab-case from plan title).

Write `00-overview.md` first, then each issue in dependency order.

#### Naming: `00-overview.md`, `01-<slug>.md`, `02-<slug>.md`, ... Slugs: 2-4 word kebab-case.

#### Overview template

```markdown
# Issues: <Plan Title>

> Generated from [<plan-file>](<path>) on <date>
> Total issues: <N>

## Dependency graph

​```mermaid
graph TD
  I1["01: Title"] --> I2["02: Title"]
​```

## Execution order

| Order | Issue | Parallel with | Scope |
|-------|-------|--------------|-------|
| 1 | 01-slug.md | — | N files, N layers |

## Plan coverage

| Design phase / section | Issue |
|----------------------|-------|
| Phase 1: <name> | 01-slug.md |
```

#### Issue template

```markdown
# <Title>

> Part of: [<plan-name>](<path>)
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

### 6. Finish

Print overview table. Note AFK vs HITL. Suggest: "To start, hand `01-...` to an agent. Parallelizable issues can run concurrently in separate worktrees."
