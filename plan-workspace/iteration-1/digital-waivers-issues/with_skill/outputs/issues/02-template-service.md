# Waiver Template Service + Validation + Errors + Unit Tests

> Part of: [digital-waivers-design.md](../../plans/digital-waivers-design.md)
> Issue: 2 of 7
> Type: AFK

## Blocked by

- [01-waiver-schema.md](./01-waiver-schema.md) -- needs `waiverTemplate` and `waiver` table definitions, `waiver_template_status` enum.

## What to build

Create the Effect-based service layer for waiver template CRUD: `createTemplate`, `updateTemplate`, `publishTemplate`, `getActiveTemplate`, `getTemplatesByOrg`. Add Zod validation schemas for template operations. Add tagged error classes. Write unit tests covering the full template lifecycle (create draft, update, publish, archive-on-republish, version increment, permission enforcement).

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/waivers.ts` | Effect service functions for template CRUD + signing | Follow `apps/web/src/lib/customers.ts` (262 lines) -- same `Effect.gen` + `DbService`/`CurrentSession` yield pattern, `Effect.tryPromise` for DB calls, tagged error returns |
| `apps/web/src/__tests__/waivers/waiver-templates.test.ts` | Unit tests for template lifecycle | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` (first 60 lines) -- same TestDbLayer/TestAuthLayer setup, `resetTestState`, `createTestSession`/`addMember` helpers |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/validation.ts` | Add `createWaiverTemplateSchema`, `updateWaiverTemplateSchema` Zod schemas + types (after line ~268, before subscription section) |
| `apps/web/src/lib/errors.ts` | Add `WaiverTemplateNotFound`, `ActiveTemplateNotFound`, `InvalidSignerAge` tagged error classes (after line ~72) |

## Context

### Patterns to follow
- `apps/web/src/lib/customers.ts` lines 45-122: `listCustomers` shows the standard pattern -- yield `DbService`, build conditions, `Effect.tryPromise` wrapping DB queries, return shaped data.
- `apps/web/src/lib/customers.ts` lines 124-158: `updateCustomerStatus` shows permission check pattern -- yield `CurrentSession`, call `getMemberRole`, guard on role.
- `apps/web/src/lib/settings.ts` lines 31-82: `updateOrgSettings` shows owner-only check + DB update via Drizzle `.set()`.
- `apps/web/src/lib/errors.ts` lines 1-72: tagged error class pattern -- `Data.TaggedError("Name")<{ fields }>`.

### Key types
```typescript
// Effect service dependencies (from services.ts)
export class DbService extends Context.Tag("DbService")<DbService, Database>() {}
export class CurrentSession extends Context.Tag("CurrentSession")<CurrentSession, Session>() {}

// Drizzle schema types the service will use (from waivers.ts after issue #1)
// waiverTemplate table, waiver table, waiverTemplateStatusEnum

// Permission check pattern (from customers.ts line 28-43)
function getMemberRole(db, orgId, userId): Effect<{role, id} | undefined, DatabaseError>

// Validation schema type exports (from validation.ts)
export type CreateWaiverTemplateData = z.infer<typeof createWaiverTemplateSchema>;
```

### Wiring notes
- Import `waiverTemplate` and `waiverTemplateStatusEnum` from `@/lib/db/schema/waivers`.
- The `publishTemplate` function must be transactional: archive all published templates for the org, then set the target draft to published. Use `db.transaction()` inside `Effect.tryPromise`.
- `getActiveTemplate` queries WHERE `organizationId = ? AND status = 'published'` LIMIT 1.
- `getTemplatesByOrg` returns all templates for an org ordered by version DESC.
- Permission logic: `createTemplate` requires owner or admin role. `publishTemplate` requires owner only (admin excluded per Design Decision #15, confirmed in `permissions.ts` line 41 -- admin has `["create", "read", "update"]` but NOT `"publish"`).

## Acceptance criteria

- [ ] `createTemplate` creates a draft with version 1, requires owner/admin
- [ ] `updateTemplate` updates a draft template, requires owner/admin
- [ ] `publishTemplate` archives previous published template and publishes target draft, owner only
- [ ] `publishTemplate` rejects admin callers
- [ ] Editing a published template creates a new draft with `version + 1`
- [ ] `getActiveTemplate` returns the single published template for an org, or undefined
- [ ] `getTemplatesByOrg` returns all templates ordered by version DESC
- [ ] `WaiverTemplateNotFound` error raised when template ID doesn't exist
- [ ] Zod schemas validate: name (required, string), body (required, string), expirationDays (integer, min 1, default 365)
- [ ] All template lifecycle tests pass
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test -- src/__tests__/waivers/waiver-templates.test.ts
```

## Notes

- The `getMemberRole` helper is duplicated across `customers.ts` and `settings.ts`. For this issue, duplicate it again in `waivers.ts` to match the existing pattern. Refactoring to a shared util is out of scope.
- Template body is stored as HTML from Tiptap. No sanitization at the service layer -- that happens at render time on the public page (Issue #4).
- Delete is only supported for unpublished drafts (Design Decision #11). Published and archived templates cannot be deleted.
