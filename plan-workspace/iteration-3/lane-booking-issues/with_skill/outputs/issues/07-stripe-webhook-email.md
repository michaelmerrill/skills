# Stripe Webhook + Confirmation Email

> Part of: [Lane Booking](../../../../../../architect-workspace/iteration-1/lane-booking-design/with_skill/outputs/design.md)
> Issue: 7 of 8
> Type: AFK

## Blocked by

- [06-walkin-public-booking.md](./06-walkin-public-booking.md) -- needs walk-in and member Stripe Checkout flows to produce `pending` bookings with `stripeCheckoutSessionId`

## What to build

Handle `checkout.session.completed` events on connected accounts to confirm pending bookings. Extract `bookingId` from session metadata, update booking status from `pending` to `confirmed`, record `stripePaymentIntentId`, insert `bookingEvent` entries for `payment_received` and `confirmed`. Send confirmation email with QR code of `confirmationCode` to the customer. Includes the booking confirmation email template and tests for webhook idempotency and email sending.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `packages/email/src/templates/booking-confirmation.tsx` | React Email template: booking details, QR code of confirmation code, org branding | Follow `packages/email/src/templates/invitation.tsx` for template structure |
| `apps/web/src/__tests__/bookings/stripe-booking-webhook.test.ts` | Tests: webhook confirms pending booking, idempotent on re-delivery, handles already-cancelled booking | Follow `apps/web/src/__tests__/settings/stripe-webhook.test.ts` for webhook test pattern |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/app/api/webhooks/stripe/route.ts` | Add `checkout.session.completed` case to `handleConnectEvent` (line ~158). Extract `bookingId` from `session.metadata`, look up booking, if `pending` then update to `confirmed`, insert events, send email. |
| `packages/email/src/index.ts` | Re-export `BookingConfirmationEmail` and `bookingConfirmationPlaintext` from new template |

## Context

### Patterns to follow
- `apps/web/src/app/api/webhooks/stripe/route.ts` lines 49-74: `handlePlatformEvent` `checkout.session.completed` case -- extract metadata, idempotent update pattern.
- `apps/web/src/app/api/webhooks/stripe/route.ts` lines 154-188: `handleConnectEvent` -- switch on event type, look up by connected account ID.
- `packages/email/src/templates/invitation.tsx`: React Email template pattern with exported component + plaintext function.

### Key types
```typescript
// In webhook handler:
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) break;
  // Look up booking by id
  // If status !== 'pending': skip (idempotent)
  // If status === 'cancelled': issue Stripe refund
  // Otherwise: update to 'confirmed', insert bookingEvents, send email
}

// Email template props
type BookingConfirmationEmailProps = {
  orgName: string;
  confirmationCode: string;  // BK-XXXX
  startTime: string;         // formatted datetime
  endTime: string;
  locationName: string;
  laneType: string;
  amountPaid: string;        // formatted currency
};
```

### Wiring notes
- QR code: use a QR code library (e.g., `qrcode` npm package) to generate a data URL of the confirmation code. Embed as `<img>` in the email template.
- Webhook must handle the case where booking was cancelled before payment completed: issue a Stripe refund via `stripe.refunds.create({ payment_intent: session.payment_intent }, { stripeAccount: connectedAccountId })`.
- Email sending: use the existing `sendEmail` Effect from `apps/web/src/lib/services.ts` (line 57-64). Call it outside the transaction since email is not transactional.

## Acceptance criteria

- [ ] `checkout.session.completed` on connected account confirms pending booking
- [ ] `stripePaymentIntentId` stored on booking
- [ ] `bookingEvent` entries created for `payment_received` and `confirmed`
- [ ] Idempotent: re-delivery of same event does not duplicate events or update already-confirmed booking
- [ ] Cancelled booking + late payment triggers Stripe refund
- [ ] Confirmation email sent with QR code of `confirmationCode`
- [ ] Email template renders booking details correctly
- [ ] Tests pass for: happy path, idempotent re-delivery, cancelled-before-payment
- [ ] `biome check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web && bun run test -- --grep "stripe-booking-webhook"
bun run lint
bun run build
```
