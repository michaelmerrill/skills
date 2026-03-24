# Walk-in Public Booking + Stripe Checkout

> Part of: [Lane Booking](../../../../../../architect-workspace/iteration-1/lane-booking-design/with_skill/outputs/design.md)
> Issue: 6 of 8
> Type: HITL

## Blocked by

- [03-availability-engine.md](./03-availability-engine.md) -- needs `getAvailableSlots` and `findAvailableLane`
- [05-member-self-service.md](./05-member-self-service.md) -- needs Stripe Checkout on Connect pattern established in member flow

## What to build

Implement the public (unauthenticated) booking page at `[orgSlug]/(public)/book/`. Walk-in customers select a slot, enter name/email/phone, and pay via Stripe Checkout on the org's Connect account. Customer auto-created as `lead` (or linked to existing by email within org). Public route returns 404 if feature flag disabled or org not found. Org without Stripe Connect shows "online booking not available". HITL because public-facing page layout needs human review.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/(public)/book/page.tsx` | Public booking page (RSC): org resolution without auth, slot picker, walk-in form | Follow `apps/web/src/app/[orgSlug]/layout.tsx` lines 23-28 for org-by-slug lookup, but skip auth check |
| `apps/web/src/app/[orgSlug]/(public)/book/actions.ts` | Server actions: `createWalkInBookingAction` (no session required), `getPublicSlotsAction` | Follow `apps/web/src/app/[orgSlug]/bookings/actions.ts` but without `CurrentSession` |
| `apps/web/src/app/[orgSlug]/(public)/layout.tsx` | Public layout: minimal chrome, no sidebar, no auth requirement | New pattern -- simple layout with org branding |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `createWalkInBooking` function: upsert customer by `(orgId, email)`, resolve offering price for resource type, create Stripe Checkout session on Connect, insert booking as `pending` with `bookerType: 'walk_in'` |
| `apps/web/src/lib/validation.ts` | Add `createWalkInBookingSchema` with: `orgSlug`, `locationId`, `resourceTypeId`, `startTime`, `endTime`, `firstName`, `lastName`, `email`, `phone` |

## Context

### Patterns to follow
- `apps/web/src/lib/queries.ts` lines 34-57: `getOrgBySlug` for resolving org from slug without auth.
- `apps/web/src/lib/stripe.ts` lines 85-142: Stripe Checkout session creation pattern. Adapt: `stripe_account` param for Connect, `metadata: { bookingId, orgId }`.
- `apps/web/src/lib/db/schema/customers.ts` lines 35-114: `customer` table -- upsert by `(organizationId, email)` for walk-in deduplication.

### Key types
```typescript
export const createWalkInBooking = (data: {
  orgSlug: string;
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  startTime: Date;
  endTime: Date;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}): Effect<{ checkoutUrl: string }, BookingError | StripeError | StripeAccountNotFound>

// Customer upsert: SELECT customer WHERE orgId AND email, else INSERT with status: 'lead'
// Offering price lookup: find active offering + offeringPrice for resourceType
// Stripe Checkout: on connected account, with booking metadata
```

### Wiring notes
- Public route group `(public)` uses a separate layout with no sidebar and no auth check.
- Feature flag check: query `organizationSetting.featureFlags.laneBooking` in the page component. If falsy, call `notFound()`.
- Connect account check: if org has no `organizationPaymentAccount.externalAccountId`, render "Online booking not available" message instead of the form.
- Offering price resolution: look up `offering` + `offeringPrice` where offering is active and linked to the resource type (via `offering.metadata` or a naming convention). Store `offeringPriceId` and `amountCentsPaid` on the booking.

## Acceptance criteria

- [ ] Public route at `[orgSlug]/(public)/book/` resolves org without auth
- [ ] Returns 404 if feature flag `laneBooking` is disabled or org not found
- [ ] Walk-in can select slot, enter details (name, email, phone)
- [ ] Customer auto-created as `lead` if new email; linked to existing if email matches within org
- [ ] Stripe Checkout session created on org's Connect account with booking metadata
- [ ] Booking inserted as `pending` with `bookerType: 'walk_in'`, `paymentMethod: 'stripe'`
- [ ] Org without Stripe Connect shows "Online booking not available"
- [ ] `biome check` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web && bun run build
bun run lint
```

### Manual verification
1. Navigate to `/{orgSlug}/book/` while logged out
2. Page loads with slot picker and walk-in form
3. Select slot, fill in details, submit -- redirect to Stripe Checkout
4. Test with org that has no Connect account -- shows "not available" message
5. Test with `laneBooking: false` -- returns 404
