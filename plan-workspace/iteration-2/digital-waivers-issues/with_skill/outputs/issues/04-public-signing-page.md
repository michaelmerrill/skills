# Public Signing Page + Customer Integration

> Part of: [digital-waivers-design.md](plans/digital-waivers-design.md)
> Issue: 4 of 7
> Type: AFK

## Blocked by

- [02-template-crud-service.md](./02-template-crud-service.md) -- needs `getActiveTemplate` service function, `signWaiverSchema` validation, waiver table

## What to build

Create the public waiver signing page at `app/[orgSlug]/waiver/page.tsx`. This is an unauthenticated RSC page that resolves the org by slug, checks the waivers feature flag, fetches the active published template, and renders a signing form. Implement the `signWaiver` server action handling adult and guardian/minor flows: validate inputs (Zod), enforce age rules, match or create customer by email (case-insensitive with ON CONFLICT), insert waiver record with frozen template snapshot and audit metadata (IP, user agent), calculate expiresAt, render confirmation. Add rate limiting (5/min per IP). Add `signWaiver` service function to `lib/waivers.ts`. Add signing unit tests.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/waivers.ts` | Add `signWaiver` Effect function after template CRUD functions. Handles customer lookup/upsert, waiver insert, expiration calculation. |
| `apps/web/src/lib/validation.ts` | Add `signWaiverSchema` Zod schema after the template schemas added in issue #2 |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/waiver/page.tsx` | Public RSC page: resolve org, check flag, fetch template, render form | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` for RSC data-fetching, but NO auth check (public page) |
| `apps/web/src/app/[orgSlug]/waiver/actions.ts` | Server action: `signWaiverAction` -- validate, call service, return result | Follow `apps/web/src/app/[orgSlug]/customers/actions.ts` (153 lines) but without session requirement |
| `apps/web/src/__tests__/waivers/waiver-signing.test.ts` | Unit tests: adult signing, minor/guardian, age validation, customer matching, race condition | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` |

## Context

### Patterns to follow
- `apps/web/src/proxy.ts` lines 19-23: proxy rewrites `{slug}.rangeops.com/*` to `/[orgSlug]/*`. The waiver page at `app/[orgSlug]/waiver/page.tsx` is automatically accessible at `{slug}.rangeops.com/waiver`. No proxy changes needed (Decision #1).
- `apps/web/src/lib/queries.ts` lines 34-57: `getOrgBySlug` cached query. Reuse this in the waiver page to resolve org.
- `apps/web/src/app/[orgSlug]/customers/actions.ts` lines 42-70: server action pattern with Effect pipeline and error matching.
- `apps/web/src/lib/customers.ts` lines 45-122: query pattern for the customer table. The signing action needs to query/insert customer records using the same `customer` table import.
- `apps/web/src/lib/db/schema/customers.ts` lines 35-114: customer table definition. Fields available: firstName, lastName, email, phone, dateOfBirth, status, organizationId.

### Key types
```typescript
// Validation schema to add
export const signWaiverSchema = z.object({
  orgId: z.string().min(1),
  templateId: z.string().min(1),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().email("Valid email is required."),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.coerce.date(),
  isMinor: z.boolean().default(false),
  minorFirstName: z.string().trim().optional(),
  minorLastName: z.string().trim().optional(),
  minorDateOfBirth: z.coerce.date().optional(),
  signatureText: z.string().trim().min(1, "Signature is required."),
  consentGiven: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms." }) }),
});
export type SignWaiverData = z.infer<typeof signWaiverSchema>;

// Service function
export const signWaiver: (data: SignWaiverData & { ipAddress?: string; userAgent?: string }) =>
  Effect<{ waiverId: string; signerName: string; signedAt: Date; expiresAt: Date }, DatabaseError | ActiveTemplateNotFound | InvalidSignerAge>
```

### Wiring notes
- The page is **unauthenticated**. Do NOT use `CurrentSession` or `getSession`. Do NOT wrap in the org layout (which enforces auth). The `[orgSlug]/layout.tsx` enforces auth -- this page needs to bypass it. Consider adding `waiver/` to a route group that skips the auth layout, OR check if Next.js route groups can handle this. Simplest approach: the org layout already handles the case by redirecting to `/login` if no session -- the waiver page may need its own layout or be placed at a route that bypasses the auth layout.
- **Critical routing note**: The org layout at `app/[orgSlug]/layout.tsx` (line 33) redirects to `/login` if no session. The waiver page must NOT be wrapped by this layout. Solution: create `app/[orgSlug]/(public)/waiver/page.tsx` with a `(public)` route group that has its own minimal layout (no auth), OR place it outside the `[orgSlug]` segment and manually parse the slug. The route group approach is cleanest.
- Rate limiting: implement as a simple in-memory rate limiter (Map of IP -> timestamps) in the server action. 5 submissions per IP per minute. Production would use Redis but in-memory is acceptable for v1 per design.
- Customer matching: `lower(email)` query uses the partial unique index from issue #1. ON CONFLICT handling for race conditions: try insert, catch unique constraint violation, retry query.
- `expiresAt` calculation: `new Date(signedAt.getTime() + template.expirationDays * 86400000)`.
- `templateSnapshot`: copy `template.body` at signing time. This is the frozen HTML (Decision #5).
- IP address: extract from `headers().get("x-forwarded-for")` or `headers().get("x-real-ip")`.
- User agent: extract from `headers().get("user-agent")`.

## Acceptance criteria

- [ ] Public page loads at `{slug}.rangeops.com/waiver` without authentication
- [ ] Page shows org name and formatted waiver template text
- [ ] "Not available" message when no published template exists
- [ ] "Not available" message when `featureFlags.waivers` is disabled
- [ ] Adult signing: fill form (firstName, lastName, email, phone, DOB), consent checkbox, typed signature, submit
- [ ] Age validation rejects under-18 self-signers with clear error message
- [ ] Guardian/minor toggle reveals minor fields (firstName, lastName, DOB)
- [ ] Guardian age >= 18 validated, minor age < 18 validated
- [ ] Existing customer matched by email (case-insensitive)
- [ ] New customer created with status "lead" when no email match
- [ ] Race condition: concurrent same-email submissions don't create duplicate customers
- [ ] Waiver record includes frozen templateSnapshot, IP, user agent, signedAt, expiresAt
- [ ] `expiresAt` = signedAt + template.expirationDays
- [ ] Confirmation screen shows signer name, date signed, expiration date
- [ ] Rate limiting: 6th submission from same IP within 1 minute is rejected
- [ ] All signing unit tests pass
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test -- --grep "waiver sign"
```

### Manual verification
- Visit `{org-slug}.localhost:3000/waiver` (no login)
- Complete adult signing flow
- Check DB for waiver record with templateSnapshot, IP, user agent
- Toggle minor signing and complete guardian flow
- Check both customer records created (guardian + minor)
- Submit 6 times rapidly from same IP -- 6th should be rate-limited

## Notes
- The `(public)` route group is the recommended approach for bypassing the authenticated org layout. Create `app/[orgSlug]/(public)/layout.tsx` as a minimal passthrough layout (no sidebar, no auth check). This also means the waiver page won't have the app sidebar/header chrome -- which is correct for a public-facing page.
- Progressive enhancement (Decision #7): the form should work without JavaScript. Use a `<form>` with `action` attribute pointing to the server action. The Zod validation runs server-side regardless.
- For the confirmation screen, consider rendering it as a separate server component returned after successful action, or use `useActionState` for client-side state management post-submission.
