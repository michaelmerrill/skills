# Member Self-Service Booking

> Part of: [Lane Booking](../../../../../../architect-workspace/iteration-1/lane-booking-design/with_skill/outputs/design.md)
> Issue: 5 of 8
> Type: HITL

## Blocked by

- [02-staff-booking-crud.md](./02-staff-booking-crud.md) -- needs `createBooking` service and state machine
- [03-availability-engine.md](./03-availability-engine.md) -- needs `getAvailableSlots` and `findAvailableLane`

## What to build

Implement the authenticated member booking flow. Members see available slots for a date + lane type, select a slot, and book. Payment resolves via entitlement first; if insufficient, falls back to Stripe Checkout on the org's Connect account. Includes the member booking page at `[orgSlug]/bookings/new`, server action for member booking, entitlement integration in the booking service, and booking history view. HITL because slot picker and booking form layout need human review.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/bookings/new/page.tsx` | Member booking page: location/date/lane-type picker, slot grid, book button | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` for RSC pattern |
| `apps/web/src/components/bookings/slot-picker.tsx` | Client component: date picker, slot grid display, book action trigger | Follow `apps/web/src/components/customers/customers-table.tsx` for client component + action pattern |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `createMemberBooking` function that: checks entitlement via `getEntitlementBalance` (line 177 of `entitlements.ts`), calls `consumeEntitlement` if sufficient, creates Stripe Checkout session via Connect if not, calls `createBooking` with appropriate `bookerType: 'member'` and `paymentMethod`. |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Add `createMemberBookingAction`, `getAvailableSlotsAction` server actions |
| `apps/web/src/lib/validation.ts` | Add `createMemberBookingSchema` with fields: `orgId`, `locationId`, `resourceTypeId`, `startTime`, `endTime` |

## Context

### Patterns to follow
- `apps/web/src/lib/entitlements.ts` lines 94-175: `consumeEntitlement` -- atomic balance check + deduction in transaction. Called from `createMemberBooking`.
- `apps/web/src/lib/stripe.ts` lines 85-142: `createSaasCheckoutSession` -- Stripe checkout pattern. Adapt for Connect: use `stripe.checkout.sessions.create({ ..., stripe_account: connectedAccountId })`.
- `apps/web/src/lib/stripe.ts` lines 70-78: `withConnectedAccount` helper to get connected account ID.

### Key types
```typescript
export const createMemberBooking = (data: {
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  startTime: Date;
  endTime: Date;
  orgSlug: string;
}): Effect<
  { booking: Booking } | { checkoutUrl: string },
  BookingError | StripeError | InsufficientEntitlement | StripeAccountNotFound
>

// Entitlement check: find customer by userId in org, then:
// getEntitlementBalance(orgId, customerId, entitlementType)
// where entitlementType maps from resourceType (stored in offering rules or metadata)
```

### Wiring notes
- Member's `customerId` lookup: query `customer` table by `(organizationId, userId)` from session. If no customer record, member has no entitlements -- go straight to Stripe.
- Stripe Checkout for member: create session on connected account with `metadata: { bookingId }`, `success_url` back to `/bookings`, `cancel_url` back to `/bookings/new`.
- `findAvailableLane` must be called inside `createMemberBooking` to auto-assign the lane.

## Acceptance criteria

- [ ] Member can view available slots for a date + lane type
- [ ] Slot availability correctly reflects existing bookings + operating hours
- [ ] Lane auto-assigned by `sortOrder` (member does not pick specific lane)
- [ ] Member with sufficient entitlement: booking created as `confirmed`, entitlement consumed atomically
- [ ] Member with insufficient entitlement: redirected to Stripe Checkout on Connect account
- [ ] Booking created as `pending` when payment via Stripe
- [ ] Member without customer record gets appropriate error
- [ ] Org without Connect account shows "Payment not available" error
- [ ] `biome check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web && bun run test -- --grep "booking"
bun run lint
bun run build
```

### Manual verification
1. Log in as a member of an org with `laneBooking` flag enabled
2. Navigate to `/bookings/new`
3. Select date, lane type -- slot grid appears
4. Book a slot -- if entitlement available, booking confirmed immediately
5. If no entitlement, redirect to Stripe Checkout
