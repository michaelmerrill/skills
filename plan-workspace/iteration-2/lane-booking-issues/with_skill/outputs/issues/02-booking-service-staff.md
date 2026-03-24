# Booking Service Core + Staff Creation

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 2 of 7
> Type: AFK

## Blocked by

- [01-booking-schema.md](./01-booking-schema.md) -- needs `booking` and `bookingEvent` tables, enums, and ID prefixes

## What to build

Implement the core booking service with: `createBooking` orchestrator for staff-created bookings (all 4 payment methods: `cash`, `free`, `entitlement`, `stripe`), `generateConfirmationCode` (BK-XXXX format, retry on collision within org), booking state machine (valid transitions), and `bookingEvent` append on every status change. Create server action for staff booking creation with `owner`/`admin` role guard. Add tagged error classes for booking domain. Add Zod validation schemas for booking creation input. Write unit tests for state machine, confirmation code generation, and staff booking creation.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/bookings.ts` | Core booking service: `createStaffBooking`, `generateConfirmationCode`, booking state machine | Follow `apps/web/src/lib/subscriptions.ts` (Effect service with `DbService`, state machine pattern at lines 13-20, transaction with event insert) |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Server action: `createStaffBooking` | Follow `apps/web/src/app/[orgSlug]/settings/actions.ts` (Zod parse + session + Effect.provide pattern, lines 38-65) |
| `apps/web/src/__tests__/bookings/staff-booking.test.ts` | Tests: staff create, state machine, confirmation code | Follow `apps/web/src/__tests__/settings/entitlement-ledger.test.ts` (TestDbLayer pattern, seed setup, lines 1-60) |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/errors.ts` | Add `BookingNotFound`, `BookingConflict`, `NoLanesAvailable`, `InvalidBookingTransition` tagged error classes after `InsufficientEntitlement` (line ~72) |
| `apps/web/src/lib/validation.ts` | Add `createStaffBookingSchema` and `BookingRules` Zod schemas after entitlement schemas (line ~362) |
| `apps/web/src/lib/queries.ts` | Add `getBookingsByOrg` cached query for staff dashboard listing (after `getCustomersByOrg` at line ~169) |

## Context

### Patterns to follow

- `apps/web/src/lib/subscriptions.ts` lines 13-20: `VALID_TRANSITIONS` record pattern for state machine. Replicate for booking statuses: `pending -> confirmed | cancelled`, `confirmed -> checked_in | cancelled | no_show`, `checked_in -> completed`, etc.
- `apps/web/src/lib/subscriptions.ts` lines 22-70: `transitionSubscriptionStatus` Effect function -- read existing, validate transition, transaction with update + event insert. Follow for `transitionBookingStatus`.
- `apps/web/src/lib/entitlements.ts` lines 94-175: `consumeEntitlement` with `DbService` dependency, atomic transaction. Follow for entitlement payment path in `createStaffBooking`.
- `apps/web/src/app/[orgSlug]/settings/actions.ts` lines 38-65: Server action pattern -- Zod parse, session fetch, Effect.provide(AppLive), match error.

### Key types

```typescript
// From existing codebase
import { DbService, CurrentSession } from "@/lib/services";  // services.ts line 16, 51
import { consumeEntitlement, reverseConsumption } from "@/lib/entitlements";  // entitlements.ts line 94, 302
import type { Database } from "@/lib/db";  // db/index.ts

// New types to define
type CreateStaffBookingData = {
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  customerId: string;
  startTime: Date;
  endTime: Date;
  paymentMethod: "entitlement" | "stripe" | "cash" | "free";
  entitlementGrantId?: string;
  notes?: string;
};

// State machine
const VALID_BOOKING_TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(["confirmed", "cancelled"]),
  confirmed: new Set(["checked_in", "cancelled", "no_show"]),
  checked_in: new Set(["completed"]),
  completed: new Set(),
  cancelled: new Set(),
  no_show: new Set(),
};
```

### Wiring notes

- `createStaffBooking` must find an available lane by querying `resource` table where `resourceTypeId` matches, `locationId` matches, `isActive = true`, and no conflicting `booking` exists for the time window. Order by `resource.sortOrder` (line 75 of resources.ts), take first.
- Confirmation code: generate `BK-` + 4 random alphanumeric chars. Retry loop checking `(organizationId, confirmationCode)` unique index.
- Staff bookings skip Stripe -- they go directly to `confirmed` status with `bookerType: 'staff'` and `createdByUserId` from session.
- For `entitlement` payment: call `consumeEntitlement` from `apps/web/src/lib/entitlements.ts` (line 94) inside the same transaction context.

## Acceptance criteria

- [ ] Staff can create booking with `cash` payment -- booking status `confirmed`
- [ ] Staff can create booking with `free` payment -- booking status `confirmed`
- [ ] Staff can create booking with `entitlement` payment -- entitlement consumed atomically
- [ ] Confirmation code generated in `BK-XXXX` format, unique within org
- [ ] `bookingEvent` with `eventType: 'created'` inserted on every booking creation
- [ ] Booking state machine rejects invalid transitions (e.g., `completed -> pending`)
- [ ] Non-owner/admin users get `PermissionDenied`
- [ ] Lane auto-assigned by `sortOrder` -- if no lane available, `NoLanesAvailable` error
- [ ] Unit tests pass for state machine, code generation, staff create paths
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test
```

### Manual verification

```bash
# After starting dev server, create a staff booking via action
# Verify booking row in DB with correct status, confirmationCode, bookerType
```

## Notes

- `SELECT FOR UPDATE` on the resource row during lane assignment to prevent double-booking under concurrency. Drizzle supports `FOR UPDATE` via raw SQL in transaction.
- The confirmation code collision retry should cap at 5 attempts -- with 36^4 = 1.6M possibilities per org, collision is extremely unlikely.
- Stripe payment path for staff booking creates a charge on the Connect account directly (not Checkout), but this can be deferred to a later issue if needed -- design says staff can use `cash`/`free` as minimum viable.
