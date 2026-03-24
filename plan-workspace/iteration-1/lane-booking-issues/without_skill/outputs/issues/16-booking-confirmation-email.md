# Issue 16: Booking Confirmation Email with QR Code

## Summary

Create the booking confirmation email template with a QR code of the confirmation code, and wire it into the booking creation and payment confirmation flows.

## Context

The app uses Resend for email via the `@workspace/email` package. Existing templates live in `packages/email/src/templates/`. The design requires a confirmation email with a QR code encoding the `confirmationCode` for fast check-in.

## Requirements

### Email Template

Create `packages/email/src/templates/booking-confirmation.tsx`:

Using React Email (the existing template pattern):
- Subject: "Booking Confirmed - {confirmationCode}"
- Body:
  - Org name / branding
  - "Your booking is confirmed"
  - Confirmation code displayed prominently: `BK-XXXX`
  - QR code image encoding the confirmation code
  - Booking details: date, time, location, lane type
  - Cancellation policy note
  - Footer with org contact info

### QR Code Generation

Generate a QR code image for the confirmation code. Options:
- Use a QR code library (e.g., `qrcode`) to generate a data URI or SVG
- Embed inline in the email (base64 data URI or hosted image)
- The QR code should encode just the confirmation code string (e.g., `BK-A3F9`)

### Integration Points

Trigger the email in these flows:
1. Staff booking creation (Issue 9) -- send if customer has email
2. Member booking with entitlement payment (Issue 11) -- send to member email
3. Webhook payment confirmation (Issue 15) -- send after Stripe payment confirmed
4. Walk-in booking confirmation -- send after Stripe payment confirmed via webhook

### Cancellation Email

Also create a simple cancellation email template:
- Subject: "Booking Cancelled - {confirmationCode}"
- Body: cancellation confirmation, refund status if applicable

### Send Function

```typescript
export const sendBookingConfirmationEmail = (data: {
  to: string;
  orgName: string;
  confirmationCode: string;
  date: string;
  time: string;
  location: string;
  laneType: string;
}): Effect<void, EmailSendError>
```

## Files to Create/Modify

- **Create**: `packages/email/src/templates/booking-confirmation.tsx`
- **Create**: `packages/email/src/templates/booking-cancellation.tsx`
- **Modify**: `packages/email/src/index.ts` -- export new templates
- **Modify**: `apps/web/src/lib/bookings.ts` -- call email functions after booking creation/confirmation

## Acceptance Criteria

- [ ] Confirmation email template renders with all booking details
- [ ] QR code embedded in email encoding the confirmation code
- [ ] Email sent on staff booking creation (when customer has email)
- [ ] Email sent on member entitlement booking
- [ ] Email sent on Stripe payment confirmation (webhook)
- [ ] Cancellation email template created
- [ ] Follows existing React Email template patterns

## Dependencies

- Issue 6 (confirmation code)
- Issue 9, 11, 15 (booking creation flows that trigger emails)
