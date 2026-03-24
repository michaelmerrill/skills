# Public Signing Page + Customer Integration

> Part of: [digital-waivers-design.md](../../plans/digital-waivers-design.md)
> Issue: 4 of 7
> Type: AFK

## Blocked by

- [02-template-service.md](./02-template-service.md) -- needs `getActiveTemplate`, `signWaiver` service function, `signWaiverSchema` validation, tagged errors.

## What to build

Create the public-facing waiver signing page at `app/[orgSlug]/waiver/page.tsx`. This is an unauthenticated RSC that resolves the org by slug (via the existing proxy.ts rewrite), checks the `featureFlags.waivers` flag, loads the published template, and renders the signing form. The server action `signWaiver` handles: input validation, age verification (18+ for adults, guardian 18+/minor <18), customer auto-match by email (case-insensitive) and auto-create (status: lead), waiver record insertion with frozen template snapshot + audit metadata, and confirmation page rendering. Includes rate limiting (5 submissions/IP/min) on the signing action.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/waiver/page.tsx` | RSC: resolve org, check flag, load template, render signing form or "not available" | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` (115 lines) for RSC data-loading pattern, but this page is UNAUTHENTICATED -- no session check. Use `getOrgBySlug` + `getOrgSettings` from `queries.ts` |
| `apps/web/src/app/[orgSlug]/waiver/actions.ts` | `"use server"` action: `signWaiverAction` -- Zod parse, call `signWaiver` Effect, return confirmation data or error | Follow `apps/web/src/app/[orgSlug]/customers/actions.ts` (153 lines) for action pattern, but NO `CurrentSession` -- public endpoint |
| `apps/web/src/components/waiver/signing-form.tsx` | `"use client"` form: signer fields, minor toggle, guardian fields, consent checkbox, typed name, submit | No direct analog -- new public-facing form. Keep progressive enhancement (works without JS per NFR-6): use native `<form>` with `action` attribute |
| `apps/web/src/components/waiver/confirmation.tsx` | Confirmation screen: signer name, date signed, expiration date, "Show this to staff" | Simple presentational component |
| `apps/web/src/__tests__/waivers/waiver-signing.test.ts` | Unit tests: adult signing, customer match/create, minor/guardian, age validation, race condition, expiration calc | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` for setup pattern |
| `apps/web/src/__tests__/waivers/waiver-status.test.ts` | Unit tests: status computation (signed/expired/not_signed), coverage query | Follow same test setup pattern |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/waivers.ts` | Add `signWaiver` function (after template CRUD functions). This is the main signing flow: validate age, normalize email, customer match/create with ON CONFLICT, insert waiver with frozen snapshot, calculate expiresAt. Also add `getWaiverStatus` and `getWaiverCoverage` query functions |
| `apps/web/src/lib/validation.ts` | Add `signWaiverSchema` Zod schema (after template schemas): orgId, templateId, firstName, lastName, email, phone (optional), dateOfBirth, isMinor, minorFirstName/LastName/DateOfBirth (conditional), signatureText, consentGiven |
| `apps/web/src/lib/queries.ts` | Add `getActiveWaiverTemplate` cached query (after line ~168) -- wraps `getActiveTemplate` from waivers.ts |

## Context

### Patterns to follow
- `apps/web/src/proxy.ts` lines 19-22: subdomain rewrite -- `{slug}.rangeops.com/waiver` becomes `/[orgSlug]/waiver`. No proxy changes needed (Design Decision #1).
- `apps/web/src/lib/queries.ts` lines 34-57: `getOrgBySlug` pattern for resolving org from slug. The waiver page uses this same query.
- `apps/web/src/lib/customers.ts` lines 45-122: `listCustomers` for the DB query pattern inside Effect.gen.
- `apps/web/src/app/[orgSlug]/customers/actions.ts` lines 42-69: `updateCustomerStatusAction` for server action structure.
- `apps/web/src/lib/db/schema/customers.ts` lines 35-113: customer table structure -- the signing flow needs to query and insert into this table.

### Key types
```typescript
// Organization query result (from queries.ts getOrgBySlug)
{ id: string; name: string; slug: string; timezone: string }

// Organization settings (from queries.ts getOrgSettings)
{ featureFlags: Record<string, unknown>; branding: Record<string, unknown>; ... }

// Customer table columns used for matching (from customers.ts schema)
customer.organizationId, customer.email, customer.firstName, customer.lastName, customer.dateOfBirth

// Waiver insert shape (from waivers.ts schema after issue #1)
{ id, organizationId, templateId, templateSnapshot, customerId, signerFirstName, signerLastName, signerEmail, signerPhone, signerDateOfBirth, isMinor, guardianCustomerId, signatureText, consentGiven, signedAt, expiresAt, ipAddress, userAgent }

// Effect service dependencies -- NO CurrentSession for public signing
DbService, ResendClient (for email in issue #5)
```

### Wiring notes
- The signing server action does NOT use `CurrentSession` -- it's a public, unauthenticated endpoint. The Effect pipeline uses `DbLive` + `ResendLive` only (no auth).
- Customer matching: query `WHERE organizationId = ? AND lower(email) = lower(?)` LIMIT 1. If no match, INSERT with ON CONFLICT (partial unique index from issue #1) to handle race conditions.
- For the race condition: wrap the customer lookup + insert in a retry. If INSERT hits the unique constraint, re-query to get the existing customer ID.
- `expiresAt` = `signedAt` + `template.expirationDays` days. Calculate in the service layer.
- `templateSnapshot` = the template's `body` HTML at time of signing. Frozen copy.
- IP address: extract from request headers (`x-forwarded-for` or `x-real-ip`). User agent from `user-agent` header. Pass these from the action to the service.
- Rate limiting: use a simple in-memory map of IP -> timestamp array. Check count in last 60 seconds. If >= 5, return error. This is adequate for single-instance deployment. For multi-instance, would need Redis (out of scope for v1).
- The signing form must work without JavaScript (NFR-6). Use a `<form>` with `action={signWaiverAction}`. The minor toggle should use a checkbox that conditionally shows fields via CSS `:checked` + adjacent sibling selector, or accept both sets of fields and validate server-side.
- HTML sanitization of template body on the public page: use DOMPurify (installed in issue #3). Render with `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}`.

## Acceptance criteria

- [ ] Public page loads at `{slug}.rangeops.com/waiver` without authentication
- [ ] Page shows org name and formatted waiver text (sanitized HTML)
- [ ] "Waivers are not yet available for [org name]" when no published template
- [ ] "Waivers are not yet available" when feature flag disabled
- [ ] Adult signing: fill firstName, lastName, email, phone, DOB, consent, typed name, submit
- [ ] Age validation: under-18 self-signer gets "You must be 18 or older to sign"
- [ ] Minor toggle: reveals minorFirstName, minorLastName, minorDateOfBirth fields
- [ ] Guardian 18+, minor <18 validated
- [ ] Existing customer matched by email (case-insensitive `lower()`)
- [ ] New customer created with status `"lead"` when no email match
- [ ] Race condition: concurrent same-email signing handled via ON CONFLICT retry
- [ ] Waiver record has frozen `templateSnapshot`, `signedAt`, calculated `expiresAt`, `ipAddress`, `userAgent`
- [ ] Confirmation screen shows signer name, date signed, expiration date
- [ ] Rate limiting: 6th request within 60 seconds from same IP returns error
- [ ] Form works with JavaScript disabled (progressive enhancement)
- [ ] `getWaiverStatus(customerId, orgId)` returns `'signed'` | `'expired'` | `'not_signed'`
- [ ] `getWaiverCoverage(orgId)` returns `{ totalActive, withValidWaiver }`
- [ ] All signing + status tests pass
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test -- src/__tests__/waivers/waiver-signing.test.ts
bun run test -- src/__tests__/waivers/waiver-status.test.ts
```

### Manual verification
1. Set up an org with a published template and feature flag enabled
2. Visit `{slug}.rangeops.com/waiver` in an incognito window
3. Fill out the adult signing form, submit
4. Verify confirmation screen shows correct data
5. Check DB: waiver record exists with snapshot, customer record exists with status "lead"
6. Toggle "signing for a minor" -- fill guardian + minor fields, submit
7. Check DB: two customer records (guardian + minor), waiver with `isMinor: true`
8. Submit 6 times rapidly -- verify rate limit error on 6th

## Notes

- Email sending is intentionally NOT part of this issue -- the `signWaiver` service function should have a hook point for email but the actual send is in Issue #5. For now, the service completes without sending email.
- The `signWaiver` function in `waivers.ts` will grow to ~80-100 lines due to the customer matching logic + waiver insert + validation. This is acceptable for a single function that orchestrates the signing flow.
- Minor customer matching uses firstName + lastName + dateOfBirth + organizationId (no email for minors). This is a best-effort match -- duplicates are acceptable for v1 (Design Decision #16).
