# Issue 9: Waiver Signing Email Confirmation

## Summary

Create a Resend email template for waiver signing confirmation and integrate it into the signing flow. Email is fire-and-forget — failures are logged but never block the waiver save.

## Context

The email package lives at `packages/email/`. It has a `src/templates/` directory for email templates, a `send.ts` for sending, and a `client.ts` for the Resend client. The Effect service `sendEmail` in `apps/web/src/lib/services.ts` wraps the email sending with `EmailSendError` handling.

## Acceptance Criteria

- [ ] New email template in `packages/email/src/templates/` (e.g., `waiver-confirmation.tsx` or equivalent format)
  - Content: "Your waiver has been signed" with signer name, organization name, date signed, expiration date
  - Matches existing email template style/branding
- [ ] Email template exported from `packages/email/src/index.ts`
- [ ] In the `signWaiver` service function: after waiver record is saved, attempt to send confirmation email to signer's email
- [ ] On email failure: log the error, do NOT throw or propagate — the waiver record is already saved
- [ ] For guardian/minor waivers: email sent to the guardian's email address

## Technical Notes

- Follow existing template patterns in `packages/email/src/templates/`
- The fire-and-forget pattern: use `Effect.catchAll` or `Effect.ignore` around the email send effect
- The email send should happen AFTER the waiver insert, not in the same transaction
- Consider using `Effect.fork` or running the email send as a separate non-blocking effect if the framework supports it, otherwise just catch and log

## Dependencies

- Issue 6 (signing service — the email call is integrated here)
