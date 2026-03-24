# Staff Booking CRUD

> Part of: [Lane Booking](../../../../../../architect-workspace/iteration-1/lane-booking-design/with_skill/outputs/design.md)
> Issue: 2 of 8
> Type: AFK

## Blocked by

- [01-booking-schema.md](./01-booking-schema.md) -- needs `booking` and `bookingEvent` tables, enums, and ID prefixes

## What to build

Implement the core booking service with `createBooking` (staff path), booking state machine, and `generateConfirmationCode`. Staff (owner/admin) can create bookings for customers with `cash` or `free` payment methods. Includes server action, Zod validation schemas for staff booking input, and unit tests for creation, state machine transitions, and confirmation code generation. No UI page yet (that comes with the feature flag gate in #4).

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/bookings.ts` | Booking service: `createBooking`, `generateConfirmationCode`, state machine helpers | Follow `apps/web/src/lib/entitlements.ts` (line 19-92 for Effect.gen + transaction pattern) |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Server actions: `createStaffBookingAction` | Follow `apps/web/src/app/[orgSlug]/customers/actions.ts` (line 1-70 for action + error handling pattern) |
| `apps/web/src/__tests__/bookings/staff-booking.test.ts` | Tests: staff creation, state machine, confirmation code | Follow `apps/web/src/__tests__/settings/entitlement-ledger.test.ts` (line 1-60 for test setup pattern) |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/errors.ts` | Add `BookingNotFound`, `BookingConflict`, `NoLanesAvailable`, `InvalidBookingTransition` error classes after `InsufficientEntitlement` (line ~72) |
| `apps/web/src/lib/validation.ts` | Add `createStaffBookingSchema` with fields: `orgId`, `locationId`, `resourceTypeId`, `customerId`, `startTime`, `endTime`, `paymentMethod` (cash|free), `notes` -- after `BookingRules` type |

## Context

### Patterns to follow
- `apps/web/src/lib/entitlements.ts` lines 19-92: `grantEntitlement` shows Effect.gen + db.transaction pattern with insert + ledger write.
- `apps/web/src/app/[orgSlug]/customers/actions.ts` lines 42-70: server action with Zod parse, session check, Effect pipe with `AppLive` + `CurrentSession`, `revalidatePath`.
- `apps/web/src/lib/customers.ts` lines 28-43: `getMemberRole` helper for permission check.

### Key types
```typescript
// State machine — valid transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

// Confirmation code generator
export const generateConfirmationCode = (orgId: string): Effect<string, DatabaseError>
// Format: "BK-XXXX" where X is alphanumeric uppercase
// Retry loop on collision within org (SELECT exists check)

// Staff booking creation
export const createBooking = (data: CreateStaffBookingData): Effect<Booking, BookingError>
```

### Wiring notes
- `createBooking` must: validate role (owner/admin), check lane availability (simple count query for now -- full engine in #3), generate confirmation code, INSERT `booking` with `status: 'confirmed'` + `bookerType: 'staff'`, INSERT `bookingEvent` with `eventType: 'created'`, all in a single transaction.
- Permission check: reuse `getMemberRole` pattern from `customers.ts` (line 28). Staff = owner or admin role.

## Acceptance criteria

- [ ] `createBooking` creates a booking with status `confirmed` for staff-initiated bookings
- [ ] Confirmation code format `BK-XXXX` generated and unique within org
- [ ] `bookingEvent` with `eventType: 'created'` inserted alongside booking
- [ ] State machine rejects invalid transitions (e.g., `completed` -> `confirmed`)
- [ ] Permission denied for `member` role attempting staff booking
- [ ] Tests pass for: staff creation (cash), staff creation (free), state machine valid/invalid transitions, confirmation code generation
- [ ] `biome check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web && bun run test -- --grep "staff-booking"
bun run lint
bun run build
```
