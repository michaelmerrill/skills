# Template CRUD Service + Validation

> Part of: [digital-waivers-design.md](plans/digital-waivers-design.md)
> Issue: 2 of 7
> Type: AFK

## Blocked by

- [01-schema-ids-errors.md](./01-schema-ids-errors.md) -- needs `waiverTemplate` table, `WaiverTemplateNotFound` error, `waiverTemplate` ID prefix

## What to build

Create `lib/waivers.ts` with Effect-based service functions for template lifecycle: `createTemplate`, `updateTemplate`, `publishTemplate`, `getActiveTemplate`, `getTemplatesByOrg`, `deleteTemplate`. Each enforces permissions (owner-only publish, admin can CRUD but not publish, member read-only). Add Zod validation schemas for create/update template inputs. Add `getTemplatesByOrg` and `getActiveTemplate` cached queries. Unit tests for the full template lifecycle.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/validation.ts` | Add `createWaiverTemplateSchema`, `updateWaiverTemplateSchema` Zod schemas after the entitlements section (line ~362) |
| `apps/web/src/lib/queries.ts` | Add `getTemplatesByOrg` and `getActiveTemplate` cached query functions after `getCustomersByOrg` (line ~169) |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/waivers.ts` | Effect service functions for waiver template CRUD | Follow `apps/web/src/lib/customers.ts` (262 lines) -- same Effect.gen, DbService, CurrentSession, permission check pattern |
| `apps/web/src/__tests__/waivers/waiver-templates.test.ts` | Unit tests for template lifecycle | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` (uses TestLayers, createTestSession, resetTestState) |

## Context

### Patterns to follow
- `apps/web/src/lib/customers.ts` lines 28-43: `getMemberRole` helper for permission checks. Reuse or import this pattern.
- `apps/web/src/lib/customers.ts` lines 45-122: `listCustomers` Effect.gen function with DbService, query construction, error handling. Follow identical structure.
- `apps/web/src/lib/settings.ts` lines 31-82: `updateOrgSettings` showing permission tiering (owner vs admin vs member).
- `apps/web/src/lib/queries.ts` lines 163-169: cached query pattern using `cache()` wrapper around Effect pipeline.

### Key types
```typescript
// Validation schemas to add
export const createWaiverTemplateSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().trim().min(1, "Template name is required.").max(200),
  body: z.string().min(1, "Template body is required."),
  expirationDays: z.coerce.number().int().min(1).max(3650).default(365),
});
export type CreateWaiverTemplateData = z.infer<typeof createWaiverTemplateSchema>;

export const updateWaiverTemplateSchema = z.object({
  orgId: z.string().min(1),
  templateId: z.string().min(1),
  name: z.string().trim().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  expirationDays: z.coerce.number().int().min(1).max(3650).optional(),
});
export type UpdateWaiverTemplateData = z.infer<typeof updateWaiverTemplateSchema>;

// Service function signatures
export const createTemplate: (data: CreateWaiverTemplateData) => Effect<WaiverTemplate, DatabaseError | PermissionDenied>
export const publishTemplate: (data: { orgId: string; templateId: string }) => Effect<void, DatabaseError | PermissionDenied | WaiverTemplateNotFound>
export const getActiveTemplate: (orgId: string) => Effect<WaiverTemplate | undefined, DatabaseError>
export const getTemplatesByOrg: (orgId: string) => Effect<WaiverTemplate[], DatabaseError>
```

### Wiring notes
- `publishTemplate` must run in a transaction: archive all existing published templates for the org, then set the target draft to published.
- `deleteTemplate` only works on drafts. Published/archived templates cannot be deleted (Decision #11).
- Editing a published template creates a new row with `version: prevVersion + 1`, `status: 'draft'`, body/name/expirationDays copied (Decision #4). This is a separate `createDraftFromPublished` function, not an update-in-place.
- Permission check: owner can publish, admin can CRUD except publish, member can only read. Use `getMemberRole` pattern from `customers.ts` line 28.

## Acceptance criteria

- [ ] `createTemplate` inserts a draft template with version 1, enforces create permission
- [ ] `updateTemplate` updates only draft templates, enforces update permission
- [ ] `publishTemplate` atomically archives current published + sets target to published, owner-only
- [ ] `publishTemplate` rejects non-owner (admin) with PermissionDenied
- [ ] `getTemplatesByOrg` returns all templates for an org ordered by version desc
- [ ] `getActiveTemplate` returns the single published template or undefined
- [ ] `deleteTemplate` only deletes drafts, rejects published/archived
- [ ] Editing a published template creates a new draft with version + 1
- [ ] Zod schemas validate all inputs correctly
- [ ] All template lifecycle unit tests pass
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test -- --grep "waiver template"
```

## Notes
- The unique index `(organizationId, version)` from issue #1 prevents duplicate versions. The service must query max version before inserting.
- Transaction for publish: use `db.transaction(async (tx) => { ... })` -- Drizzle supports this natively.
