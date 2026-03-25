<!-- Template for plan skill. Write one file per issue in ./issues/<feature-name>/. -->
<!-- Naming: 01-<slug>.md, 02-<slug>.md, ... Slugs: 2-4 word kebab-case. -->
<!-- Include relevant sections. Omit any that would say "N/A." -->

# <Title>

> Part of: [<feature-name>](../../plans/<feature-name>.md)
> Issue: <N> of <total>
> Type: Auto | HITL

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
<Layer composition changes — adding to provide chains, updating layers, etc.>

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
<Steps to verify manually — curl commands, UI interactions, DB checks.>

## Notes

<Edge cases, gotchas.>
