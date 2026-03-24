# Stripe Checkout + Webhook for Booking Payment

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 9 of 11
> Type: AFK

## Blocked by

- [08-walkin-public-route.md](./08-walkin-public-route.md) -- needs walk-in booking creation flow that produces `pending` bookings requiring payment

## What to build

Wire Stripe Checkout for booking payments. Create `createBookingCheckoutSession` that creates a Stripe Checkout session on the org's Connect account with booking metadata. Handle the `checkout.session.completed` webhook event: look up the booking by `stripeCheckoutSessionId`, transition from `pending` to `confirmed`, record `stripePaymentIntentId`, and emit `payment_received` + `confirmed` booking events. Handle the case where a booking was cancelled before payment completed (issue refund). Also wire Stripe into the member booking flow for the "needs payment" fallback when entitlements are insufficient.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `createBookingCheckoutSession(bookingId, orgId)`: fetches booking, creates Stripe Checkout session on Connect account, stores `stripeCheckoutSessionId` on booking. Add `confirmBookingPayment(stripeSessionId)`: webhook handler logic for `checkout.session.completed`. |
| `apps/web/src/lib/stripe.ts` | Add `createConnectCheckoutSession(data)` helper that creates a Checkout session on a connected account (after line ~334). Reuse `withConnectedAccount` helper (line 70). |
| `apps/web/src/app/[orgSlug]/(public)/book/actions.ts` | Update walk-in booking action to call `createBookingCheckoutSession` after creating the pending booking, return Stripe Checkout URL for redirect. |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Update member booking action: when `createMemberBooking` returns `{ needsPayment: true }`, call `createBookingCheckoutSession` and return Stripe URL. |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/api/webhooks/stripe/route.ts` | Stripe webhook handler for `checkout.session.completed` on connected accounts | Follow existing webhook pattern -- if no existing Stripe webhook route, create new one with signature verification using `stripe.webhooks.constructEvent` |

## Context

### Patterns to follow
- `apps/web/src/lib/stripe.ts` (lines 70-78): `withConnectedAccount(orgId)` helper that resolves `externalAccountId` from `organizationPaymentAccount`.
- `apps/web/src/lib/stripe.ts` (lines 85-142): `createSaasCheckoutSession` -- creates a Stripe Checkout session with `mode`, `line_items`, `success_url`, `cancel_url`, `metadata`. Use same pattern but with `stripeAccount` parameter for Connect.
- `apps/web/src/lib/subscriptions.ts` (lines 22-76): transactional status update + event insert pattern (update booking status, then insert bookingEvent).

### Key types
```typescript
// Stripe Checkout session creation for booking
type CreateBookingCheckoutData = {
  bookingId: string;
  orgId: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

// Stripe Checkout session.metadata
// { bookingId: string, orgId: string }

// Webhook handler signature
function confirmBookingPayment(stripeSessionId: string): Effect<void, BookingNotFound | DatabaseError>
```

### Wiring notes
- Stripe Checkout on Connect account: `stripe.checkout.sessions.create({ ..., stripeAccount: connectedAccountId })`.
- Webhook: Stripe sends `checkout.session.completed` events for connected accounts. Verify signature with the webhook secret. Extract `bookingId` from `session.metadata`.
- Idempotency: if booking status is already `confirmed`, skip (double webhook delivery).
- If booking was `cancelled` before payment, issue refund: `stripe.refunds.create({ payment_intent: session.payment_intent }, { stripeAccount: connectedAccountId })`.
- `success_url` for walk-in: `/<orgSlug>/book/confirmation?code=<confirmationCode>`.
- `success_url` for member: `/<orgSlug>/bookings/history?booked=<confirmationCode>`.

## Acceptance criteria

- [ ] Walk-in booking redirects to Stripe Checkout on the org's Connect account
- [ ] Stripe Checkout session created with correct `amountCents`, `currency`, `metadata.bookingId`
- [ ] `stripeCheckoutSessionId` stored on booking record
- [ ] Webhook handler processes `checkout.session.completed` -- transitions booking `pending` -> `confirmed`
- [ ] `stripePaymentIntentId` stored on booking from completed session
- [ ] Two `bookingEvent` records: `payment_received` then `confirmed`
- [ ] Idempotent: duplicate webhook delivery does not error or double-confirm
- [ ] If booking was cancelled before payment: refund issued via Stripe
- [ ] Member booking with insufficient entitlement redirects to Stripe Checkout
- [ ] Webhook signature verified with `stripe.webhooks.constructEvent`
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun test` passes

## Verification

```bash
cd apps/web
bunx biome check src/lib/bookings.ts src/lib/stripe.ts src/app/api/webhooks/stripe/
bun run build
bun test
```

### Manual verification
1. Create a walk-in booking on the public page
2. Confirm redirect to Stripe Checkout
3. Complete payment in Stripe test mode
4. Verify booking status transitions to `confirmed`
5. Check `bookingEvent` table for `payment_received` and `confirmed` entries

## Notes

- The webhook endpoint needs the raw request body for signature verification. Next.js App Router routes can access the raw body via `request.text()`.
- Use Stripe test mode webhooks (stripe CLI `stripe listen --forward-to`) for local development.
- The `amountCentsPaid` on the booking is a snapshot -- set from the `offeringPrice.amountCents` at booking time, not from Stripe's actual charge amount.
