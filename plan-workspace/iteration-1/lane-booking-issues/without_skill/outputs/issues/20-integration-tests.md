# Issue 20: Booking Integration and E2E Tests

## Summary

Write integration tests for Stripe webhook handling and entitlement booking flow, plus end-to-end test scaffolding for the main user journeys.

## Context

Integration tests verify cross-service behavior (Stripe + booking, entitlement + booking). E2E tests verify the full user flow through the UI. The testing strategy in the design doc specifies both.

## Requirements

### Integration Tests

Create under `apps/web/src/__tests__/bookings/`:

#### `stripe-booking-webhook.test.ts`
- `checkout.session.completed` with valid booking metadata confirms pending booking
- Webhook with already-confirmed booking is idempotent (no error, no change)
- Webhook for cancelled booking triggers refund
- Webhook with no booking metadata is ignored
- `stripePaymentIntentId` saved on booking record
- Two `bookingEvent` entries created (`payment_received`, `confirmed`)
- Duplicate webhook delivery handled gracefully

#### `entitlement-booking.test.ts`
- Member booking consumes entitlement and reduces balance
- Cancellation of entitlement booking reverses consumption and restores balance
- Booking with expired entitlement falls back to Stripe
- Concurrent entitlement consumption is serialized (second booking sees reduced balance)

### E2E Test Scaffolding

Create under `e2e/bookings/` (or appropriate e2e directory):

#### `public-booking.spec.ts`
- Navigate to public booking page
- Select location, lane type, date, time slot
- Fill in walk-in details
- Submit redirects to Stripe Checkout (mock or verify URL)
- After payment, confirmation page shows code

#### `staff-booking.spec.ts`
- Staff navigates to bookings page
- Creates a new cash booking
- Booking appears in list with correct status
- Staff can view booking details

#### `checkin.spec.ts`
- Staff enters confirmation code
- Check-in succeeds and status updates
- Invalid code shows error

Note: E2E tests may require Stripe test mode configuration. Scaffold the tests even if Stripe interactions need mocking.

## Files to Create

- `apps/web/src/__tests__/bookings/stripe-booking-webhook.test.ts`
- `apps/web/src/__tests__/bookings/entitlement-booking.test.ts`
- `e2e/bookings/public-booking.spec.ts` (or equivalent path)
- `e2e/bookings/staff-booking.spec.ts`
- `e2e/bookings/checkin.spec.ts`

## Acceptance Criteria

- [ ] Stripe webhook integration tests cover confirmation, idempotency, and refund-on-cancel
- [ ] Entitlement integration tests cover consume-on-book and reverse-on-cancel
- [ ] E2E test skeletons created for public booking, staff booking, and check-in flows
- [ ] Tests use Stripe test mode or appropriate mocks
- [ ] Test data setup follows existing helper patterns

## Dependencies

- Issue 15 (Stripe webhook)
- Issue 19 (unit tests establish test patterns and helpers)
