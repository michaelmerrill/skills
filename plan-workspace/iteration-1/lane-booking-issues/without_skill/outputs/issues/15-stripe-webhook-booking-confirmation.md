# Issue 15: Stripe Webhook -- Booking Payment Confirmation

## Summary

Handle the `checkout.session.completed` Stripe webhook event to confirm pending bookings after successful payment.

## Context

The app already has Stripe webhook handling at `apps/web/src/app/api/webhooks/stripe/`. This issue adds a handler for booking-related checkout completions on connected accounts.

## Requirements

### Webhook Handler

Add booking payment handling to the existing Stripe webhook route (or create a new Connect webhook route if needed).

When `checkout.session.completed` is received:

1. Extract `bookingId` from `session.metadata`
2. If no `bookingId` in metadata, skip (not a booking-related session)
3. Look up booking by ID
4. If booking status is not `pending`: ignore (idempotent)
5. In a transaction:
   - UPDATE booking: `status` -> `confirmed`, set `stripePaymentIntentId` from session
   - INSERT `bookingEvent` with `eventType: 'payment_received'`
   - INSERT `bookingEvent` with `eventType: 'confirmed'`
6. Trigger confirmation email (Issue 16)

### Edge Cases

- **Already confirmed**: Skip silently (idempotent)
- **Already cancelled**: If booking was cancelled before payment completed, initiate Stripe refund via Connect account. Log a `bookingEvent` with `eventType: 'refunded'`
- **Double webhook**: The unique index on `stripeCheckoutSessionId` prevents duplicate processing. Check booking status before updating.

### Webhook Verification

Use Stripe's webhook signature verification. The Connect account webhook needs the correct endpoint secret.

### Function

```typescript
export const handleBookingCheckoutCompleted = (
  session: Stripe.Checkout.Session,
): Effect<void, DatabaseError | StripeError>
```

## Files to Modify

- **Modify**: `apps/web/src/app/api/webhooks/stripe/route.ts` (or equivalent) -- add booking checkout handler
- **Create or modify**: `apps/web/src/lib/bookings.ts` -- add `confirmBookingPayment` function

## Acceptance Criteria

- [ ] `checkout.session.completed` with booking metadata triggers booking confirmation
- [ ] Booking status transitions from `pending` to `confirmed`
- [ ] `stripePaymentIntentId` saved on booking record
- [ ] Two `bookingEvent` records created: `payment_received` and `confirmed`
- [ ] Idempotent: duplicate webhooks don't cause errors
- [ ] Cancelled booking with completed payment triggers refund
- [ ] Webhook signature verified

## Dependencies

- Issue 1 (schema)
- Issue 7 (state machine)
- Issue 13 (walk-in creates pending bookings with Stripe)
