# Waiver Schema + ID Prefixes + Migration

> Part of: [digital-waivers-design.md](../../plans/digital-waivers-design.md)
> Issue: 1 of 7
> Type: AFK

## Blocked by

- None -- can start immediately.

## What to build

Create the `waiver_template` and `waiver` Drizzle schema tables with all columns, indexes, enums, and relations specified in the design. Add `waiverTemplate` and `waiver` ID prefixes to the prefix registry. Export the new schema from the barrel file. Generate the Drizzle migration.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/db/schema/waivers.ts` | `waiverTemplate` + `waiver` table definitions, enums, relations | Follow `apps/web/src/lib/db/schema/customers.ts` (130 lines) -- same pattern of pgEnum, pgTable with createId, indexes array, and relations block |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/id.ts` | Add `waiverTemplate: "wtl"` and `waiver: "wvr"` to `prefixes` object (after line ~31, before `} as const`) |
| `apps/web/src/lib/db/schema/index.ts` | Add `export * from "./waivers";` (after line ~10) |
| `apps/web/src/__tests__/helpers/db.ts` | Add `"waiver"` and `"waiver_template"` to the `tables` array (before `"customer"` at line ~17) for TRUNCATE cleanup |

## Context

### Patterns to follow
- `apps/web/src/lib/db/schema/customers.ts` lines 22-113: pgEnum definition, pgTable with `createId` default on PK, FK references, index array syntax with named indexes, unique constraints.
- `apps/web/src/lib/db/schema/organization-settings.ts` lines 15-44: timestamp columns with `withTimezone: true`, jsonb typed columns, `$onUpdate` pattern.
- `apps/web/src/lib/id.ts` lines 3-33: prefix registry pattern -- add entries alphabetically within their section.

### Key types
```typescript
// From id.ts -- the Prefix type is derived from prefixes keys
export type Prefix = keyof typeof prefixes;
export function createId(prefix: Prefix): string;

// From customers.ts -- pgEnum pattern
export const customerStatusEnum = pgEnum("customer_status", [...]);

// From customers.ts -- table FK reference pattern
organizationId: text("organization_id").notNull().references(() => organization.id),
```

### Wiring notes
- Import `organization` from `./auth` and `customer` from `./customers` for FK references.
- Import `createId` from `../../id` (relative path used in all schema files).
- The `waiver_template_status` pgEnum must be defined before the `waiverTemplate` table.
- `waiver.customerId` and `waiver.guardianCustomerId` both FK to `customer.id`.
- The partial unique index on `customer` table (`customer_organization_id_lower_email_uidx`) is also part of this issue -- add it to the existing `customers.ts` index array using Drizzle's `uniqueIndex(...).on(...).where(sql\`...\`)` pattern (see `organization-settings.ts` line 69-71 for partial index example).

## Acceptance criteria

- [ ] `waiver_template_status` enum created with values `'draft'`, `'published'`, `'archived'`
- [ ] `waiverTemplate` table has all fields: id (PK, `wtl_` prefix), organizationId (FK), name, body, expirationDays, status, version, createdByUserId, createdAt, updatedAt
- [ ] `waiverTemplate` indexes: `(organizationId)`, `(organizationId, status)`, UNIQUE `(organizationId, version)`
- [ ] `waiver` table has all fields: id (PK, `wvr_` prefix), organizationId (FK), templateId (FK), templateSnapshot, customerId (FK), signerFirstName/LastName/Email/Phone/DateOfBirth, isMinor, guardianCustomerId (FK nullable), signatureText, consentGiven, signedAt, expiresAt, ipAddress, userAgent, createdAt
- [ ] `waiver` indexes: `(organizationId)`, `(customerId)`, `(customerId, expiresAt)`, `(organizationId, signerEmail)`
- [ ] Relations defined: waiverTemplate -> organization, waiver -> organization/template/customer/guardianCustomer
- [ ] `createId("waiverTemplate")` returns `wtl_...`
- [ ] `createId("waiver")` returns `wvr_...`
- [ ] Schema barrel re-exports waivers module
- [ ] Partial unique index `customer_organization_id_lower_email_uidx` on `(organizationId, lower(email)) WHERE email IS NOT NULL` added to `customers.ts`
- [ ] `bun run db:generate` produces a migration
- [ ] `bun run lint` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web
bun run db:generate
bun run db:migrate
bun run lint
bun run build
```

## Notes

- The `waiver.signerDateOfBirth` column should use `date("signer_date_of_birth", { mode: "date" })` to match the `customer.dateOfBirth` pattern at `customers.ts` line 61.
- `waiver.signedAt` and `waiver.expiresAt` are `timestamp with tz NOT NULL` -- no defaults, these are always explicitly set at signing time.
- `waiver.createdAt` gets `defaultNow()` but no `updatedAt` -- waivers are append-only, never updated.
- The `customer` table partial unique index requires `sql` import from `drizzle-orm` (already imported in customers.ts) and `uniqueIndex` from `drizzle-orm/pg-core` (add to existing import).
