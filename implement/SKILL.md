---
name: implement
description: "TDD implementation of a single issue → working code. Reads issue file, orients in codebase, Red-Green-Refactor per acceptance criterion. Triggers: 'implement this,' 'build this issue,' 'start coding,' post-plan. Not for: test augmentation (test), code review (review), design (engineering)."
---

TDD implementation of issue files from `./issues/<feature>/NN-slug.md` → working code. Pipeline: plan → **implement** → test → review.

Phase: Build. User is technical.

## Starting

Accept an issue path directly, or list `./issues/*/` directories and ask via `AskUserQuestion` which feature, then list issue files and ask which issue.

Before coding:

1. Read the issue file completely. Extract: blocked-by, files to modify/create, patterns to follow, key types, wiring notes, acceptance criteria, verification commands.
2. **Check blocked-by.** For each blocker, verify it's done: check if acceptance criteria are checked off in the issue file, or look for the expected code/tests in the codebase. If blockers are incomplete → stop: "Issue `NN-slug.md` isn't done yet. Implement that first or run `/implement` on it."
3. **Orient.** Read every file listed in "Patterns to follow" (with line numbers). Read "Key types" signatures in source. Read all "Files to modify" to understand current state. Read `CLAUDE.md` and `AGENTS.md` for conventions.
4. Identify test runner, test file naming conventions, assertion patterns, and fixture patterns from existing tests near the files being modified.

Present orientation: "Issue `NN`: [title]. [N] files to modify, [N] to create. [N] acceptance criteria. Test pattern: [runner] in [convention]. Starting TDD cycle."

## TDD Cycle

For each acceptance criterion in order:

### Red

Write a failing test that encodes the criterion. Place it in the appropriate test file following discovered conventions. Run the test suite — confirm the new test fails. If it passes already, the criterion is already satisfied — note and move to next.

### Green

Write the minimal code to make the failing test pass. Follow patterns from the issue's "Patterns to follow" and "Key types" sections. Modify only files listed in the issue. Run the test suite — confirm all tests pass (new and existing).

### Refactor

With all tests green: clean up duplication, improve naming, extract obvious patterns — but only within the scope of this issue's files. Run tests again to confirm nothing broke.

Repeat for each acceptance criterion.

## Verify

After all criteria are implemented:

1. Run every command in the issue's `## Verification` section.
2. Run full lint, build, and test commands from `CLAUDE.md` or the issue's acceptance criteria.
3. Walk through `### Manual verification` steps — execute curl commands, check DB state, verify UI behavior as described.
4. Re-read each acceptance criterion checkbox — confirm every one is satisfied.

If verification fails: diagnose, fix within issue scope, re-run. If the fix requires changes outside issue scope → stop and report.

## Finish

1. Check off acceptance criteria in the issue file (replace `- [ ]` with `- [x]`).
2. Update `pipeline.md`: add row to `## Status` table (`| Implement | /implement | NN-slug.md done | <date> |`), append to `## Decisions Log` if any implementation decisions were made.
3. Suggest next steps: "Run `/implement` on the next unblocked issue, `/test` to augment coverage, or `/review` to review against specs."

## HITL Issues

For issues typed HITL: pause after completing each acceptance criterion. Use `AskUserQuestion`:
- "Criterion done — continue (Recommended)"
- "Adjust — let me give feedback"
- "Stop — I'll take over from here"

Show what was built (files changed, test results) before asking.

## Scope Guards

- **One issue per invocation.** Multiple issues? Implement the first, then: "Run `/implement` again for the next issue."
- **Stay in scope.** Don't refactor beyond issue boundaries. Don't add features not in acceptance criteria. Don't fix unrelated bugs found during implementation.
- **Don't design.** If the issue has ambiguous acceptance criteria or missing file paths, stop: "This issue is underspecified. Run `/plan` to revise it."
- **Don't skip tests.** Every acceptance criterion gets a test in the Red phase. No exceptions.

## Rollback

- **Untestable criteria** (no clear assertion, depends on external system with no mock pattern) → append `## Rollback Notes` to `pipeline.md`, direct to `/plan` to revise the issue.
- **Architecture mismatch** (issue's approach contradicts actual codebase structure) → append `## Rollback Notes` to `pipeline.md`, direct to `/engineering`.
- **Blocked-by incomplete** → stop, direct to implement the blocking issue first.
