# Schema + ID Prefixes + Error Types

> Part of: [digital-waivers-design.md](plans/digital-waivers-design.md)
> Issue: 1 of 7
> Type: AFK

## Blocked by

None -- can start immediately.

## What to build

Create the `waiver_template` and `waiver` Drizzle schema tables with all fields, indexes, enums, and relations specified in the design. Register `waiverTemplate` and `waiver` ID prefixes. Add `WaiverTemplateNotFound`, `ActiveTemplateNotFound`, and `InvalidSignerAge` tagged error classes. Add partial unique index on `customer(organizationId, lower(email)) WHERE email IS NOT NULL`. Export the new schema module from the barrel file. Register new tables in the test helper truncation list.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/id.ts` | Add `waiverTemplate: "wtl"` after `staffProfile` (line ~20) and `waiver: "wvr"` after it in the `prefixes` object |
| `apps/web/src/lib/errors.ts` | Add `WaiverTemplateNotFound`, `ActiveTemplateNotFound`, `InvalidSignerAge` tagged error classes after `InsufficientEntitlement` (line ~72) |
| `apps/web/src/lib/db/schema/index.ts` | Add `export * from "./waivers";` after the last export (line ~10) |
| `apps/web/src/__tests__/helpers/db.ts` | Add `"waiver"` and `"waiver_template"` to the `tables` array before `"customer"` (line ~17) so truncation respects FK order |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/db/schema/waivers.ts` | Drizzle table definitions for `waiver_template` and `waiver` with enums, indexes, relations | Follow `apps/web/src/lib/db/schema/customers.ts` (130 lines) |

## Context

### Patterns to follow
- `apps/web/src/lib/db/schema/customers.ts` lines 1-114: table definition with pgEnum, pgTable, indexes array, foreignKey, relations. Use identical import style and structure.
- `apps/web/src/lib/id.ts` lines 3-33: prefixes object pattern. Add entries alphabetically within the "People" or a new "Waivers" comment section.
- `apps/web/src/lib/errors.ts` lines 1-72: TaggedError pattern using `Data.TaggedError`.

### Key types
```typescript
// New enum
export const waiverTemplateStatusEnum = pgEnum("waiver_template_status", [
  "draft", "published", "archived",
]);

// ID prefixes to add
waiverTemplate: "wtl",
waiver: "wvr",

// Error classes to add
export class WaiverTemplateNotFound extends Data.TaggedError("WaiverTemplateNotFound")<{
  readonly templateId: string;
}> {}

export class ActiveTemplateNotFound extends Data.TaggedError("ActiveTemplateNotFound")<{
  readonly organizationId: string;
}> {}

export class InvalidSignerAge extends Data.TaggedError("InvalidSignerAge")<{
  readonly reason: string;
}> {}
```

### Wiring notes
- The `waivers.ts` schema file must import `organization` from `./auth` and `customer` from `./customers` for FK references.
- The `waiver_template` table needs `organizationId` FK to `organization.id` and `createdByUserId` nullable FK to `user.id`.
- The `waiver` table needs FKs to `organization.id`, `waiver_template.id`, and two FKs to `customer.id` (`customerId` and `guardianCustomerId`).
- Customer table modification: add a partial unique index `customer_organization_id_lower_email_uidx` using `sql` tagged template for `lower(email)` expression and `WHERE email IS NOT NULL` filter. This goes in the existing `customers.ts` indexes array.
- Relations: `waiverTemplate` belongs to `organization`. `waiver` belongs to `organization`, `waiverTemplate`, `customer` (via customerId), and optionally `customer` (via guardianCustomerId).

## Acceptance criteria

- [ ] `waiver_template` table defined with all fields: id (text PK, prefix "wtl"), organizationId, name, body, expirationDays (integer default 365), status (enum: draft/published/archived, default draft), version (integer default 1), createdByUserId, createdAt, updatedAt
- [ ] `waiver_template` indexes: `(organizationId)`, `(organizationId, status)`, UNIQUE `(organizationId, version)`
- [ ] `waiver` table defined with all fields: id (text PK, prefix "wvr"), organizationId, templateId, templateSnapshot, customerId, signerFirstName, signerLastName, signerEmail, signerPhone, signerDateOfBirth, isMinor, guardianCustomerId, signatureText, consentGiven, signedAt, expiresAt, ipAddress, userAgent, createdAt
- [ ] `waiver` indexes: `(organizationId)`, `(customerId)`, `(customerId, expiresAt)`, `(organizationId, signerEmail)`
- [ ] Customer table has new partial unique index on `(organizationId, lower(email)) WHERE email IS NOT NULL`
- [ ] `createId("waiverTemplate")` returns `wtl_...` and `createId("waiver")` returns `wvr_...`
- [ ] Error classes `WaiverTemplateNotFound`, `ActiveTemplateNotFound`, `InvalidSignerAge` exist and extend `Data.TaggedError`
- [ ] Schema barrel file exports waivers module
- [ ] `bun run db:generate` succeeds (from `apps/web`)
- [ ] `bun run lint` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web
bun run db:generate
bun run lint
bun run build
```

### Manual verification
- Inspect generated migration SQL to confirm both tables, all indexes, and the customer partial unique index are present.

## Notes
- The `waiver_template_organization_id_version_uidx` UNIQUE index prevents duplicate versions per org. This is critical for the version-increment logic in issue #2.
- `signerDateOfBirth` uses `date` type (mode: "date") matching the existing `customer.dateOfBirth` pattern.
- `templateSnapshot` is `text NOT NULL` -- no practical size limit in Postgres.
