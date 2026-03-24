# Walk-in Public Booking + Stripe Checkout

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 5 of 7
> Type: AFK

## Blocked by

- [04-availability-member-booking.md](./04-availability-member-booking.md) -- needs `getAvailableSlots`, lane auto-assignment, Stripe Checkout session creation pattern

## What to build

Create the public (unauthenticated) booking route at `[orgSlug]/(public)/book/` that allows walk-in customers to select a date, time slot, and resource type, enter their contact details (name, email, phone), and pay via Stripe Checkout on the org's Connect account. Implement customer upsert: find existing customer by `(organizationId, email)` or create with `status: 'lead'`. Gate the public route behind the `laneBooking` feature flag -- return 404 if disabled or org not found. Show "online booking not available" if org has no Stripe Connect account. Add Zod validation for walk-in booking input.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/(public)/book/page.tsx` | Public booking page: slot selection + contact form + Stripe redirect | Follow `apps/web/src/app/[orgSlug]/page.tsx` for RSC page structure; this route needs its own layout (no sidebar/auth) |
| `apps/web/src/app/[orgSlug]/(public)/book/actions.ts` | Server action: `createWalkInBooking` (no auth required) | Follow `apps/web/src/app/[orgSlug]/bookings/actions.ts` but without `CurrentSession` |
| `apps/web/src/app/[orgSlug]/(public)/layout.tsx` | Public route layout: no sidebar, no auth, org resolution by slug | New file -- minimal layout that resolves org by slug and checks feature flag |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `createWalkInBooking` function: customer upsert, Stripe Checkout, pending booking creation |
| `apps/web/src/lib/validation.ts` | Add `createWalkInBookingSchema` with fields: `orgId`, `locationId`, `resourceTypeId`, `date`, `slotStart`, `firstName`, `lastName`, `email`, `phone` |
| `apps/web/src/lib/customers.ts` | Add `upsertWalkInCustomer(orgId, email, firstName, lastName, phone)` that finds by `(orgId, email)` or inserts with `status: 'lead'` |

## Context

### Patterns to follow

- `apps/web/src/app/[orgSlug]/layout.tsx` lines 12-90: OrgLayout resolves org by slug. The public layout does the same but skips auth check and sidebar rendering.
- `apps/web/src/lib/stripe.ts` lines 85-142: `createSaasCheckoutSession` creates a Stripe Checkout session. Adapt for walk-in booking: `mode: 'payment'` (not subscription), on Connect account, with `bookingId` in metadata.
- `apps/web/src/lib/stripe.ts` lines 70-79: `withConnectedAccount` retrieves the org's Connect account ID. Reuse for walk-in payment.
- `apps/web/src/lib/customers.ts` lines 45-122: `listCustomers` query pattern. Follow for customer upsert query.
- `apps/web/src/lib/db/schema/customers.ts` lines 35-114: customer table with `organizationId`, `email`, `status`, composite FK. The `customer_organization_id_email_idx` (line 98) enables efficient email lookup.

### Key types

```typescript
// Walk-in booking input
type CreateWalkInBookingData = {
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  startTime: Date;
  endTime: Date;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

// Customer upsert
// Existing customer table (customers.ts line 35):
//   id, organizationId, firstName, lastName, email, phone, status
// Index on (organizationId, email) at line 98

// Offering price lookup for walk-in pricing
// From offerings.ts lines 127-173: offeringPrice table with amountCents, currency, offeringId
// The walk-in booking needs to find the active offeringPrice for the resource type
```

### Wiring notes

- The `(public)` route group in Next.js uses parenthetical naming to create a route segment without affecting the URL path. The URL is `[orgSlug]/book/`, not `[orgSlug]/(public)/book/`.
- The public layout must: (1) resolve org by slug via `getOrgBySlug` (queries.ts line 34), (2) check `featureFlags.laneBooking`, (3) check org has Stripe Connect via `organizationPaymentAccount` table (organization-settings.ts line 82), (4) return 404 if any check fails.
- Walk-in pricing: look up `offering` + `offeringPrice` where offering is active, linked to the location via `offeringLocation`, and the offering metadata or rules map to the requested `resourceTypeId`. This is the "separate offerings per pricing tier" approach (design decision #4).
- Customer upsert: `INSERT ... ON CONFLICT (organizationId, email) DO UPDATE SET phone = COALESCE(EXCLUDED.phone, customer.phone)` -- or use Drizzle's `onConflictDoUpdate`. Note: the existing unique index is on `(organizationId, externalCustomerNumber)` (line 91-94), not `(organizationId, email)`. Need to verify if a unique constraint on `(organizationId, email)` exists or needs to be added.

## Acceptance criteria

- [ ] Public route at `[orgSlug]/book/` resolves org without authentication
- [ ] Public route returns 404 if `laneBooking` feature flag is disabled
- [ ] Public route returns 404 if org not found
- [ ] Available slots displayed for selected date + resource type
- [ ] Walk-in enters name, email, phone and submits
- [ ] Customer record created with `status: 'lead'` (or linked to existing by email)
- [ ] Stripe Checkout session created on org's Connect account with booking metadata
- [ ] Booking created with `status: 'pending'`, `bookerType: 'walk_in'`, `paymentMethod: 'stripe'`
- [ ] User redirected to Stripe Checkout
- [ ] If org has no Stripe Connect account, page shows "online booking not available"
- [ ] Input validated via Zod (email format, required fields)
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test
```

### Manual verification

1. Ensure org has `laneBooking: true` in feature flags and Stripe Connect onboarded
2. Visit `[orgSlug]/book/` in incognito (no auth)
3. Select date, resource type, time slot
4. Enter walk-in details, submit
5. Verify redirect to Stripe Checkout
6. Check DB: booking row with `pending` status, customer row with `lead` status

## Notes

- The public page has no access to `CurrentSession` -- the action must not depend on it. Use `Effect.provide(AppLive)` without `CurrentSession`.
- Rate limiting on the public endpoint should use the existing Better Auth rate limiter pattern mentioned in the design's security section. Check `proxy.ts` (line 1) for any existing rate limiting middleware.
- Walk-in email deduplication: if email matches existing customer in org, link booking to that customer rather than creating a duplicate. Update phone if provided and customer's phone is null.
