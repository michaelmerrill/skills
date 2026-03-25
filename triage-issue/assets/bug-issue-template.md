<!-- Template for triage-issue skill. Save as ./issues/bugs/<slug>.md -->

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
