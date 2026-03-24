# Booking Schema + ID Prefixes

> Part of: [Lane Booking](../../../../../../architect-workspace/iteration-1/lane-booking-design/with_skill/outputs/design.md)
> Issue: 1 of 8
> Type: AFK

## Blocked by

- None -- can start immediately.

## What to build

Create the `booking` and `bookingEvent` database tables with all fields, enums, indexes, composite foreign keys, and relations as specified in the design. Register `bkg` and `bke` ID prefixes. Define the `BookingRules` TypeScript type and Zod schema for the existing `bookingRules` JSONB column on `organizationSetting`. Add both new tables to the test cleanup helper. This is a foundation issue: both tables are consumed by 6+ downstream issues.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/db/schema/bookings.ts` | `booking` + `bookingEvent` tables, enums, relations | Follow `apps/web/src/lib/db/schema/subscription-events.ts` (line 36-88 for append-only event table pattern) and `apps/web/src/lib/db/schema/subscriptions.ts` (line 39-124 for composite FK pattern) |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/id.ts` | Add `booking: "bkg"` and `bookingEvent: "bke"` to `prefixes` object after `entitlementBalance` entry (line ~32) |
| `apps/web/src/lib/db/schema/index.ts` | Add `export * from "./bookings"` after line 3 |
| `apps/web/src/lib/validation.ts` | Add `BookingRules` Zod schema and TypeScript type, plus `createBookingSchema`, `cancelBookingSchema`, `checkInBookingSchema` after entitlement schemas (line ~362) |
| `apps/web/src/__tests__/helpers/db.ts` | Add `"booking_event"` and `"booking"` to `tables` array before `"entitlement_ledger"` (line ~6) |

## Context

### Patterns to follow
- `apps/web/src/lib/db/schema/subscription-events.ts` lines 1-88: append-only event table with enum, composite FK, `organizationId` index, no `updatedAt`.
- `apps/web/src/lib/db/schema/subscriptions.ts` lines 39-124: multi-FK table with `check` constraints, composite tenant-scoped foreign keys.
- `apps/web/src/lib/db/schema/entitlements.ts` lines 22-27: `pgEnum` declaration pattern.

### Key types
```typescript
// Enums to create
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"
]);
export const bookerTypeEnum = pgEnum("booker_type", [
  "member", "walk_in", "staff"
]);
export const bookingPaymentMethodEnum = pgEnum("booking_payment_method", [
  "entitlement", "stripe", "cash", "free"
]);
export const bookingEventTypeEnum = pgEnum("booking_event_type", [
  "created", "confirmed", "checked_in", "completed", "cancelled",
  "no_show", "payment_received", "refunded"
]);

// BookingRules Zod schema
export const bookingRulesSchema = z.object({
  slotDurationMinutes: z.number().int().min(15).max(480),
  maxAdvanceBookingDays: z.number().int().min(1).max(365),
  cancellationWindowMinutes: z.number().int().min(0),
  pendingExpirationMinutes: z.number().int().min(1).default(15),
  operatingHours: z.record(z.string(), z.record(
    z.string(),
    z.object({ open: z.string(), close: z.string() }).nullable()
  )),
});
export type BookingRules = z.infer<typeof bookingRulesSchema>;
```

### Wiring notes
- Schema index file must re-export `./bookings` so Drizzle picks up the new tables.
- Test cleanup `tables` array order matters: `booking_event` before `booking` (FK dependency for TRUNCATE CASCADE).

## Acceptance criteria

- [ ] `booking` table has all 23 fields from design, including composite FKs to `resource`, `resourceType`, `customer`, `offeringPrice`
- [ ] `bookingEvent` table has all 9 fields, append-only (no `updatedAt`)
- [ ] 4 enums created: `booking_status`, `booker_type`, `booking_payment_method`, `booking_event_type`
- [ ] Indexes match design: tenant filtering, availability queries, conflict detection, customer history, confirmation code unique, checkout session unique
- [ ] CHECK constraints: `endTime > startTime`, `amountCentsPaid >= 0`
- [ ] `bkg` and `bke` prefixes registered in `id.ts`
- [ ] `BookingRules` Zod schema + TypeScript type exported from `validation.ts`
- [ ] `bun run db:generate` succeeds from `apps/web`
- [ ] `bun run db:migrate` succeeds from `apps/web`
- [ ] `biome check` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web && bun run db:generate && bun run db:migrate
cd ../.. && bun run lint
cd apps/web && bun run build
```
