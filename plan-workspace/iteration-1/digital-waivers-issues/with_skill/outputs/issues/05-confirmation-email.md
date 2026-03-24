# Waiver Confirmation Email

> Part of: [digital-waivers-design.md](../../plans/digital-waivers-design.md)
> Issue: 5 of 7
> Type: AFK

## Blocked by

- [04-public-signing-page.md](./04-public-signing-page.md) -- needs the `signWaiver` service function to be callable and the waiver record to exist before sending email.

## What to build

Create a React Email template for waiver signing confirmation. Wire the email send into the `signWaiver` service function as a fire-and-forget call (failure logged, never blocks). The email includes: signer name, organization name, date signed, expiration date, and a note that the waiver is on file.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `packages/email/src/templates/waiver-confirmation.tsx` | React Email template: confirmation of waiver signing | Follow `packages/email/src/templates/invitation.tsx` (73 lines) -- same Html/Head/Preview/Tailwind/Body/Container structure, PreviewProps, plaintext export |

## Files to modify

| File | What changes |
|------|-------------|
| `packages/email/src/index.ts` | Add exports: `WaiverConfirmationEmail`, `waiverConfirmationPlaintext` (after line ~11) |
| `apps/web/src/lib/waivers.ts` | In the `signWaiver` function, after the waiver INSERT succeeds, add a fire-and-forget email send using `Effect.fork` (or `Effect.catchAll` to swallow errors). Import `sendEmail` from `@/lib/services` and `WaiverConfirmationEmail`/`waiverConfirmationPlaintext` from `@workspace/email`. Use `EMAIL_FROM` constant |

## Context

### Patterns to follow
- `packages/email/src/templates/invitation.tsx` lines 1-72: full React Email template structure with component, PreviewProps, and plaintext function.
- `packages/email/src/send.ts` lines 1-19: `sendEmail(client, params)` function signature and `SendEmailParams` interface.
- `packages/email/src/index.ts` lines 1-11: barrel exports pattern.
- `apps/web/src/lib/services.ts` lines 57-64: `sendEmail` Effect wrapper that depends on `ResendClient`.

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

// From services.ts -- Effect-based email send
export const sendEmail = (params: SendEmailParams) => Effect.gen(function* () { ... });

// From packages/email/src/constants.ts
export const EMAIL_FROM: string;
```

### Wiring notes
- The email send in `signWaiver` must be fire-and-forget per Design Decision #10. Use `Effect.catchAll(() => Effect.void)` to swallow `EmailSendError`, or use `Effect.fork` to run in background. The waiver record is the critical artifact -- email is informational.
- Log the error: before swallowing, use `Effect.tapError((e) => Effect.sync(() => console.error("Waiver email failed:", e)))`.
- The email `to` is the signer's email (or guardian's email for minor waivers).
- Subject: "Your waiver for [org name] has been signed"
- Template props: `signerName`, `organizationName`, `signedDate`, `expiresDate`.

## Acceptance criteria

- [ ] `WaiverConfirmationEmail` component renders: signer name, org name, signed date, expiration date
- [ ] `waiverConfirmationPlaintext` function returns equivalent plain text
- [ ] Email exported from `@workspace/email` package barrel
- [ ] `signWaiver` sends confirmation email after successful waiver insert
- [ ] Email failure does NOT block waiver signing -- waiver record is preserved
- [ ] Email failure is logged to console
- [ ] Email sent to signer email (guardian email for minor waivers)
- [ ] `bun run lint` passes
- [ ] `bun run build` passes

## Verification

```bash
cd packages/email
bun run lint
cd ../../apps/web
bun run lint
bun run build
```

### Manual verification
1. Sign a waiver with a real email address (or check Resend dashboard for test sends)
2. Verify email received with correct signer name, org name, dates
3. Simulate email failure (e.g., invalid API key) -- verify waiver still saved, error logged

## Notes

- The email template should be simple and professional. No need for complex layouts -- a single container with heading, body text, and key details.
- This is a small issue (3 files) but separated from Issue #4 to keep the signing page focused on core functionality. The email integration is additive.
