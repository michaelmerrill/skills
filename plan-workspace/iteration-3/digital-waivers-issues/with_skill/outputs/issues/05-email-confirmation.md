# Email Confirmation

> Part of: [design.md](../../../../architect-workspace/iteration-1/digital-waivers-design/with_skill/outputs/design.md)
> Issue: 5 of 6
> Type: AFK

## Blocked by

- [03-public-signing-adult.md](./03-public-signing-adult.md) — needs `signWaiver` service function to hook email sending into

## What to build

Create a React Email template for waiver signing confirmation and wire it into the `signWaiver` service as a fire-and-forget email send. The email includes: org name, signer name, date signed, expiration date, and a note that this is a confirmation of their waiver signature. Email failures must not block the signing flow — log the error but return success to the user. Export the template and plaintext function from the email package barrel. Wire the `ResendClient` service into the `signWaiver` Effect pipeline.

## Files to modify

| File | What changes |
|------|-------------|
| `packages/email/src/index.ts` | Add exports for `WaiverConfirmationEmail` and `waiverConfirmationPlaintext` (after line ~11) |
| `apps/web/src/lib/waivers.ts` | In `signWaiver`, after successful waiver insert, add fire-and-forget email send using `sendEmail` from `lib/services.ts`. Wrap in `Effect.catchAll` to log but not propagate email errors. Add `ResendClient` to the service dependencies. |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `packages/email/src/templates/waiver-confirmation.tsx` | React Email template for waiver signing confirmation — org name, signer name, signed date, expiration date | Follow `packages/email/src/templates/invitation.tsx` for structure (Html, Head, Preview, Tailwind, Body, Container, Heading, Text, Button) |
| `apps/web/src/__tests__/waivers/waiver-email.test.ts` | Unit tests: email sent after signing, email failure doesn't block waiver creation, correct email params (to, subject, template props) | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` for test structure; mock `ResendClient` with a Layer |

## Context

### Patterns to follow
- `packages/email/src/templates/invitation.tsx` (lines 1-72): React Email component structure with `@react-email/components`, PreviewProps, plaintext function
- `packages/email/src/send.ts` (lines 1-19): `sendEmail` function shape — `SendEmailParams` type with `from`, `to`, `subject`, `react`, `text`
- `apps/web/src/lib/services.ts` (lines 57-64): `sendEmail` Effect wrapper using `ResendClient` and `EmailSendError`

### Key types
```typescript
// From packages/email/src/send.ts
export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  react: React.ReactElement;
  text?: string;
}

// From packages/email/src/constants.ts
export const EMAIL_FROM = "..."; // existing FROM address

// From lib/services.ts (lines 57-64)
export const sendEmail: (params: SendEmailParams) => Effect.Effect<void, EmailSendError, ResendClient>

// Fire-and-forget pattern for email:
// yield* sendEmail({...}).pipe(Effect.catchAll((e) => Effect.sync(() => console.error("Email failed:", e))))
```

### Wiring notes
- The `signWaiver` function currently only depends on `DbService`. After this issue, it also depends on `ResendClient`. Update the Effect pipeline in `signWaiverAction` to provide `AppLive` (which already includes `ResendLive`) instead of just `DbLive`.
- The email is fire-and-forget: use `Effect.catchAll` to absorb `EmailSendError` and log it. The waiver record is already inserted before the email attempt.
- For guardian/minor waivers, send the email to the guardian's email address (the `signerEmail` field).

## Acceptance criteria

- [ ] `WaiverConfirmationEmail` React Email component renders: org name, signer name, signed date, expiration date
- [ ] `waiverConfirmationPlaintext` function returns equivalent plain text
- [ ] Email exported from `packages/email/src/index.ts`
- [ ] After successful waiver signing, confirmation email sent to signer's email
- [ ] Email failure does not block waiver creation — waiver record still persists
- [ ] Email failure logged to console/error handler
- [ ] Email unit tests pass (mock ResendClient)
- [ ] `bunx biome check packages/email/src` passes
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run test -- --run src/__tests__/waivers/waiver-email.test.ts
cd ../..
bunx biome check packages/email/src apps/web/src
bun run build
```

### Manual verification
1. Sign a waiver with a valid email address
2. Check Resend dashboard (or dev inbox) for confirmation email
3. Verify email contains: org name, signer name, date, expiration
4. Temporarily break the Resend API key — sign another waiver — verify signing succeeds and confirmation screen renders, but email send error is logged

## Notes

- Keep the email template simple — no waiver body content in the email (it could be very long). Just confirmation metadata.
- Subject line suggestion: "Waiver Signed — [Org Name]"
