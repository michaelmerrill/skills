---
name: triage-issue
description: "Investigate bug -> root cause analysis -> issue file with TDD fix plan. Triggers: 'bug,' 'broken,' 'not working,' 'regression,' 'error,' 'triage this.' Not for: new features (explore), technical design (architect), code review."
---

Bug investigation -> root cause -> issue file with TDD fix plan. Parallel track to the feature pipeline -- for defects, not capabilities.

Output: `./issues/bugs/<slug>.md`

## Starting

Accept the bug report -- symptom, error message, repro steps, or just "X is broken."

Before asking anything:

1. **Parse symptom & locate code.** Extract what's broken, error messages, affected area. Search for error messages in source, find relevant handlers/components and test files.
2. **Trace the code path.** From entry point through to failure. Read each file in the path.
3. **Check history & tests.** `git log --oneline -20 -- <affected-files>` for recent changes. Find test files covering the path -- do they exist? Do they cover the failing case?
4. **Check related work.** Search for TODO/FIXME/HACK near affected code. Check `./issues/` for related open work.

Present findings before asking anything:

> I've traced the issue. [Symptom] originates in `[file]` at `[function/line]`. Recent changes by `[commit]` modified this path. Here's what I found: [diagnosis].

Confirm via `AskUserQuestion`:
- "Correct -- write the issue (Recommended)"
- "Partially right -- let me clarify"
- "Wrong -- let me redirect you"

## Investigation

Investigation-first, interview-light. The codebase is the primary witness; the user confirms or redirects.

Work through sequentially:

1. **Symptom mapping** -- Map observable broken behavior to code location. Search error messages verbatim.
2. **Code path tracing** -- Read execution path from trigger to failure. Identify where expected diverges from actual.
3. **Root cause isolation** -- Distinguish symptom from cause. Trace upstream until you find the originating defect.
4. **Blast radius** -- What else does this code path affect? Other callers? Could the fix have side effects?
5. **Fix feasibility** -- Localized (1-3 files) or systemic? Needs new tests, migration, or behavioral changes?

Minimize questions. Ask only when repro is ambiguous, root cause has equally plausible explanations, expected behavior is genuinely unclear, or environment factors can't be determined from code.

Use `AskUserQuestion` for every question (see CLAUDE.md conventions). Max 3 questions total.

## Classification

After investigation, classify:

**Bug** -- Code doesn't do what it was designed to do (tests should catch it but don't, behavior contradicts docs, recent regression). Create issue file with TDD fix plan.

**Missing feature (simple)** -- Behavior never built but fix is localized (1-3 files, clear pattern). Create issue file noting this is net-new behavior, not a regression.

**Missing feature (complex)** -- New capability, multiple files, design decisions needed. Redirect: "This looks like a missing feature rather than a bug -- [explanation]. I'd recommend `/explore` to scope it properly. Reference `./issues/bugs/<slug>.md` for my investigation findings."

**Systemic** -- Root cause is architectural, fix requires new patterns or touches 8+ files. Redirect: "The root cause is systemic: [explanation]. A point fix would be fragile. I'd recommend `/architect` — reference `./issues/bugs/<slug>.md` for my investigation findings." Create lightweight issue with investigation findings.

## Issue Output

Save to `./issues/bugs/<slug>.md` using the template in `assets/bug-issue-template.md`. Kebab-case slug from symptom (e.g., `login-timeout-on-slow-networks.md`).

After writing: "Issue saved to `./issues/bugs/<slug>.md`. Fix plan starts with a failing test in `<test-file>`. Hand to an agent or start with the test."

Answer follow-ups about root cause or fix approach. If user wants to expand scope: "That's beyond a bug fix -- run `/architect` with this issue as context."

## Scope Guards

- One bug per invocation. Multiple bugs? Triage the first, then: "Describe the next bug and I'll triage it separately."
- Don't design solutions. Fix plan is tactical -- minimal change to correct the defect.
- Don't implement the fix. Output is the issue file, not the code change.
- Feature request → "This is new behavior, not a bug. Run `/explore`."
- Systemic issue → "This needs a design. Run `/architect`." Create lightweight issue with findings.
- Vague report, no repro → ask for repro steps. If unavailable, create lightweight issue marked "needs-reproduction."
