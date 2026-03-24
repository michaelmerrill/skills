# Waiver Schema + Migration

> Part of: [design.md](../../../../architect-workspace/iteration-1/digital-waivers-design/with_skill/outputs/design.md)
> Issue: 1 of 6
> Type: AFK

## Blocked by

None — can start immediately.

## What to build

Create the `waiver_template` and `waiver` Drizzle schema tables with all columns, indexes, enums, and relations defined in the design. Register ID prefixes `waiverTemplate` ("wtl") and `waiver` ("wvr") in the prefix map. Add a partial unique index on `customer(organizationId, lower(email)) WHERE email IS NOT NULL` for race-condition-safe email matching during signing. Export the new schema module from the barrel file. Generate the Drizzle migration.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/id.ts` | Add `waiverTemplate: "wtl"` and `waiver: "wvr"` entries to the `prefixes` object (after line ~31, before the closing `} as const`) |
| `apps/web/src/lib/db/schema/index.ts` | Add `export * from "./waivers";` (after line 2, alongside existing exports) |
| `apps/web/src/lib/db/schema/customers.ts` | Add partial unique index `customer_organization_id_lower_email_uidx` on `(organizationId, lower(email)) WHERE email IS NOT NULL` in the table's index array (after line ~98) |
| `apps/web/src/__tests__/helpers/db.ts` | Add `"waiver"` and `"waiver_template"` to the `tables` array (before `"customer"` at line ~17, respecting FK ordering) |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/db/schema/waivers.ts` | `waiverTemplate` and `waiver` table definitions, `waiverTemplateStatusEnum`, relations | Follow `apps/web/src/lib/db/schema/customers.ts` for table structure, enum declaration, relations, and index patterns |

## Context

### Patterns to follow
- `apps/web/src/lib/db/schema/customers.ts` (lines 1-130): table with pgEnum, indexes, relations, FK references, `createId` usage
- `apps/web/src/lib/db/schema/locations.ts` (lines 1-66): partial unique index with `.where(sql\`...\`)` pattern (line 62)
- `apps/web/src/lib/id.ts` (lines 1-55): prefix map structure and `createId` function

### Key types
```typescript
// From drizzle-orm/pg-core — used for table/column definition
import { pgTable, pgEnum, text, integer, boolean, timestamp, date, index, unique, uniqueIndex } from "drizzle-orm/pg-core";

// ID creation
import { createId } from "../../id";
// Usage: .$defaultFn(() => createId("waiverTemplate"))

// FK references
import { organization, user } from "./auth";
import { customer } from "./customers";
```

### Wiring notes
- The new `waivers.ts` schema file must be re-exported from `apps/web/src/lib/db/schema/index.ts` so Drizzle picks it up for migration generation.
- The `tables` array in test helpers (`__tests__/helpers/db.ts`) must list `waiver` and `waiver_template` before `customer` so `TRUNCATE ... CASCADE` respects FK ordering.

## Acceptance criteria

- [ ] `waiver_template` table has: id (text PK, "wtl" prefix), organizationId, name, body, expirationDays (default 365), status (draft/published/archived enum), version (default 1), createdByUserId, createdAt, updatedAt
- [ ] `waiver_template` indexes: `(organizationId)`, `(organizationId, status)`, unique `(organizationId, version)`
- [ ] `waiver` table has: id (text PK, "wvr" prefix), organizationId, templateId, templateSnapshot, customerId, signerFirstName, signerLastName, signerEmail, signerPhone, signerDateOfBirth, isMinor, guardianCustomerId, signatureText, consentGiven, signedAt, expiresAt, ipAddress, userAgent, createdAt
- [ ] `waiver` indexes: `(organizationId)`, `(customerId)`, `(customerId, expiresAt)`, `(organizationId, signerEmail)`
- [ ] `customer` table gains partial unique index on `(organizationId, lower(email)) WHERE email IS NOT NULL`
- [ ] ID prefixes `waiverTemplate: "wtl"` and `waiver: "wvr"` registered
- [ ] `bun run db:generate` produces migration without errors
- [ ] `bun run db:migrate` applies cleanly
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web
bun run db:generate
bun run db:migrate
cd ../..
bunx biome check apps/web/src
bun run build
```

## Notes

- The `waiverTemplateStatusEnum` uses `pgEnum("waiver_template_status", ["draft", "published", "archived"])`.
- `waiver.guardianCustomerId` is nullable — only populated for minor waivers.
- `waiver.signerPhone` is nullable (phone is optional on the signing form).
- `waiver.expiresAt` is stored as a computed value (`signedAt + expirationDays`), calculated at insert time, not by Postgres.
