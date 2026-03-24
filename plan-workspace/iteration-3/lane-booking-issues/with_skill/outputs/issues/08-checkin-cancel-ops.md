# Check-in + Cancellation + Operations

> Part of: [Lane Booking](../../../../../../architect-workspace/iteration-1/lane-booking-design/with_skill/outputs/design.md)
> Issue: 8 of 8
> Type: HITL

## Blocked by

- [02-staff-booking-crud.md](./02-staff-booking-crud.md) -- needs booking state machine and `createBooking` service
- [07-stripe-webhook-email.md](./07-stripe-webhook-email.md) -- needs confirmed bookings (via webhook) to check in against

## What to build

Implement check-in flow (QR scan / confirmation code lookup), no-show marking, cancellation with conditional refund, and the operational dashboard enhancements. Staff can search by confirmation code, check in confirmed bookings within the time window, mark no-shows after slot time, and cancel bookings (with Stripe refund or entitlement reversal based on policy). The bookings page gets a "today's bookings" view with status filters and basic stats. HITL because the operational dashboard layout and check-in UX need human review.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/components/bookings/booking-table.tsx` | Client component: booking list with status badges, actions (check-in, cancel, no-show) | Follow `apps/web/src/components/customers/customers-table.tsx` for data table + action pattern |
| `apps/web/src/__tests__/bookings/booking-operations.test.ts` | Tests: check-in, no-show, cancellation with refund, cancellation with entitlement reversal, cancellation outside refund window | Follow `apps/web/src/__tests__/settings/entitlement-ledger.test.ts` for setup |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `checkInBooking`, `cancelBooking`, `markNoShow` functions. `cancelBooking` checks `bookingRules.cancellationWindowMinutes`, issues Stripe refund if `paymentMethod: 'stripe'` and within window, calls `reverseConsumption` if `paymentMethod: 'entitlement'`. |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Add `checkInBookingAction`, `cancelBookingAction`, `markNoShowAction`, `searchBookingByCodeAction` server actions |
| `apps/web/src/app/[orgSlug]/bookings/page.tsx` | Enhance with today's bookings list, search-by-code input, status filters, basic stats (total today, checked in, pending) |
| `apps/web/src/lib/validation.ts` | Add `checkInBookingSchema` (orgId, confirmationCode), `cancelBookingSchema` (orgId, bookingId), `markNoShowSchema` (orgId, bookingId) |

## Context

### Patterns to follow
- `apps/web/src/lib/entitlements.ts` lines 302-371: `reverseConsumption` -- atomic balance restoration + ledger entry. Called from `cancelBooking` when `paymentMethod: 'entitlement'`.
- `apps/web/src/lib/stripe.ts` lines 70-78: `withConnectedAccount` -- get connected account ID for Stripe refund.
- `apps/web/src/lib/bookings.ts` (from #2): state machine `VALID_TRANSITIONS` for enforcing `confirmed` -> `checked_in`, `confirmed` -> `cancelled`.

### Key types
```typescript
export const checkInBooking = (data: {
  orgId: string;
  confirmationCode: string;
}): Effect<Booking, BookingNotFound | InvalidBookingTransition | DatabaseError>
// 1. SELECT booking WHERE orgId AND confirmationCode
// 2. Validate status === 'confirmed'
// 3. Validate time window: startTime - 30min <= now <= endTime
// 4. UPDATE status -> 'checked_in'
// 5. INSERT bookingEvent 'checked_in'

export const cancelBooking = (data: {
  orgId: string;
  bookingId: string;
}): Effect<void, BookingNotFound | InvalidBookingTransition | StripeError | DatabaseError>
// 1. Validate status in ('confirmed', 'pending')
// 2. Check cancellationWindowMinutes from bookingRules
// 3. If paymentMethod === 'stripe' && within window: stripe.refunds.create on Connect
// 4. If paymentMethod === 'entitlement': reverseConsumption()
// 5. UPDATE status -> 'cancelled'
// 6. INSERT bookingEvent 'cancelled', metadata: { refundIssued, outsideWindow }

export const markNoShow = (data: {
  orgId: string;
  bookingId: string;
}): Effect<void, BookingNotFound | InvalidBookingTransition | DatabaseError>
// Validate status === 'confirmed' and endTime < now
// UPDATE status -> 'no_show', INSERT bookingEvent
```

### Wiring notes
- Stripe refund on Connect: `stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId }, { stripeAccount: connectedAccountId })`.
- Entitlement reversal: call `reverseConsumption(orgId, customerId, booking.entitlementGrantId, 1, "Booking cancelled")` from `apps/web/src/lib/entitlements.ts` (line 302).
- Cancellation outside refund window: still cancel the booking but skip the refund. Store `{ outsideRefundWindow: true }` in `bookingEvent.metadata`.
- Permissions: `checkInBooking` and `markNoShow` require owner/admin. `cancelBooking` allows the booking's customer (member) to cancel their own confirmed booking.
- Add `booking` resource to `apps/web/src/lib/permissions.ts` statements (line ~6).

## Acceptance criteria

- [ ] Staff can search by confirmation code to find a booking
- [ ] Check-in succeeds for `confirmed` booking within time window (30 min before start to end)
- [ ] Check-in fails for booking outside time window
- [ ] Check-in fails for non-`confirmed` booking
- [ ] Staff can mark no-show after slot time for `confirmed` booking
- [ ] Cancellation of `confirmed` Stripe booking within refund window issues Stripe refund
- [ ] Cancellation of `confirmed` entitlement booking reverses consumption
- [ ] Cancellation outside refund window cancels booking without refund, records in metadata
- [ ] Member can cancel their own confirmed booking
- [ ] `bookingEvent` entries created for all operations
- [ ] `booking` resource added to permissions with: `create`, `read`, `update`, `cancel`, `check_in`, `list`
- [ ] Tests pass for: check-in, no-show, cancel with Stripe refund, cancel with entitlement reversal, cancel outside window
- [ ] `biome check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web && bun run test -- --grep "booking-operations"
bun run lint
bun run build
```

### Manual verification
1. Create a confirmed booking via staff
2. Search by confirmation code on bookings page
3. Click check-in -- status changes to `checked_in`
4. Create another booking, let time pass, mark no-show
5. Create a Stripe-paid booking, cancel within window -- refund issued
6. Create a Stripe-paid booking, cancel outside window -- no refund, metadata records it
