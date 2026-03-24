---
name: break-into-issues
description: Break a technical design into agent-sized implementation issues, output as numbered markdown files. Use when user wants to decompose a plan into issues, create agent tasks from a design, convert a plan to implementable tickets, break a design into work items, or mentions "break into issues." This is the step AFTER design-feature and review-plan — it turns a reviewed technical design into issues an AI agent can pick up and implement in a single context window. Also trigger when the user has just finished a design review and says something like "ok let's break this down" or "create the issues" or "ready to implement."
---

# Break Into Issues

Decompose a reviewed technical design into implementation issues. Each issue is scoped for a single AI agent context window — all file paths, patterns, types, and acceptance criteria are front-loaded so the implementing agent can work autonomously without extensive codebase exploration.

Output is numbered markdown files in `./issues/<plan-name>/`, not GitHub issues.

## Pipeline Position

This skill sits at the end of the planning pipeline:

plan-feature → write-a-prd → review-prd → glossary → design-feature → review-plan → **break-into-issues** → agent implementation

By this point, all design decisions should be resolved. If they aren't, the input isn't ready.

## Process

### 1. Locate and validate the plan

Ask the user for the plan file path. If not provided, list `./plans/*.md` and ask which one to decompose.

Read the plan and classify it:

- **Technical design** (has file paths, data models, phased build plan, decisions log): Proceed.
- **PRD** (has user stories and functional requirements but no file paths or phased build): Stop. Tell the user: "This is a PRD without a technical design. Run `/design-feature` first to produce a technical design, then come back here."
- **Scope doc** (has feasibility assessment but no implementation detail): Stop. Tell the user: "This is a scope assessment. Run `/write-a-prd` then `/design-feature` first."
- **Simple fix plan** (has specific file changes but no phases): Accept — this will produce 1-2 issues.

### 2. Read the codebase

Read the plan thoroughly, then:

1. Read `CLAUDE.md` and `AGENTS.md` for project conventions and quality gates.
2. Read every source file referenced in the plan. For each file, note:
   - Line count
   - Key interfaces, types, and their line numbers
   - Pattern landmarks — where new code would be inserted and what existing code to follow
   - Import paths the implementing agent will need
3. For each new file the plan calls for, find the closest existing analog in the codebase. This becomes the "pattern reference" in the issue.

This exploration is the skill's main value-add. The time spent here saves every implementing agent from re-doing the same exploration.

### 3. Decompose into slices

Break the design into **vertical slices** (tracer bullets). Each issue is a thin end-to-end slice, NOT a horizontal layer.

<sizing-rules>
Use these heuristics to judge whether a slice is the right size for one agent context window:

- **File count**: 1-6 files is ideal. Over 8 is a signal to split.
- **Layer span**: 1-2 layers is ideal (e.g., repo + service, or route + UI). All 4 layers (schema, repo/service, route, UI) in one issue is OK only when changes in each layer are small and mechanical.
- **Decision count**: Zero. The design should have resolved all decisions. If the agent would need to choose between approaches, the issue is underspecified — go back to the design.
- **Pattern novelty**: If an issue introduces a pattern not yet in the codebase (first file upload, first cron job, first email template), it gets its own focused issue even if it's small. New patterns consume disproportionate context.
- **Test scope**: Each issue includes its own tests. If writing the tests requires understanding code outside the issue's scope, the issue is too broad.
</sizing-rules>

<splitting-rules>
- Schema changes can share an issue with the repo/service code that uses them, but NOT with UI code.
- UI issues depend on API issues, never the reverse.
- Cross-cutting concerns (email, notifications, cron) go in their own issues, placed after the code they wire into.
- If the design has a "quality gates" phase that is just running lint/build/test, absorb it into the final issue — it is not a standalone issue.
</splitting-rules>

Classify each slice:

- **AFK**: Agent can implement autonomously. No human judgment needed, no UX decisions, no architectural choices. Prefer this.
- **HITL**: Needs human review — e.g., UX layout decisions, visual design, choosing between acceptable tradeoffs the design left open.

### 4. Present the breakdown

Show a table and ask for approval:

```
I've read [plan-name] and explored the referenced files. Here's the breakdown:

| # | Title | Files | Depends on | Type | Parallelizable with |
|---|-------|-------|-----------|------|-------------------|
| 1 | Schema + repo + service | 6 | — | AFK | — |
| 2 | API routes | 3 | #1 | AFK | #4 |
| 3 | Profile edit page | 2 | #2 | AFK | #5 |
| 4 | Ballot display | 6 | #1 | AFK | #2 |
| 5 | Email + notification | 4 | #2 | AFK | #3 |

[If there are genuine ambiguities, ask max 3 targeted questions here using the `AskUserQuestion` tool with concrete options.]

Approve this breakdown?
```

If the plan is unambiguous, skip questions: "No questions — the design resolves all decisions. Approve?"

Iterate until the user approves.

### 5. Generate issue files

Create the output directory: `./issues/<plan-name>/` (kebab-cased from the plan's title).

Write `00-overview.md` first, then each issue file in dependency order.

#### Naming convention

```
./issues/<plan-name>/
  00-overview.md
  01-<slug>.md
  02-<slug>.md
  ...
```

Numbering reflects a valid execution order (respecting dependencies). Slugs are 2-4 word kebab-case descriptions.

#### Overview file template

```markdown
# Issues: <Plan Title>

> Generated from [<plan-file>](<relative-path-to-plan>) on <date>
> Total issues: <N>

## Dependency graph

​```mermaid
graph TD
  I1["01: Title"] --> I2["02: Title"]
  I1 --> I4["04: Title"]
  I2 --> I3["03: Title"]
​```

## Execution order

| Order | Issue | Can run in parallel with | Scope |
|-------|-------|------------------------|-------|
| 1 | 01-schema-repo-service.md | — | 6 files, 2 layers |
| 2 | 02-api-routes.md | 04-ballot-display.md | 3 files, 1 layer |

## Plan coverage

| Design phase / section | Issue |
|----------------------|-------|
| Phase 1: Data model | 01-schema-repo-service.md |
| Phase 2: API layer | 02-api-routes.md |
```

#### Issue file template

Use this template for each issue. The Context section is the most important part — it's what lets the implementing agent skip exploration and start coding immediately.

```markdown
# <Title>

> Part of: [<plan-name>](<relative-path-to-plan>)
> Issue: <N> of <total>
> Type: AFK | HITL

## Blocked by

- [01-schema-repo-service.md](./01-schema-repo-service.md) — needs `candidates` table columns and `updateProfile` service method
- Or: None — can start immediately.

## What to build

<2-4 sentences describing the concrete deliverable. Not "implement profile editing" but "Add a PATCH endpoint at `/api/elections/:id/candidates/:candidateId/profile` that accepts `{ bio, headline }`, validates via CandidacyService.updateProfile, and returns 204. Wire auth guard to require candidate role on this election.">

## Files to modify

| File | What changes |
|------|-------------|
| `src/server/candidacy/repository.ts` | Add `updateProfile` method after existing `updateStatus` (line ~50) |
| `src/server/candidacy/service.ts` | Add `updateProfile` with auth + election-status guards |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `src/app/api/elections/[id]/candidates/[candidateId]/profile/route.ts` | PATCH endpoint | Follow `src/app/api/elections/[id]/candidates/[candidateId]/route.ts` |

## Context

### Patterns to follow

<Reference 2-3 specific files with line numbers. The implementing agent should read these before coding.>

Example: "The `updateStatus` method in `src/server/candidacy/repository.ts:50` shows the exact pattern — Effect.gen, Db dependency, returning the updated row. Follow this for `updateProfile`."

### Key types

<Copy the exact type signatures the agent will consume or produce. Don't make the agent grep for these.>

```typescript
// From src/server/db/schema.ts:238
export const candidates = pgTable("candidates", {
  // ... existing columns
});
```

### Wiring notes

<If the issue requires layer composition changes — adding to a Layer.provide chain, updating an appLayer, etc. — spell it out explicitly.>

## Acceptance criteria

- [ ] PATCH `/api/elections/:id/candidates/:candidateId/profile` with `{ bio }` returns 204
- [ ] Unauthorized requests return 401
- [ ] Non-candidate users return 403
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
bun run lint
bun run build
bun run test
```

### Manual verification

<Steps to verify manually, e.g., curl commands, UI interactions, or database checks.>

## Notes

<Edge cases, gotchas, things the implementing agent should watch for. Omit if none.>
```

### 6. Finish

After generating all files:

1. Print the overview table.
2. Note which issues are AFK vs HITL.
3. Suggest next steps: "To start implementation, hand `01-...` to an agent. Issues marked as parallelizable can run concurrently in separate worktrees."
