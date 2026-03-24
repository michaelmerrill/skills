# Stripe Webhook + Booking Confirmation

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 6 of 7
> Type: AFK

## Blocked by

- [05-walkin-public-booking.md](./05-walkin-public-booking.md) -- needs walk-in booking creation with `pending` status and Stripe Checkout session containing `bookingId` in metadata

## What to build

Extend the existing Stripe webhook handler to process `checkout.session.completed` events for booking payments on connected accounts. On payment confirmation: look up booking by ID from session metadata, transition from `pending` to `confirmed`, record `stripePaymentIntentId`, insert `bookingEvent` entries for `payment_received` and `confirmed`. If booking was already cancelled before payment completed, issue a Stripe refund. Send confirmation email with the booking's `confirmationCode` rendered as a QR code. Write integration tests for the webhook handler and email sending.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/booking-emails.ts` | `sendBookingConfirmation(booking, customer, org)` -- confirmation email with QR code of confirmationCode | Follow `apps/web/src/lib/services.ts` lines 57-64 (`sendEmail` Effect function with `ResendClient`) |
| `apps/web/src/__tests__/bookings/stripe-booking-webhook.test.ts` | Tests: webhook confirms pending booking, idempotent on re-delivery, refund on cancelled booking | Follow `apps/web/src/__tests__/settings/stripe-webhook.test.ts` (webhook test pattern) |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/app/api/webhooks/stripe/route.ts` | Add booking confirmation case to `handleConnectEvent` (after `account.updated` case at line ~184): handle `checkout.session.completed` where `session.metadata.bookingId` is present |
| `apps/web/src/lib/bookings.ts` | Add `confirmBookingPayment(bookingId, orgId, stripePaymentIntentId)` function: idempotent status transition, event logging |
| `apps/web/src/app/[orgSlug]/(public)/book/success/page.tsx` | Booking confirmation success page (Stripe redirect lands here) |

## Context

### Patterns to follow

- `apps/web/src/app/api/webhooks/stripe/route.ts` lines 154-188: `handleConnectEvent` function. Currently handles `account.updated`. Add `checkout.session.completed` case that checks for `bookingId` in metadata.
- `apps/web/src/app/api/webhooks/stripe/route.ts` lines 49-74: Platform `checkout.session.completed` handler. Follow the idempotent pattern: extract metadata, look up entity, skip if already processed.
- `apps/web/src/lib/subscriptions.ts` lines 22-70: `transitionSubscriptionStatus` with transaction containing status update + event insert. Follow for `confirmBookingPayment`.
- `apps/web/src/lib/services.ts` lines 57-64: `sendEmail` Effect function using `ResendClient`.

### Key types

```typescript
// From existing webhook route (route.ts line 28)
let event: Stripe.Event;

// Stripe Checkout session metadata (set in issue #04/#05)
// session.metadata.bookingId: string
// session.metadata.orgId: string

// From booking schema (issue #01)
// booking.stripeCheckoutSessionId: text (nullable)
// booking.stripePaymentIntentId: text (nullable)
// booking.status: bookingStatusEnum

// Transition: pending -> confirmed
// bookingEvent entries: payment_received, then confirmed

// Email params (from @workspace/email package, used in services.ts line 1)
import type { SendEmailParams } from "@workspace/email";
```

### Wiring notes

- The webhook route uses raw `db` import (not Effect services) -- see `route.ts` line 5: `import { db } from "@/lib/db"`. The booking confirmation logic should follow the same pattern for consistency within the webhook handler (direct Drizzle, not Effect).
- Idempotency: check `booking.status !== 'pending'` before updating. The `stripeCheckoutSessionId` UNIQUE index (from issue #01) prevents double-processing.
- If booking is `cancelled` when webhook fires: issue refund via `stripe.refunds.create({ payment_intent: session.payment_intent }, { stripeAccount: connectedAccountId })`. Need to instantiate Stripe client with secret key (already done at route.ts line 10).
- QR code in email: use a QR code library (e.g., `qrcode`) to generate a data URL or inline SVG of the `confirmationCode`. The email template renders this as an `<img>` tag.
- The success page at `(public)/book/success/` is where Stripe redirects after payment. It should display the confirmation code and booking details. The `session_id` query param from Stripe can be used to look up the booking.

## Acceptance criteria

- [ ] `checkout.session.completed` webhook with `bookingId` in metadata transitions booking from `pending` to `confirmed`
- [ ] `stripePaymentIntentId` saved on booking record
- [ ] `bookingEvent` entries created for `payment_received` and `confirmed`
- [ ] Double webhook delivery is idempotent (already-confirmed booking is skipped)
- [ ] Cancelled booking with completed payment triggers Stripe refund
- [ ] Confirmation email sent to customer with booking details and QR code
- [ ] Success page renders after Stripe redirect with confirmation code
- [ ] Integration tests pass for webhook, idempotency, refund, and email
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
# Use Stripe CLI to forward webhooks locally:
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Create a walk-in booking, complete Stripe Checkout
# Verify:
# 1. Booking status changed to 'confirmed' in DB
# 2. bookingEvent rows: 'payment_received', 'confirmed'
# 3. Confirmation email received with QR code
# 4. Success page renders with confirmation code
```

## Notes

- The email package is at `@workspace/email` (monorepo package). Check if it supports HTML templates with inline images for QR codes, or if the QR needs to be a hosted URL.
- Stripe Connect webhook: the event has `event.account` set to the connected account ID (route.ts line 36). The booking confirmation handler only fires for connected account events, not platform events.
- The refund path (cancelled booking + payment completed) should log a `bookingEvent` with `eventType: 'refunded'` and include refund details in `metadata`.
