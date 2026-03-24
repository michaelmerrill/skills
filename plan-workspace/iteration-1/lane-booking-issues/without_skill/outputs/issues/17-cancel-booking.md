# Issue 17: Cancel Booking with Conditional Refund

## Summary

Implement booking cancellation logic that respects the cancellation window policy, issues Stripe refunds or reverses entitlement consumption when applicable.

## Context

Cancellation can be triggered by the booking customer (member or walk-in) or by staff. The `bookingRules.cancellationWindowMinutes` determines whether a refund is issued.

## Requirements

### Function Signature

```typescript
export const cancelBooking = (data: {
  orgId: string;
  bookingId: string;
  actorId?: string; // staff user ID or member user ID
}): Effect<void, BookingNotFound | InvalidBookingTransition | StripeError | DatabaseError>
```

### Logic

1. Look up booking by `(id, organizationId)`
2. Validate booking status is `confirmed` or `pending`
3. Fetch `bookingRules.cancellationWindowMinutes` from org settings
4. Determine refund eligibility: `booking.startTime - now() > cancellationWindowMinutes`
5. Handle payment reversal based on `paymentMethod`:
   - `stripe`:
     - If within refund window: create Stripe refund via Connect account using `stripePaymentIntentId`
     - If outside window: no refund, record in event metadata `{ reason: "outside refund window" }`
   - `entitlement`:
     - If within refund window: call `reverseConsumption()` from `entitlements.ts` using `entitlementGrantId`
     - If outside window: no reversal
   - `cash` / `free`: no refund action needed
6. In a transaction:
   - UPDATE booking: `status` -> `cancelled`
   - INSERT `bookingEvent` with `eventType: 'cancelled'`, metadata includes refund status
   - If refund issued: INSERT additional `bookingEvent` with `eventType: 'refunded'`
7. Trigger cancellation email (Issue 16)

### Zod Schema

```typescript
export const cancelBookingSchema = z.object({
  orgId: z.string().min(1),
  bookingId: z.string().min(1),
});
```

### Server Action

Add `cancelBookingAction` to the bookings actions file. Both staff and members can call it (members only for their own bookings).

## Files to Modify

- **Modify**: `apps/web/src/lib/bookings.ts` -- add `cancelBooking`
- **Modify**: `apps/web/src/lib/validation.ts` -- add `cancelBookingSchema`
- **Modify**: `apps/web/src/app/[orgSlug]/bookings/actions.ts` -- add `cancelBookingAction`

## Acceptance Criteria

- [ ] Confirmed and pending bookings can be cancelled
- [ ] Stripe refund issued for Stripe-paid bookings within refund window
- [ ] Entitlement reversed for entitlement-paid bookings within refund window
- [ ] No refund issued outside cancellation window, metadata records reason
- [ ] Booking status set to `cancelled`
- [ ] `bookingEvent` records created for cancellation and optional refund
- [ ] Cancellation email sent
- [ ] Members can only cancel their own bookings
- [ ] Staff can cancel any booking

## Dependencies

- Issue 1 (schema)
- Issue 2 (booking rules for cancellation window)
- Issue 7 (state machine)
- Issue 16 (cancellation email)
