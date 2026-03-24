# Booking Schema + ID Prefixes + Enums

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 1 of 11
> Type: AFK

## Blocked by

- None -- can start immediately.

## What to build

Create the `booking` and `bookingEvent` database tables with all fields, indexes, enums, composite foreign keys, and check constraints as specified in the design. Register `bkg` and `bke` ID prefixes. Add both new tables to the schema barrel export and the test-cleanup truncation list. Generate the Drizzle migration.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/id.ts` | Add `booking: "bkg"` and `bookingEvent: "bke"` to `prefixes` object (after line ~31, before the closing `} as const`) |
| `apps/web/src/lib/db/schema/index.ts` | Add `export * from "./bookings";` (after line ~10) |
| `apps/web/src/__tests__/helpers/db.ts` | Add `"booking_event"` and `"booking"` to `tables` array (before `"entitlement_ledger"` at line ~6, order matters for CASCADE) |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/db/schema/bookings.ts` | `booking` + `bookingEvent` tables, enums, relations | Follow `apps/web/src/lib/db/schema/subscription-events.ts` for append-only event table pattern; follow `apps/web/src/lib/db/schema/entitlements.ts` for composite FKs and check constraints |

## Context

### Patterns to follow
- `apps/web/src/lib/db/schema/subscription-events.ts` (lines 36-70): append-only event table with `pgEnum`, composite FK, NO `updatedAt`, index on `(orgId, parentId, createdAt)`.
- `apps/web/src/lib/db/schema/entitlements.ts` (lines 38-87): composite foreign keys via `foreignKey()`, check constraints via `check()`, `unique()` on `(id, organizationId)`.
- `apps/web/src/lib/db/schema/resources.ts` (lines 61-114): composite FK to `location` using `foreignKey({ columns: [t.locationId, t.organizationId], foreignColumns: [location.id, location.organizationId] })`.

### Key types
```typescript
// Enums to create
const bookingStatusEnum = pgEnum("booking_status", [
  "pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"
]);
const bookerTypeEnum = pgEnum("booker_type", ["member", "walk_in", "staff"]);
const bookingPaymentMethodEnum = pgEnum("booking_payment_method", [
  "entitlement", "stripe", "cash", "free"
]);
const bookingEventTypeEnum = pgEnum("booking_event_type", [
  "created", "confirmed", "checked_in", "completed", "cancelled",
  "no_show", "payment_received", "refunded"
]);
```

### Wiring notes
- Import `organization` from `./auth`, `location` from `./locations`, `resourceType` and `resource` from `./resources`, `customer` from `./customers`, `offeringPrice` from `./offerings`.
- Composite FKs: `(locationId, organizationId)` -> `location`, `(resourceId, organizationId)` -> `resource`, `(resourceTypeId, organizationId)` -> `resourceType`, `(customerId, organizationId)` -> `customer`, `(offeringPriceId, organizationId)` -> `offeringPrice`.
- `bookingEvent` has composite FK `(bookingId, organizationId)` -> `booking.(id, organizationId)`.
- Unique index on `(organizationId, confirmationCode)` and conditional unique on `stripeCheckoutSessionId WHERE NOT NULL`.

## Acceptance criteria

- [ ] `booking` table created with all 20+ fields, 6 indexes, 2 check constraints, 6 composite FKs
- [ ] `bookingEvent` table created with all fields, 1 index, 1 composite FK, NO `updatedAt`
- [ ] 4 enums created: `booking_status`, `booker_type`, `booking_payment_method`, `booking_event_type`
- [ ] ID prefixes `bkg` and `bke` registered in `id.ts`
- [ ] Schema barrel export includes bookings
- [ ] Test cleanup truncation list includes both new tables in correct order
- [ ] `bun run db:generate` produces a clean migration (from `apps/web`)
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes (from `apps/web`)

## Verification

```bash
cd apps/web
bun run db:generate
bunx biome check src/lib/db/schema/bookings.ts src/lib/id.ts
bun run build
```

## Notes

- The `confirmationCode` unique constraint is scoped to `organizationId` (composite unique), not globally unique.
- `stripeCheckoutSessionId` unique index uses `WHERE NOT NULL` pattern -- see `apps/web/src/lib/db/schema/organization-settings.ts` line 70 for the `sql` helper pattern.
- `entitlementGrantId` is nullable -- only set when `paymentMethod = 'entitlement'`.
- `customerId` is nullable -- only during the brief Stripe pending window for walk-ins.
