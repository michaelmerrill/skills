# Check-in + Cancellation + No-show Operations

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 10 of 11
> Type: AFK

## Blocked by

- [09-stripe-checkout-webhook.md](./09-stripe-checkout-webhook.md) -- needs confirmed bookings with Stripe payment data for cancellation/refund testing

## What to build

Implement the operational booking lifecycle: check-in (staff scans QR code or searches confirmation code), cancellation (with conditional refund based on `cancellationWindowMinutes`), no-show marking, and completion. Create `checkInBooking`, `cancelBooking`, `markNoShow`, `completeBooking` Effect functions with state machine enforcement. Add a staff search-by-confirmation-code endpoint. Update the bookings dashboard page with today's bookings view, status badges, and action buttons.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `checkInBooking(orgId, confirmationCode)`: look up by code, validate status is `confirmed`, validate time window (30 min before to slot end), transition to `checked_in`. Add `cancelBooking(data)`: validate status, check refund window, call Stripe refund or `reverseConsumption`, transition to `cancelled`. Add `markNoShow(orgId, bookingId)`: validate status is `confirmed` and slot time has passed. Add `completeBooking(orgId, bookingId)`: transition `checked_in` -> `completed`. |
| `apps/web/src/lib/stripe.ts` | Add `createConnectRefund(paymentIntentId, connectedAccountId)` helper (after line ~334) for refunding booking payments on Connect accounts |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Add server actions: `checkIn`, `cancelBooking`, `markNoShow`, `completeBooking`, `searchByConfirmationCode` |
| `apps/web/src/app/[orgSlug]/bookings/page.tsx` | Enhance dashboard: show today's bookings with status badges, action buttons (check-in, cancel, no-show), confirmation code search bar |
| `apps/web/src/lib/validation.ts` | Add `checkInBookingSchema`, `cancelBookingSchema`, `markNoShowSchema` |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/__tests__/bookings/booking-operations.test.ts` | Tests for check-in, cancellation (within/outside refund window), no-show, completion, state machine enforcement | Follow `apps/web/src/__tests__/settings/subscription-events.test.ts` |

## Context

### Patterns to follow
- `apps/web/src/lib/subscriptions.ts` (lines 13-76): state machine with `VALID_TRANSITIONS`, transactional status update + event insert.
- `apps/web/src/lib/stripe.ts` (lines 315-334): `createConnectLoginLink` pattern for Stripe operations on connected accounts.
- `apps/web/src/lib/entitlements.ts` (lines 302-371): `reverseConsumption` for restoring entitlement balance on cancellation.

### Key types
```typescript
// Check-in
function checkInBooking(orgId: string, confirmationCode: string): Effect<void, BookingNotFound | InvalidBookingTransition | DatabaseError>

// Cancellation
type CancelBookingData = {
  orgId: string;
  bookingId: string;
  actorId?: string; // staff or member who cancelled
};
function cancelBooking(data: CancelBookingData): Effect<void, BookingNotFound | InvalidBookingTransition | StripeError | DatabaseError>

// Cancellation refund logic:
// 1. Check bookingRules.cancellationWindowMinutes
// 2. If startTime - now() > cancellationWindowMinutes: eligible for refund
// 3. If paymentMethod === 'stripe': stripe.refunds.create on Connect account
// 4. If paymentMethod === 'entitlement': reverseConsumption()
// 5. If paymentMethod === 'cash' or 'free': no refund action needed

// No-show
function markNoShow(orgId: string, bookingId: string): Effect<void, BookingNotFound | InvalidBookingTransition | DatabaseError>
// Validates: status === 'confirmed' AND endTime < now()
```

### Wiring notes
- Check-in time window: `startTime - 30min <= now() <= endTime`. The 30-minute early check-in buffer is hardcoded for v1.
- Cancellation refund window: `booking.startTime - now() > bookingRules.cancellationWindowMinutes`. If outside window, cancel but no refund; record "outside refund window" in `bookingEvent.metadata`.
- Stripe refund: `stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId }, { stripeAccount: connectedAccountId })`.
- Entitlement reversal: call `reverseConsumption(orgId, booking.customerId, booking.entitlementGrantId, 1, 'Booking cancelled')`.
- No-show: only allowed after booking slot has passed (`booking.endTime < now()`).

## Acceptance criteria

- [ ] Check-in by confirmation code: transitions `confirmed` -> `checked_in`
- [ ] Check-in validates time window (30 min before start to end time)
- [ ] Check-in rejects bookings not in `confirmed` status
- [ ] Cancellation transitions `confirmed` or `pending` -> `cancelled`
- [ ] Cancellation within refund window: Stripe refund issued for `stripe` payment method
- [ ] Cancellation within refund window: entitlement reversed for `entitlement` payment method
- [ ] Cancellation outside refund window: no refund, metadata records reason
- [ ] No-show marking: transitions `confirmed` -> `no_show` only after slot end time
- [ ] Completion: transitions `checked_in` -> `completed`
- [ ] All transitions write `bookingEvent` records
- [ ] Confirmation code search returns booking details
- [ ] Dashboard shows today's bookings with status badges and action buttons
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun test` passes

## Verification

```bash
cd apps/web
bunx biome check src/lib/bookings.ts src/lib/stripe.ts src/app/\[orgSlug\]/bookings/
bun run build
bun test src/__tests__/bookings/booking-operations.test.ts
```

### Manual verification
1. Create a confirmed booking for the current time
2. Search by confirmation code on dashboard -- booking found
3. Click check-in -- status changes to `checked_in`
4. Create another booking for future time, cancel it -- refund issued if within window
5. Create a confirmed booking for past time, mark as no-show -- status changes

## Notes

- QR code scanning is handled client-side (camera API) and simply extracts the confirmation code text, which is then searched via the same `searchByConfirmationCode` endpoint.
- The "today's bookings" dashboard query filters `booking.startTime` within today's date range in the org's timezone.
