# Confirmation Email with QR Code

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 11 of 11
> Type: AFK

## Blocked by

- [09-stripe-checkout-webhook.md](./09-stripe-checkout-webhook.md) -- needs confirmed bookings (both immediate and webhook-confirmed) to trigger emails

## What to build

Send confirmation emails when a booking is confirmed. The email includes: booking details (date, time, location, lane type), confirmation code in large text, and a QR code encoding the confirmation code for fast check-in scanning. Create a React Email template for booking confirmation. Wire email sending into: (1) `createBooking` when status is immediately `confirmed` (entitlement/cash/free), (2) `confirmBookingPayment` webhook handler when Stripe payment completes. Also send a cancellation email when a booking is cancelled.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add email sending after booking confirmation: call `sendEmail` with `BookingConfirmationEmail` template. Wire into `createBooking` (when status = confirmed) and `confirmBookingPayment`. Add cancellation email in `cancelBooking`. |
| `packages/email/src/index.ts` | Export `BookingConfirmationEmail`, `bookingConfirmationPlaintext`, `BookingCancellationEmail`, `bookingCancellationPlaintext` |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `packages/email/src/templates/booking-confirmation.tsx` | React Email template for booking confirmation with QR code | Follow `packages/email/src/templates/invitation.tsx` for email template structure |
| `packages/email/src/templates/booking-cancellation.tsx` | React Email template for booking cancellation | Follow `packages/email/src/templates/invitation.tsx` |

## Context

### Patterns to follow
- `packages/email/src/index.ts` (lines 1-11): barrel exports for email templates.
- `packages/email/src/send.ts` (lines 1-19): `sendEmail(client, params)` with `react` element, `text` plaintext, `from`, `to`, `subject`.
- `apps/web/src/lib/services.ts` (lines 57-64): Effect-based `sendEmail(params)` that depends on `ResendClient`.

### Key types
```typescript
// Email template props
type BookingConfirmationEmailProps = {
  customerName: string;
  confirmationCode: string;       // "BK-A1B2"
  bookingDate: string;             // "March 25, 2026"
  bookingTime: string;             // "2:00 PM - 3:00 PM"
  locationName: string;
  resourceTypeName: string;        // "Pistol Lane"
  orgName: string;
  qrCodeDataUrl: string;           // Base64 QR code image
};

// SendEmailParams (from packages/email/src/send.ts)
type SendEmailParams = {
  from: string;
  to: string;
  subject: string;
  react: React.ReactElement;
  text?: string;
};
```

### Wiring notes
- QR code generation: use a library like `qrcode` to generate a base64 data URL of the confirmation code string. The QR simply encodes the text `BK-XXXX` (or a URL like `https://<orgSlug>.rangeops.com/book/checkin?code=BK-XXXX`).
- Email sending in Effect: `bookings.ts` already has access to `DbService`. It needs `ResendClient` added to its dependencies. Import `sendEmail` from `@/lib/services`.
- Cancellation email: simpler template, just confirms the cancellation and shows refund status if applicable.
- Email `to` address: `customer.email`. If customer has no email (shouldn't happen for walk-ins, might for some staff bookings), skip email silently.

## Acceptance criteria

- [ ] Confirmation email sent when booking status becomes `confirmed` (immediate or webhook)
- [ ] Email contains: customer name, confirmation code, date/time, location, resource type
- [ ] Email contains QR code image encoding the confirmation code
- [ ] Plaintext version of email included for non-HTML clients
- [ ] Cancellation email sent when booking is cancelled
- [ ] Cancellation email mentions refund status (refunded / no refund / entitlement restored)
- [ ] No email sent if customer has no email address (graceful skip)
- [ ] React Email templates render correctly in email preview
- [ ] `bunx biome check` passes (both `apps/web` and `packages/email`)
- [ ] `bun run build` passes
- [ ] `bun test` passes

## Verification

```bash
cd packages/email
bunx biome check src/templates/booking-confirmation.tsx src/templates/booking-cancellation.tsx
cd ../../apps/web
bunx biome check src/lib/bookings.ts
bun run build
bun test
```

### Manual verification
1. Create a booking with `paymentMethod: 'free'` -- check email inbox for confirmation
2. Complete a Stripe Checkout walk-in booking -- check email after webhook fires
3. Cancel a booking -- check email inbox for cancellation notice
4. Scan the QR code in the confirmation email -- should resolve to the confirmation code text

## Notes

- QR code package: `qrcode` (npm) supports `toDataURL()` for base64 PNG generation. Add as a dependency to `apps/web`.
- Email templates use React Email components (`@react-email/components`). The QR code is an `<Img>` component with `src={qrCodeDataUrl}`.
- Keep email templates minimal -- avoid heavy styling that email clients strip. Follow the existing invitation email template's style.
