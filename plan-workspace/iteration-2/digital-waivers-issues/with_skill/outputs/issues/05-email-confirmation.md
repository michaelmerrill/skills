# Email Confirmation for Signed Waivers

> Part of: [digital-waivers-design.md](plans/digital-waivers-design.md)
> Issue: 5 of 7
> Type: AFK

## Blocked by

- [04-public-signing-page.md](./04-public-signing-page.md) -- needs `signWaiver` service function to wire email sending into

## What to build

Create a React Email template for waiver confirmation. Wire it into the `signWaiver` service as a fire-and-forget email send after the waiver record is saved. The email includes org name, signer name, signing date, expiration date, and a note that the waiver is on file. Email failure must NOT block the signing flow or prevent the confirmation screen (Decision #10). Export the new template from the email package.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/waivers.ts` | After the waiver insert in `signWaiver`, add fire-and-forget email send using `Effect.catchAll` to log and swallow `EmailSendError`. Import `sendEmail` from `@/lib/services` and the new template. |
| `packages/email/src/index.ts` | Add export for `WaiverConfirmationEmail` and `waiverConfirmationPlaintext` after the existing invitation exports (line ~11) |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `packages/email/src/templates/waiver-confirmation.tsx` | React Email template for waiver signing confirmation | Follow `packages/email/src/templates/invitation.tsx` (73 lines) -- same Html/Head/Preview/Tailwind/Body/Container structure |

## Context

### Patterns to follow
- `packages/email/src/templates/invitation.tsx` lines 1-72: React Email component using `@react-email/components`. Follow identical import pattern, Tailwind wrapper, Container layout.
- `packages/email/src/index.ts` lines 1-11: barrel exports. Add new template exports.
- `packages/email/src/send.ts` lines 1-19: `sendEmail` function signature. The waiver confirmation uses the same `SendEmailParams` interface.
- `apps/web/src/lib/services.ts` lines 57-64: `sendEmail` Effect wrapper that depends on `ResendClient`. Use this in `waivers.ts`.

### Key types
```typescript
// Email template props
interface WaiverConfirmationEmailProps {
  organizationName: string;
  signerName: string;
  signedAt: string; // formatted date
  expiresAt: string; // formatted date
}

// In waivers.ts signWaiver function, after waiver insert:
yield* sendEmail({
  from: EMAIL_FROM,
  to: data.email,
  subject: `Waiver Confirmation - ${orgName}`,
  react: WaiverConfirmationEmail({ organizationName: orgName, signerName, signedAt, expiresAt }),
  text: waiverConfirmationPlaintext({ organizationName: orgName, signerName, signedAt, expiresAt }),
}).pipe(
  Effect.catchAll((e) => Effect.logWarning("Email send failed for waiver confirmation", e)),
);
```

### Wiring notes
- The email send MUST be fire-and-forget. Use `Effect.catchAll` to swallow `EmailSendError` and log a warning. The waiver record is already saved at this point.
- Import `EMAIL_FROM` from `@workspace/email` (see `packages/email/src/constants.ts`).
- The `sendEmail` effect depends on `ResendClient`. When the signing action provides `AppLive` (which includes `ResendLive`), this is automatically satisfied. However, the signing action currently does NOT use `AppLive` fully since it's unauthenticated. Ensure the action provides `AppLive` (which includes ResendLive) for the email to work.
- For the public signing action, the Effect pipeline needs: `DbService` + `ResendClient` (no `CurrentSession` since unauthenticated). Provide `AppLive` which includes both.

## Acceptance criteria

- [ ] `WaiverConfirmationEmail` renders org name, signer name, signing date, expiration date
- [ ] `waiverConfirmationPlaintext` returns plain text version with same info
- [ ] Email is sent after waiver record is saved
- [ ] Email send failure does NOT block signing flow
- [ ] Email send failure is logged as a warning
- [ ] Waiver confirmation screen still displays even if email fails
- [ ] Email template exported from `@workspace/email` package
- [ ] `bun run lint` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
cd ../../packages/email
bun run lint
bun run build
```

### Manual verification
- Complete a signing flow and check Resend dashboard for the confirmation email
- Temporarily break the Resend API key and verify signing still succeeds (email error logged)

## Notes
- Decision #10: "Save waiver regardless of email send failure. Log error but don't block user."
- The `Effect.catchAll` pattern is critical here. Do not use `Effect.tapError` alone -- the error must be fully swallowed to prevent it from propagating up and failing the signing action.
