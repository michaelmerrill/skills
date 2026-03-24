# Booking Schema + ID Prefixes + Feature Flag

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 1 of 7
> Type: AFK

## Blocked by

None -- can start immediately.

## What to build

Create the `booking` and `bookingEvent` database tables with all fields, enums, indexes, composite foreign keys, and constraints specified in the design. Register `booking` and `bookingEvent` ID prefixes (`bkg`, `bke`). Define the `BookingRules` TypeScript type and Zod schema for the existing `bookingRules` JSONB column on `organizationSetting`. Add `booking` resource to the access control statements. Add the `booking` and `bookingEvent` tables to the test cleanup list.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/db/schema/bookings.ts` | `booking` + `bookingEvent` tables, enums, relations | Follow `apps/web/src/lib/db/schema/subscription-events.ts` (append-only event pattern, lines 36-68) and `apps/web/src/lib/db/schema/subscriptions.ts` (composite FKs, lines 86-123) |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/db/schema/index.ts` | Add `export * from "./bookings";` after line 1 (after `"./auth"` export) |
| `apps/web/src/lib/id.ts` | Add `booking: "bkg"` and `bookingEvent: "bke"` to `prefixes` object after `entitlementBalance` entry (line ~32) |
| `apps/web/src/lib/permissions.ts` | Add `booking: ["create", "read", "update", "cancel", "check_in", "list"]` to `statements` (after line 13), then add to `owner` role (full set), `admin` role (`["create", "read", "update", "cancel", "check_in", "list"]`), and `member` role (`["create", "read", "cancel"]`) |
| `apps/web/src/__tests__/helpers/db.ts` | Add `"booking_event"` and `"booking"` to `tables` array before `"entitlement_ledger"` (line ~6) |

## Context

### Patterns to follow

- `apps/web/src/lib/db/schema/subscription-events.ts` lines 19-30: pgEnum definition pattern for `subscriptionEventTypeEnum`. Follow this for `bookingStatusEnum`, `bookerTypeEnum`, `bookingPaymentMethodEnum`, `bookingEventTypeEnum`.
- `apps/web/src/lib/db/schema/subscription-events.ts` lines 36-68: append-only event table (no `updatedAt`, composite FK on `(subscriptionId, organizationId)`). Follow exactly for `bookingEvent`.
- `apps/web/src/lib/db/schema/subscriptions.ts` lines 39-123: multi-FK table with composite foreign keys, checks, indexes. Follow for `booking`.

### Key types

```typescript
// Enums to create
type BookingStatus = "pending" | "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show";
type BookerType = "member" | "walk_in" | "staff";
type BookingPaymentMethod = "entitlement" | "stripe" | "cash" | "free";
type BookingEventType = "created" | "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show" | "payment_received" | "refunded";

// BookingRules Zod schema to add to validation.ts
type BookingRules = {
  slotDurationMinutes: number;
  maxAdvanceBookingDays: number;
  cancellationWindowMinutes: number;
  pendingExpirationMinutes: number;
  operatingHours: Record<string, {
    [dayOfWeek: number]: { open: string; close: string } | null;
  }>;
};
```

### Wiring notes

- `apps/web/src/lib/db/schema/index.ts` must re-export the new bookings module so Drizzle Kit picks it up for migration generation.
- After creating schema file, run `bun run db:generate` from `apps/web` to create migration SQL.
- The `booking` table needs composite FKs referencing `resource`, `resourceType`, `customer`, `offeringPrice`, and `organization` -- all already exported from their respective schema files.
- The `bookingEvent` table references `booking` via composite FK `(bookingId, organizationId)` -- same pattern as `subscriptionChangeEvent` referencing `subscription`.

## Acceptance criteria

- [ ] `booking` table created with all 20+ fields matching design spec
- [ ] `bookingEvent` table created with all fields, no `updatedAt`
- [ ] 4 enums created: `booking_status`, `booker_type`, `booking_payment_method`, `booking_event_type`
- [ ] ID prefixes `bkg` and `bke` registered in `id.ts`
- [ ] All indexes from design spec present (5 on `booking`, 1 on `bookingEvent`)
- [ ] `CHECK endTime > startTime` and `CHECK amountCentsPaid >= 0` constraints present
- [ ] Composite FKs on `(organizationId, ...)` for tenant isolation
- [ ] `booking` resource added to access control with correct permissions per role
- [ ] `BookingRules` Zod schema validates the JSONB shape
- [ ] Test cleanup includes new tables
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run db:generate` produces migration without errors

## Verification

```bash
cd apps/web
bun run db:generate
bun run lint
bun run build
bun run test
```

## Notes

- The `confirmationCode` field needs a UNIQUE constraint scoped to `(organizationId, confirmationCode)`, not globally unique.
- `stripeCheckoutSessionId` UNIQUE constraint should be partial: `WHERE stripeCheckoutSessionId IS NOT NULL` -- follow `offeringPrice.stripePriceId` pattern at `apps/web/src/lib/db/schema/offerings.ts` line 157.
- `bookingRules` JSONB column already exists on `organizationSetting` (line 33 of `organization-settings.ts`). The Zod schema goes in `validation.ts`, not in the schema file.
