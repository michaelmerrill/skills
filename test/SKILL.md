---
name: test
description: "Augment test coverage post-implementation → integration, e2e, and edge-case tests. Reads tdd.md testing strategy, finds gaps in existing tests. Triggers: 'add tests,' 'test coverage,' 'write integration tests,' post-implement. Not for: TDD during implementation (implement), code review (review), test strategy design (engineering)."
---

Augment test coverage after implementation → integration, e2e, and edge-case tests. Pipeline: implement → **test** → review.

Phase: Build. User is technical.

## Starting

Accept feature name or issue reference. If ambiguous, list `./plans/*/` and ask via `AskUserQuestion`.

Before writing tests:

1. Read `tdd.md` — extract `## Testing Strategy` tables (unit/integration/e2e with components, what to test, approach). Extract `## Edge Cases & Failure Modes` table.
2. Read `plan.md` to understand issue boundaries and which issues are implemented.
3. Read `spec.md` for user flows (happy + error paths) if UI is involved.
4. Read `prd.md` for NFRs that imply performance or load test stubs.

## Discover Existing Tests

Find all test files written during `/implement` for this feature. Catalog what's covered:
- Which acceptance criteria have unit tests
- Which modules/files have test coverage
- Test runner, assertion library, fixture patterns, mock patterns in use

## Gap Analysis

Compare tdd.md testing strategy against actual tests. Identify gaps in order of priority:

1. **Integration boundaries** — Tests that cross issue boundaries: API → service → DB round-trips, multi-module interactions, event chains. These are the highest-value gaps because `/implement` works one issue at a time.
2. **E2e user flows** — Full flows from spec.md: happy path end-to-end, critical error paths, multi-step user journeys.
3. **Edge cases** — From tdd.md `## Edge Cases & Failure Modes`: each row with severity critical/warning that lacks a test.
4. **Error paths** — Failure modes from tdd.md behavior specs: network errors, validation failures, permission denials, concurrent access.
5. **NFR stubs** — Performance baselines, rate limit verification, data volume tests from prd.md NFRs. Write as skipped/pending tests with clear TODOs if infrastructure isn't available.

Present gap analysis: "Found [N] existing test files covering [N] acceptance criteria. Gaps: [N] integration, [N] e2e, [N] edge cases. Writing [N] test files."

## Write Tests

For each gap, in priority order:

1. Follow existing test patterns exactly — same runner, assertion style, file naming, directory structure, fixture approach.
2. Write the test file. Run it immediately — confirm it passes. Tests here validate already-implemented behavior, so they should pass. A failing test means either a bug or a wrong test.
3. If a test reveals a bug: **report it, don't fix it.** Note the failing test and suggest `/triage-issue` or a new `/implement` invocation.

Group tests by type:
- Integration tests near the modules they bridge
- E2e tests in the project's e2e test directory (discover from existing patterns)
- Edge case tests alongside existing unit test files for the same module

## Finish

1. Run the full test suite — confirm all tests pass (new and existing).
2. Present coverage summary: tests added per category, remaining gaps (if any need manual/external testing infrastructure).
3. Update `pipeline.md`: add row to `## Status` table (`| Test | /test | <N> tests added | <date> |`).
4. Suggest: "Run `/review` to review the implementation against specs."

## Scope Guards

- **Don't modify implementation code.** Tests only. If a test can't be written without code changes, report the gap.
- **Don't duplicate.** Skip tests that already exist from `/implement`'s TDD cycle. Augment, don't repeat.
- **One feature per invocation.** Can cover all issues in a feature, but only one feature.
- **Bug discovery → report, don't fix.** Note the test, the failure, and the likely cause. Suggest `/triage-issue`.
