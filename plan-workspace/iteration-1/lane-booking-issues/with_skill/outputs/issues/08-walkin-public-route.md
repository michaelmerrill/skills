# Walk-in Public Booking Route + Customer Upsert

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 8 of 11
> Type: HITL

## Blocked by

- [05-availability-engine.md](./05-availability-engine.md) -- needs `getAvailableSlots` and `assignLane` for the public booking flow

## What to build

Create the public (unauthenticated) booking route at `[orgSlug]/(public)/book/` for walk-in customers. The page resolves the org by slug without requiring auth, shows available slots, collects customer details (name, email, phone), and creates a booking with `bookerType: 'walk_in'`. Implement customer upsert: find existing customer by `(organizationId, email)` or create new one with `status: 'lead'`. The booking is created as `pending` and the customer is redirected to Stripe Checkout (wired in issue #9). Gate the route behind the `laneBooking` feature flag and check for Stripe Connect onboarding.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `createWalkInBooking(data)`: upserts customer, calls `assignLane`, calls `createBooking` with `bookerType: 'walk_in'`, `paymentMethod: 'stripe'`, `status: 'pending'`. |
| `apps/web/src/lib/validation.ts` | Add `createWalkInBookingSchema`: `orgSlug`, `locationId`, `resourceTypeId`, `startTime`, `endTime`, `firstName`, `lastName`, `email`, `phone`. Add `walkInCustomerSchema` for the customer details portion. |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/(public)/book/page.tsx` | Public booking page: slot selection, customer details form, submit | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` for RSC pattern; this page does NOT use the org layout (no sidebar) |
| `apps/web/src/app/[orgSlug]/(public)/book/actions.ts` | Server action for walk-in booking creation (no session required) | Follow `apps/web/src/app/[orgSlug]/customers/actions.ts` but without `CurrentSession` dependency |
| `apps/web/src/app/[orgSlug]/(public)/layout.tsx` | Minimal public layout without sidebar or auth check | New file -- simple wrapper, no `getSession` call |
| `apps/web/src/__tests__/bookings/walkin-booking.test.ts` | Tests for walk-in booking, customer upsert, feature flag gate | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` pattern |

## Context

### Patterns to follow
- `apps/web/src/app/[orgSlug]/layout.tsx` (lines 12-90): org resolution by slug. The public layout uses the same `getOrgBySlug` but skips session/membership checks.
- `apps/web/src/lib/queries.ts` (lines 34-57): `getOrgBySlug(slug)` returns `{ id, name, slug, timezone }`.
- `apps/web/src/lib/db/schema/customers.ts` (lines 35-114): `customer` table with `email`, `firstName`, `lastName`, `status`, `organizationId`. Index on `(organizationId, email)` at line 98.
- `apps/web/src/lib/db/schema/organization-settings.ts` (lines 82-108): `organizationPaymentAccount` table with `externalAccountId` for Stripe Connect status.

### Key types
```typescript
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

// Customer upsert: find by (orgId, email), create if not found
// Uses: customer table index customer_organization_id_email_idx (line 98)
```

### Wiring notes
- The `(public)` route group in Next.js uses parentheses to create a layout group without affecting the URL path. The URL is `/<orgSlug>/book/`, not `/<orgSlug>/(public)/book/`.
- Public layout must: resolve org by slug, fetch `organizationSetting` for feature flag + booking rules, fetch `organizationPaymentAccount` to check Stripe Connect status. If no Stripe Connect, show "Online booking not available" message.
- Customer upsert logic: `SELECT FROM customer WHERE organizationId = ? AND email = ? LIMIT 1`. If found, use existing. If not, `INSERT INTO customer` with `status: 'lead'`, `firstName`, `lastName`, `email`, `phone`.
- Walk-in booking action does NOT require `CurrentSession` -- it's unauthenticated. All input validated via Zod schemas.
- Pricing: look up active `offering` + `offeringPrice` for the resource type at the location. Store `offeringPriceId` and `amountCentsPaid` on the booking.

## Acceptance criteria

- [ ] Public route at `/<orgSlug>/book/` resolves org without authentication
- [ ] Returns 404 if org not found or `laneBooking` feature flag disabled
- [ ] Shows "Online booking not available" if org has no Stripe Connect account
- [ ] Walk-in can select location, date, resource type, view available slots
- [ ] Walk-in enters name, email, phone in customer details form
- [ ] Customer upserted: existing customer found by `(orgId, email)` or new one created with `status: 'lead'`
- [ ] Booking created with `bookerType: 'walk_in'`, `paymentMethod: 'stripe'`, `status: 'pending'`
- [ ] `offeringPriceId` and `amountCentsPaid` set from offering pricing
- [ ] No session/auth required for the public route
- [ ] All input validated via Zod (name, email, phone, slot times)
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun test` passes

## Verification

```bash
cd apps/web
bunx biome check src/lib/bookings.ts src/app/\[orgSlug\]/\(public\)/
bun run build
bun test src/__tests__/bookings/walkin-booking.test.ts
```

### Manual verification
1. Navigate to `<orgSlug>/book/` while not logged in -- page loads
2. Select a date, resource type, time slot
3. Enter name, email, phone
4. Submit -- booking created in `pending` status (Stripe redirect in issue #9)
5. Check `customer` table -- new row with `status: 'lead'` or existing customer linked

## Notes

- This is HITL because the public-facing booking page UX needs human review for branding, form layout, and customer experience.
- Stripe Checkout redirect is NOT wired in this issue -- the action returns the booking ID and the Stripe session creation happens in issue #9. For now the form submits and shows a "booking created" placeholder.
- Rate limiting on the public endpoint uses the existing Better Auth rate limiter pattern if available, or can be deferred.
