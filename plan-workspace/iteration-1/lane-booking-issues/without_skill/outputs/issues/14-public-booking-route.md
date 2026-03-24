# Issue 14: Public Booking Route and UI

## Summary

Create the public (unauthenticated) booking page at `[orgSlug]/(public)/book/` where walk-in customers can browse availability and start a booking.

## Context

The authenticated org layout (`[orgSlug]/layout.tsx`) enforces auth. The public route needs its own layout that resolves the org by slug without requiring login. This is a new route group.

## Requirements

### Route Structure

- `apps/web/src/app/[orgSlug]/(public)/layout.tsx` -- public layout (no auth, no sidebar, resolves org by slug)
- `apps/web/src/app/[orgSlug]/(public)/book/page.tsx` -- public booking page
- `apps/web/src/app/[orgSlug]/(public)/book/confirmation/page.tsx` -- post-checkout confirmation page

### Public Layout

1. Resolve org by slug (reuse `getOrgBySlug` from `queries.ts`)
2. Check feature flag `laneBooking` -- if disabled, 404
3. Check org has Stripe Connect account -- if not, show "Online booking not available" message
4. No sidebar, no auth check
5. Minimal branding layout (org name, logo if available)

### Public Booking Page

1. Show org name and location(s)
2. Date selector (default today, up to `maxAdvanceBookingDays` ahead)
3. Resource type selector (lane types available at selected location)
4. Available time slots grid (call availability service via server action)
5. Booking form: first name, last name, email, phone (optional)
6. On submit: call `createWalkInBooking`, redirect to Stripe Checkout URL

### Server Actions

Create `apps/web/src/app/[orgSlug]/(public)/book/actions.ts`:

1. `getPublicAvailableSlotsAction(orgSlug, locationId, resourceTypeId, date)` -- resolves org from slug, returns slots
2. `createPublicBookingAction(orgSlug, formData)` -- validates, creates walk-in booking, returns checkout URL
3. `getPublicBookingConfirmationAction(orgSlug, bookingId)` -- returns booking details for confirmation page (limited fields)

### Confirmation Page

After Stripe Checkout `success_url` redirect:
- Show confirmation code prominently
- Show booking summary (date, time, lane type, location)
- Show "You will receive a confirmation email"
- No sensitive data exposed (no payment details)

### Security

- All input validated via Zod
- Rate limiting: use existing Better Auth rate limiter pattern on server actions
- No auth cookies read or required
- Booking ID in confirmation URL is not guessable (uses `bkg_` nanoid prefix)

## Files to Create

- `apps/web/src/app/[orgSlug]/(public)/layout.tsx`
- `apps/web/src/app/[orgSlug]/(public)/book/page.tsx`
- `apps/web/src/app/[orgSlug]/(public)/book/confirmation/page.tsx`
- `apps/web/src/app/[orgSlug]/(public)/book/actions.ts`

## Acceptance Criteria

- [ ] Public route resolves org without authentication
- [ ] Returns 404 if feature flag disabled or org not found
- [ ] Slot availability displayed for selected date/location/resource type
- [ ] Walk-in form collects name, email, phone
- [ ] Submission redirects to Stripe Checkout
- [ ] Confirmation page shows booking details after Stripe success
- [ ] "Online booking not available" shown if no Stripe Connect
- [ ] No auth sidebar or session dependency

## Dependencies

- Issue 5 (feature flag)
- Issue 8 (availability)
- Issue 13 (walk-in booking service)
