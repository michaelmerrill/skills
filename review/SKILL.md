---
name: review
description: "Code review against upstream specs → Approve / Request Changes / Rethink. Traces implementation to FRs, ADRs, spec flows. Triggers: 'review this,' 'check the implementation,' 'does this match the design,' post-implement. Not for: implementation (implement), test writing (test), design review (engineering)."
---

Code review of implementation against upstream specs → verdict. Pipeline: implement → test → **review**.

Phase: Build. User is technical.

## Starting

Accept feature name, issue reference, or branch/commit range. If ambiguous, list `./plans/*/` and ask via `AskUserQuestion`.

Before reviewing:

1. Read upstream docs: `prd.md` (FRs, stories, acceptance criteria), `spec.md` (flows, screens, states, a11y), `tdd.md` (ADRs, APIs, behavior specs, edge cases, security, observability, code design), `plan.md` (issue breakdown).
2. Read the issue file(s) being reviewed — extract acceptance criteria, files to modify/create.
3. **Collect changes.** Read every file listed in the issue's "Files to modify" and "Files to create." If a git branch or commit range is available, use `git diff` to see the full changeset. Note: review the actual code, not just the diff.

## Review Passes

Work silently — user sees only the verdict. Run four passes:

### 1. Requirements Trace

For each FR and story from `prd.md` that this issue addresses (listed in issue's `## Requirements addressed`):
- Does the code implement the requirement completely?
- Are all acceptance criteria from the issue satisfied in the code?
- Flag: missing requirements, partial implementations, requirements addressed differently than specified.

### 2. Architecture Conformance

Check against `tdd.md`:
- **ADRs**: Are architecture decisions followed? (e.g., if ADR says "use repository pattern," does the code?)
- **API contracts**: Do endpoints, request/response shapes, error responses match `## API Contracts`?
- **Data models**: Do schema changes match `## Data Models`?
- **Code design**: Does dependency direction match `## Code Design & Boundaries`? Are specified interfaces implemented?
- **Behavior specs**: Does code behavior match `## Behavior Specs` trigger → steps → result?

### 3. Spec Compliance

If `spec.md` exists and this issue touches UI:
- Do user flows match spec's happy + error paths?
- Are screen states handled (empty, loading, error, permission-denied)?
- Are accessibility requirements met (focus, keyboard, screen reader)?
- Does responsive behavior match breakpoint table?

Skip this pass for backend-only issues.

### 4. Code Quality

Apply review lenses from `references/review-lenses.md`. Additionally check:
- Edge cases from `tdd.md` `## Edge Cases & Failure Modes` — are mitigations implemented?
- Security model from `tdd.md` `## Security Model` — auth, permissions, input validation, trust boundaries.
- Observability from `tdd.md` `## Observability` — are specified logging events and metrics present?
- Test quality — do tests actually assert the right behavior, or are they superficial?

## Verdict

Scale response to severity — clean implementation gets short review.

### Approve

No blocking issues. Minor suggestions (style, naming) are noted but don't block.

"Implementation matches specs. [1-2 sentence summary of what was reviewed and confirmed.]"

Update `pipeline.md`: add row to `## Status` table (`| Review | /review | Approve — NN-slug.md | <date> |`).

Suggest: "Run `/implement` on the next issue, or `/publish-linear` to sync progress."

### Request Changes

Blocking issues found. Present findings severity-ordered:

For each finding:
- **File + location** (file path, function/line)
- **What's wrong** (observed behavior or code pattern)
- **What spec says** (reference to specific section in tdd.md/prd.md/spec.md)
- **Suggested fix** (concrete, actionable)

Use `AskUserQuestion` to walk through findings:
- "Fix all and re-review (Recommended)"
- "Discuss specific findings"
- "Accept as-is — override review"

If user chooses to fix: re-read changed files after fixes, re-run affected review passes only, issue updated verdict.

### Rethink

Implementation diverges fundamentally from design — wrong architecture, missing core capability, or solving the wrong problem.

Append `## Rollback Notes` to `pipeline.md` with trigger and affected domains. Direct upstream:
- Architecture mismatch → `/engineering`
- Requirements mismatch → `/plan` (may cascade to `/product`)
- Scope mismatch → `/scope`

## Scope Guards

- **Review only — don't modify code.** Findings are reported, not fixed (unless user explicitly asks via Request Changes flow).
- **One issue or related issue set per invocation.** For full-feature review, run once per issue or once for all issues in a feature.
- **Don't expand scope.** Review what was built against what was specified. Don't suggest new features or improvements beyond the specs.
- **Don't re-review.** If an issue was already reviewed and approved, skip it unless the user explicitly asks for re-review.
