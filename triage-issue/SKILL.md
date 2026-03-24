---
name: triage-issue
description: "Investigate bug -> root cause analysis -> issue file with TDD fix plan. Triggers: 'bug,' 'broken,' 'not working,' 'regression,' 'error,' 'triage this.' Not for: new features (plan-feature), technical design (design-feature), code review."
---

## Purpose

Bug investigation -> root cause analysis -> issue file with TDD fix plan. Parallel track to the feature pipeline -- for defects, not capabilities.

Feature pipeline: plan-feature -> write-a-prd -> ... -> break-into-issues.
Bug track: **triage-issue** -> agent implementation.

Output: `./issues/bugs/<slug>.md`

## Starting

Accept the user's bug report -- symptom, error message, reproduction steps, or just "X is broken."

Before asking anything:

1. **Parse the symptom.** Extract: what's broken, error messages, reproduction context, affected area.
2. **Locate affected code.** Search for: error messages in source, relevant route/handler/component, related test files.
3. **Trace the code path.** From entry point (route, event handler, CLI command) through to where the failure occurs. Read each file in the path.
4. **Check recent changes.** Run `git log --oneline -20 -- <affected-files>` to identify commits that may have introduced the bug.
5. **Read existing tests.** Find test files covering the affected code path. Note: are there tests? Do they cover the failing case? Are any currently failing?
6. **Check for related work.** Search for TODO/FIXME/HACK comments near affected code. Check `./issues/` for related open work.

After investigation, present findings before asking anything:

> I've traced the issue. [Symptom] appears to originate in `[file]` at `[function/line]`. Recent changes by `[commit]` modified this path. Here's what I found: [diagnosis].

Then confirm with the user via `AskUserQuestion`:
- "Correct -- write the issue (Recommended)"
- "Partially right -- let me clarify"
- "Wrong -- let me redirect you"

## Investigation Protocol

Investigation-first, interview-light. The codebase is the primary witness; the user confirms or redirects.

### Investigation phases

Work through sequentially. Each phase may resolve the issue or reveal what to investigate next.

1. **Symptom mapping** -- What observable behavior is wrong? Map symptom to code location. If user provided an error message, search for it verbatim.
2. **Code path tracing** -- Read the execution path from trigger to failure. Identify where expected behavior diverges from actual.
3. **Root cause isolation** -- Distinguish symptom from cause. Is the bug in this function, or does it receive bad input from upstream? Trace until you find the originating defect.
4. **Blast radius assessment** -- What else does this code path affect? Other callers of the broken function? Could the fix have side effects?
5. **Fix feasibility** -- Is the fix localized (1-3 files) or systemic? Does it require new tests, migration, or behavioral changes?

### Asking questions

Minimize interaction. Ask only when:
- Reproduction path is ambiguous (multiple ways to trigger the symptom)
- Root cause has two equally plausible explanations
- Expected behavior is genuinely unclear (no tests, no docs, no obvious convention)
- Environment-specific factors can't be determined from code

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Max 3 questions total -- if you need more, your investigation needs more depth, not more interview.

## Classification & Routing

After investigation, classify:

### Bug (stay in triage track)

Code does not do what it was designed to do. Evidence: existing tests should catch it but don't, behavior contradicts docs/comments, recent regression.

**Action**: Create issue file with TDD fix plan.

### Missing feature disguised as bug

User expected behavior that was never built. Evidence: no tests exist because the behavior was never specified, no code path exists for the scenario.

**Simple** (1-3 files, clear pattern to follow): Create issue file with TDD fix plan. Note in the issue that this is net-new behavior, not a regression.

**Complex** (new capability, multiple files, design decisions needed): "This looks like a missing feature rather than a bug -- [explanation]. I'd recommend `/plan-feature` to scope it properly."

### Systemic issue requiring design

Root cause is architectural -- the fix requires new patterns, significant refactoring, or touches 8+ files.

**Action**: "The root cause is systemic: [explanation]. A point fix would be fragile. I'd recommend `/design-feature` to design the proper solution." Create a lightweight issue documenting the investigation findings so the design has a head start.

## Issue Template

Save to `./issues/bugs/<slug>.md`. Use kebab-case slug derived from the symptom (e.g., `login-timeout-on-slow-networks.md`).

```markdown
# Bug: <Concise title -- symptom, not cause>

## Symptom

<What the user observes. Include error messages verbatim.>

## Reproduction

1. <Step>
2. <Step>
3. <Observe: [broken behavior]>

**Expected**: <what should happen>
**Actual**: <what happens instead>

## Root Cause

<Technical explanation. Reference specific files, functions, line numbers.>

**Originating defect**: `<file>:<function>` -- <what's wrong>
**Introduced by**: <commit hash if identifiable, otherwise "pre-existing">

## Blast Radius

- <Other code paths affected>
- <Other user-facing behaviors impacted>
- <Data integrity concerns, if any>

## Fix Plan (TDD)

### 1. Add failing test

| File | Test description |
|------|-----------------|
| `<test-file>` | <Concrete test: given [setup], when [action], expect [result]. Currently fails because [reason].> |

### 2. Implement fix

| File | What changes |
|------|-------------|
| `<file>` | <Specific change -- e.g., "Add null check before accessing `user.org.id` at line ~N"> |

### 3. Verify

<test command targeting the specific test>
<broader test suite command to check for regressions>
<lint/build command>

## Context

### Files to read before fixing
- `<file>` -- <brief reason>

### Related code
- <Callers, dependents, or similar patterns relevant to the fix>
```

## Scope Guards

### Stay in triage
- **One bug per invocation.** If user describes multiple bugs, triage the first, then: "I've filed that one. Describe the next bug and I'll triage it separately."
- **Don't design solutions.** The fix plan is tactical -- minimal change to correct the defect. Architectural improvements go through `/design-feature`.
- **Don't implement the fix.** Output is the issue file, not the code change.

### Redirect
- Feature request: "This is new behavior, not a bug. Run `/plan-feature`."
- Systemic issue: "This needs a design. Run `/design-feature`. I'll create a lightweight issue with my investigation findings."
- Vague report with no reproducible symptom: Ask for reproduction steps. If user can't provide them, create a lightweight issue with what you found and mark it "needs-reproduction."

## After Delivering

After writing the issue file: "Issue saved to `./issues/bugs/<slug>.md`. The fix plan starts with a failing test in `<test-file>`. Hand this to an agent or start with the test."

Answer follow-up questions about the root cause or fix approach. If user wants to expand the fix scope: "That's beyond a bug fix -- run `/design-feature` with this issue as context."
