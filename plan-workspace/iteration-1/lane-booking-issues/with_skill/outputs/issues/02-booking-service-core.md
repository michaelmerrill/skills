# Booking Service Core + Confirmation Codes

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 2 of 11
> Type: AFK

## Blocked by

- [01-booking-schema-enums.md](./01-booking-schema-enums.md) -- needs `booking` and `bookingEvent` tables + enums

## What to build

Create the core booking service module with: `createBooking` orchestrator (inserts booking + bookingEvent in a transaction), `generateConfirmationCode` (BK-XXXX format, retry on collision), booking status state machine (validates transitions), and tagged error types (`BookingNotFound`, `BookingConflict`, `InvalidBookingTransition`). Also create Zod validation schemas for booking input data. This is the foundation all other booking issues build on.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/errors.ts` | Add `BookingNotFound`, `BookingConflict`, `InvalidBookingTransition`, `NoLanesAvailable` error classes (after line ~72, follow `Data.TaggedError` pattern) |
| `apps/web/src/lib/validation.ts` | Add `createBookingSchema`, `CreateBookingData`, `cancelBookingSchema`, `CancelBookingData`, `checkInBookingSchema`, `CheckInBookingData` Zod schemas (after line ~362) |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/bookings.ts` | Core booking service: `createBooking`, `generateConfirmationCode`, state machine, `getBookingByConfirmationCode` | Follow `apps/web/src/lib/subscriptions.ts` for Effect service pattern with `VALID_TRANSITIONS` map and transactional writes |
| `apps/web/src/__tests__/bookings/booking-core.test.ts` | Unit tests for booking creation, state machine, confirmation code generation | Follow `apps/web/src/__tests__/settings/subscription-events.test.ts` pattern |

## Context

### Patterns to follow
- `apps/web/src/lib/subscriptions.ts` (lines 13-76): `VALID_TRANSITIONS` record, `Effect.gen`, `db.transaction`, insert into event table after status update.
- `apps/web/src/lib/entitlements.ts` (lines 19-92): transactional insert with `.returning()`, Effect service consuming `DbService`.
- `apps/web/src/lib/errors.ts` (lines 1-72): `Data.TaggedError` pattern for all error types.

### Key types
```typescript
// State machine
const VALID_BOOKING_TRANSITIONS: Record<string, Set<string>> = {
  pending:    new Set(["confirmed", "cancelled"]),
  confirmed:  new Set(["checked_in", "cancelled", "no_show"]),
  checked_in: new Set(["completed"]),
  completed:  new Set(),
  cancelled:  new Set(),
  no_show:    new Set(),
};

// Confirmation code format
function generateConfirmationCode(orgId: string): Effect<string, DatabaseError>
// Returns "BK-" + 4 alphanumeric chars, retries on collision within org

// Core orchestrator signature
function createBooking(data: CreateBookingData): Effect<Booking, BookingError>
```

### Wiring notes
- `createBooking` must INSERT into `booking` and `bookingEvent` in a single transaction.
- `generateConfirmationCode` queries `booking` table for uniqueness within org before returning.
- The service depends only on `DbService` -- no Stripe, no entitlements at this layer.

## Acceptance criteria

- [ ] `createBooking` inserts booking + bookingEvent atomically in a transaction
- [ ] `generateConfirmationCode` produces `BK-XXXX` format (4 alphanumeric uppercase chars)
- [ ] Confirmation code retries on collision (loop until unique within org)
- [ ] State machine rejects invalid transitions (e.g., `completed` -> `pending`)
- [ ] State machine allows valid transitions (e.g., `pending` -> `confirmed`)
- [ ] `getBookingByConfirmationCode(orgId, code)` returns booking or `BookingNotFound`
- [ ] Zod schemas validate all booking input fields
- [ ] Unit tests cover: creation, state machine valid/invalid transitions, code generation format
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes (from `apps/web`)
- [ ] `bun test` passes (from `apps/web`)

## Verification

```bash
cd apps/web
bunx biome check src/lib/bookings.ts src/lib/errors.ts src/lib/validation.ts
bun run build
bun test src/__tests__/bookings/
```

## Notes

- `createBooking` at this layer does NOT handle payment, entitlements, or lane assignment -- those are layered on by subsequent issues.
- The `bookerType` and `paymentMethod` fields are passed in by the caller (staff/member/walk-in specific issues handle the logic).
- Keep confirmation code character set to `[A-Z0-9]` excluding ambiguous chars (0/O, 1/I/L) for readability.
