# Digital Waivers — Implementation Issue Breakdown

## Overview

The digital waivers feature is decomposed into 16 issues across three phases, matching the design doc's phased build plan. Issues are scoped so each can be handed off to a coding agent independently (given its dependencies are complete).

## Phase 1: Schema + Template Management (Issues 1-5, 13)

Foundation layer: database tables, validation, feature flag, service layer, and the settings UI for template CRUD.

| # | Issue | Dependencies |
|---|-------|-------------|
| 1 | DB Schema — waiver_template, waiver tables, migrations | None |
| 2 | Error types and Zod validation schemas | None |
| 3 | Feature flag — waivers | None |
| 4 | Waiver template service layer (lib/waivers.ts) | 1, 2 |
| 5 | Settings > Waivers tab — template management UI | 1, 2, 3, 4 |
| 13 | Unit tests — template lifecycle | 1, 4 |

**Parallelism**: Issues 1, 2, 3 can all be done in parallel. Issue 4 starts after 1+2. Issues 5 and 13 start after 4.

## Phase 2: Public Signing + Customer Integration (Issues 6-9, 14)

Public-facing signing page, customer matching/creation, email confirmation, and rate limiting.

| # | Issue | Dependencies |
|---|-------|-------------|
| 6 | Waiver signing service layer | 1, 2 |
| 7 | Public waiver signing page | 1, 2, 3, 6 |
| 8 | Rate limiting on signing endpoint | 7 |
| 9 | Email confirmation | 6 |
| 14 | Unit tests — waiver signing | 1, 6 |

**Parallelism**: Issue 6 can start as soon as Issues 1+2 are done (same as Issue 4 — they can be developed in parallel). Issues 7, 9, and 14 fan out from 6.

## Phase 3: Staff-Facing UI (Issues 10-12, 15-16)

Waiver status badges in customer table, filtering, coverage stats, and comprehensive tests.

| # | Issue | Dependencies |
|---|-------|-------------|
| 10 | Customer table waiver status badges | 1, 3 |
| 11 | Customer table waiver status filter | 1, 3, 10 |
| 12 | Waiver coverage summary on customers page | 1, 3 |
| 15 | Unit tests — waiver status and coverage | 1, 10, 11, 12 |
| 16 | E2E test — public signing flow | 7, 6 |

**Parallelism**: Issues 10 and 12 can be done in parallel once Issue 1 is complete. Issue 11 depends on 10. Issues 15 and 16 are test-only and come last.

## Dependency Graph (Critical Path)

```
Issues 1, 2, 3 (parallel, no deps)
    |
    v
Issues 4, 6 (parallel, need 1+2)
    |         |
    v         v
Issue 5    Issues 7, 9, 14
(needs 4)  (need 6)
    |         |
    v         v
Issue 13   Issues 8, 16
(needs 4)  (need 7)

Issues 10, 12 (need 1+3, can start early)
    |
    v
Issue 11 (needs 10)
    |
    v
Issue 15 (needs 10, 11, 12)
```

## Key Files Touched

**New files:**
- `apps/web/src/lib/db/schema/waivers.ts` — table definitions
- `apps/web/src/lib/waivers.ts` — service layer
- `apps/web/src/app/[orgSlug]/waiver/page.tsx` — public signing page
- `apps/web/src/app/[orgSlug]/waiver/actions.ts` — signing server action
- `apps/web/src/app/[orgSlug]/settings/waivers/page.tsx` — template management
- `apps/web/src/app/[orgSlug]/settings/waivers/actions.ts` — template server actions
- `packages/email/src/templates/waiver-confirmation.tsx` — email template
- Test files in `__tests__/waivers/` and `e2e/`

**Modified files:**
- `apps/web/src/lib/id.ts` — new ID prefixes
- `apps/web/src/lib/errors.ts` — new error types
- `apps/web/src/lib/validation.ts` — new Zod schemas
- `apps/web/src/lib/db/schema/index.ts` — export new schema
- `apps/web/src/lib/db/schema/customers.ts` — new partial unique index
- `apps/web/src/lib/customers.ts` — waiver status subquery + filter
- `apps/web/src/lib/queries.ts` — new query functions
- `apps/web/src/app/[orgSlug]/customers/page.tsx` — badges + coverage
- `apps/web/src/components/customers/customers-table.tsx` — badge rendering + filter
- Settings layout/navigation — new Waivers tab

## Design Decisions Preserved

All 16 design decisions from the architecture doc are carried through into the issues. Key ones:
- Decision #1: Public route at `app/[orgSlug]/waiver/page.tsx` reuses proxy rewrite (Issue 7)
- Decision #4: Append-only versioning with draft/published/archived status (Issues 1, 4)
- Decision #5: Frozen template snapshot at signing time (Issue 6)
- Decision #7: Server actions for progressive enhancement (Issues 5, 7)
- Decision #8: Derived waiver status via SQL subquery (Issue 10)
- Decision #9: Case-insensitive email matching with partial unique index (Issues 1, 6)
- Decision #12: Feature flag gating (Issue 3)
- Decision #14: Rate limiting on signing endpoint (Issue 8)
