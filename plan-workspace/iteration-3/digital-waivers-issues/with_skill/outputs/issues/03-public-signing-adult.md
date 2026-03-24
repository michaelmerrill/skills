# Public Signing Page — Adult Flow

> Part of: [design.md](../../../../architect-workspace/iteration-1/digital-waivers-design/with_skill/outputs/design.md)
> Issue: 3 of 6
> Type: HITL

## Blocked by

- [01-waiver-schema.md](./01-waiver-schema.md) — needs `waiver` and `waiverTemplate` tables
- [02-template-crud.md](./02-template-crud.md) — needs `getActiveTemplate` service function and a published template to render

## What to build

Build the public waiver signing page at `app/[orgSlug]/waiver/page.tsx`. This is an unauthenticated RSC page that resolves the org by slug (reusing proxy.ts subdomain rewrite), checks the `featureFlags.waivers` flag, queries the active published template, and renders a signing form with fields: firstName, lastName, email, phone, dateOfBirth, consent checkbox, typed legal name. On submit, a server action `signWaiver` validates inputs (Zod), verifies age >= 18, normalizes email to lowercase, matches or creates a customer record (case-insensitive email, ON CONFLICT handling), inserts the waiver record with frozen template snapshot and audit metadata (IP, user agent), calculates `expiresAt`, and renders a confirmation page. Add rate limiting (5 submissions per IP per minute) on the signing action. Include `signWaiverSchema` in validation. Include unit tests for adult signing happy path, customer match, customer auto-create, age validation, expiration calculation, and race condition handling.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/waivers.ts` | Add `signWaiver` and `getWaiverStatus` Effect service functions (append after template functions from issue #2) |
| `apps/web/src/lib/validation.ts` | Add `signWaiverSchema` Zod schema with firstName, lastName, email, phone, dateOfBirth, signatureText, consentGiven, isMinor (boolean), orgId, templateId fields (after waiver template schemas from issue #2) |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/waiver/page.tsx` | Public signing RSC page — resolves org, checks feature flag, queries active template, renders signing form + confirmation | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` for RSC data fetching pattern (lines 15-44); for unauthenticated page, omit session check |
| `apps/web/src/app/[orgSlug]/waiver/actions.ts` | Server action `signWaiverAction` — Zod validate, rate limit check, call `signWaiver` Effect, return confirmation data | Follow `apps/web/src/app/[orgSlug]/customers/actions.ts` for action pattern; omit session (public endpoint) |
| `apps/web/src/__tests__/waivers/waiver-signing.test.ts` | Unit tests: adult signing happy path, customer email match (case-insensitive), customer auto-create (lead status), age rejection (<18), expiration calculation, concurrent same-email race condition | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` for test structure |

## Context

### Patterns to follow
- `apps/web/src/proxy.ts` (lines 19-22): subdomain rewrite — `{slug}.rangeops.com/waiver` rewrites to `/[orgSlug]/waiver`. No proxy changes needed.
- `apps/web/src/lib/queries.ts` (lines 34-57): `getOrgBySlug` — reuse this to resolve org from slug in the signing page.
- `apps/web/src/lib/customers.ts` (lines 45-122): `listCustomers` Effect.gen pattern with DbService — template for `signWaiver` service function.
- `apps/web/src/app/[orgSlug]/customers/actions.ts` (lines 42-70): `updateCustomerStatusAction` — action pattern with Effect.match error handling.

### Key types
```typescript
// Org resolution (from lib/queries.ts line 34)
export const getOrgBySlug: (slug: string) => Promise<{ id: string; name: string; slug: string; timezone: string } | undefined>

// Org settings for feature flag (from lib/queries.ts line 62)
export const getOrgSettings: (orgId: string) => Promise<{ featureFlags: Record<string, unknown>; ... } | undefined>

// Customer schema (from lib/db/schema/customers.ts lines 35-114)
// Key fields: id, organizationId, firstName, lastName, email, phone, dateOfBirth, status
// Insert with: status: "lead"

// Waiver insert shape (from schema created in issue #1):
// { id, organizationId, templateId, templateSnapshot, customerId, signerFirstName, signerLastName,
//   signerEmail, signerPhone, signerDateOfBirth, isMinor, signatureText, consentGiven,
//   signedAt, expiresAt, ipAddress, userAgent }

// Organization table (from lib/db/schema/auth.ts line 94-105)
// Fields: id, name, slug, logo
```

### Wiring notes
- The signing page does NOT use `CurrentSession` — it is a public unauthenticated page. The `signWaiver` service only needs `DbService` (and later `ResendClient` for email in issue #5).
- Rate limiting: implement as a simple in-memory Map keyed by IP address with a sliding window. Extract IP from `headers().get("x-forwarded-for")` or `request.ip`. Check before running the Effect pipeline in the server action.
- Customer email matching: use `sql\`lower(${customer.email}) = lower(${email})\`` in the WHERE clause. ON CONFLICT for the unique partial index handles race conditions — catch the constraint violation, re-query, and link.
- The confirmation screen should render on the same page (client-side state transition after successful submit) or as a separate route. Design uses same-page approach — form submits, action returns confirmation data, page re-renders with confirmation UI.

## Acceptance criteria

- [ ] Public page loads at `{slug}.rangeops.com/waiver` without authentication
- [ ] Page shows org name/logo header and formatted waiver template HTML body
- [ ] "Not available" message when no published template exists
- [ ] "Not available" message when `featureFlags.waivers` is falsy
- [ ] Adult can fill form (firstName, lastName, email, phone, DOB), check consent, type legal name, submit
- [ ] Age validation rejects signers under 18 with clear error message
- [ ] Existing customer matched by email (case-insensitive) — no duplicate created
- [ ] New customer created with `status: "lead"` when no email match
- [ ] Waiver record includes frozen `templateSnapshot` (exact HTML body at signing time)
- [ ] Waiver record includes `ipAddress`, `userAgent`, correct `signedAt` and calculated `expiresAt`
- [ ] Confirmation screen shows signer name, date signed, expiration date
- [ ] Rate limiting: 6th submission from same IP within 1 minute gets rejected
- [ ] Form works with JavaScript disabled (progressive enhancement via server action)
- [ ] All signing unit tests pass
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run test -- --run src/__tests__/waivers/waiver-signing.test.ts
cd ../..
bunx biome check apps/web/src
bun run build
```

### Manual verification
1. Create and publish a waiver template (via issue #2)
2. Visit `{org-slug}.rangeops.com/waiver` in an incognito browser (no auth)
3. Verify org name/logo and waiver text render
4. Fill in adult signer info, consent, type legal name, submit
5. Verify confirmation screen shows name, date, expiration
6. Check DB: `waiver` row exists with correct `templateSnapshot`, `customerId`, `expiresAt`
7. Check DB: `customer` row exists with `status: 'lead'` if new
8. Submit same email again — verify same customer is linked (no duplicate)
9. Submit with DOB making signer 17 — verify age validation error

## Notes

- The page must use `DOMPurify` or equivalent to sanitize template HTML before rendering to prevent XSS (design assumption: Tiptap output is safe, but defense in depth).
- `expiresAt` calculation: `new Date(signedAt.getTime() + template.expirationDays * 24 * 60 * 60 * 1000)`.
- HITL because: public-facing signing form layout, org branding header, and confirmation screen all need visual review for a good customer experience.
