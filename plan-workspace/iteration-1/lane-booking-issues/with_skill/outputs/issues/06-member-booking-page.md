# Member Self-Service Booking Page + Actions

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 6 of 11
> Type: HITL

## Blocked by

- [04-feature-flag-sidebar.md](./04-feature-flag-sidebar.md) -- needs feature flag gating on bookings pages
- [05-availability-engine.md](./05-availability-engine.md) -- needs `getAvailableSlots` and `assignLane`

## What to build

Create the member-facing booking page at `[orgSlug]/bookings/new/` where authenticated members can: select a date, choose a resource type (lane type), view available time slots, and book a slot. The booking form calls `assignLane` to auto-assign a specific lane by `sortOrder`. Create `createMemberBooking` Effect function that orchestrates: availability check, lane assignment, and `createBooking` with `bookerType: 'member'`. Add booking history page at `[orgSlug]/bookings/history/` showing the member's own bookings.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `createMemberBooking(data)` function: checks membership, calls `assignLane`, calls `createBooking` with `bookerType: 'member'`. Add `getBookingsForCustomer(orgId, customerId)` query for booking history. |
| `apps/web/src/lib/validation.ts` | Add `createMemberBookingSchema`: `orgId`, `locationId`, `resourceTypeId`, `date`, `slotStartTime`, `slotEndTime` |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Add `createMemberBooking` server action, `getAvailableSlotsAction` server action |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/bookings/new/page.tsx` | Member booking form: date picker, resource type selector, slot grid, book button | Follow `apps/web/src/app/[orgSlug]/settings/locations/new/page.tsx` for form page pattern |
| `apps/web/src/app/[orgSlug]/bookings/history/page.tsx` | Member's booking history table | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` for list page pattern |

## Context

### Patterns to follow
- `apps/web/src/app/[orgSlug]/settings/locations/new/page.tsx`: RSC page with form, server action submission.
- `apps/web/src/app/[orgSlug]/customers/page.tsx` (lines 1-40): paginated list page with RSC data fetching.
- `apps/web/src/app/[orgSlug]/settings/actions.ts` (lines 38-65): server action with Zod validation, session fetch, Effect pipe.

### Key types
```typescript
type CreateMemberBookingData = {
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  startTime: Date;
  endTime: Date;
};

// createMemberBooking returns either:
// - Booking with status 'confirmed' (if payment resolved)
// - Booking with status 'pending' + stripeCheckoutUrl (if Stripe payment needed)
// - Error: NoLanesAvailable, PermissionDenied, etc.

// Customer linkage: member's userId -> customer.userId lookup
```

### Wiring notes
- Member's `customerId` resolved via `customer.userId = session.user.id` within the org. If no customer record exists for the member, this is an error (members must have a customer record).
- `createMemberBooking` calls `assignLane` from `booking-availability.ts` then `createBooking` from `bookings.ts`.
- Payment method determination (entitlement vs Stripe) is handled in issue #7. For now, `createMemberBooking` sets `paymentMethod: 'free'` as placeholder and status `confirmed`.
- The slot grid should show available slots from `getAvailableSlots`, with each slot showing available lane count.

## Acceptance criteria

- [ ] Member can view available slots for a selected date + location + resource type
- [ ] Slot grid shows only future slots within operating hours
- [ ] Member can book a slot -- lane auto-assigned by `sortOrder`
- [ ] Booking created with `bookerType: 'member'`, correct `resourceId` from auto-assignment
- [ ] Booking history page shows member's own bookings (filtered by `customerId` linked to `userId`)
- [ ] Feature flag check on booking pages (404 if disabled)
- [ ] Non-member users see permission error
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun test` passes

## Verification

```bash
cd apps/web
bunx biome check src/lib/bookings.ts src/app/\[orgSlug\]/bookings/
bun run build
bun test
```

### Manual verification
1. Log in as a member of an org with `laneBooking` flag enabled
2. Navigate to `/bookings/new` -- see date picker, resource type selector
3. Select a date and resource type -- see available time slots
4. Book a slot -- confirmation code displayed
5. Navigate to `/bookings/history` -- see the booking listed

## Notes

- This is HITL because the booking form UX (date picker, slot grid layout, confirmation flow) needs human review.
- Payment integration is NOT in this issue. All bookings are `paymentMethod: 'free'` / status `confirmed` until issue #7 adds entitlement logic and issue #9 adds Stripe.
- The slot grid is the most complex UI element -- consider a simple time-slot list initially rather than a calendar grid.
