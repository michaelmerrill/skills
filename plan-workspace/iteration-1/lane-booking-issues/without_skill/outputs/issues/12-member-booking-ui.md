# Issue 12: Member Booking UI Pages

## Summary

Create the authenticated member-facing booking pages where members can view available slots, book a lane, view their booking history, and see booking details.

## Context

Members access the booking UI through the authenticated org layout at `[orgSlug]/bookings/`. This shares the route prefix with staff pages but shows a different view based on the user's role.

## Requirements

### Routes

- `apps/web/src/app/[orgSlug]/bookings/book/page.tsx` -- member booking flow (select date, type, slot, confirm)
- Existing `[orgSlug]/bookings/page.tsx` (from Issue 10) should show member's own bookings if role is `member`
- Existing `[orgSlug]/bookings/[bookingId]/page.tsx` should show booking detail for member's own bookings

### Server Actions

Add to `apps/web/src/app/[orgSlug]/bookings/actions.ts`:

1. `getAvailableSlotsAction(locationId, resourceTypeId, date)` -- calls the availability service
2. `createMemberBookingAction(formData)` -- calls `createMemberBooking`, returns booking or checkout URL
3. `getMemberBookingsAction()` -- lists the current member's bookings

### Member Booking Flow Page

Step-by-step booking form:
1. Select location (if org has multiple)
2. Select lane type (resource types available at that location)
3. Select date
4. Show available time slots (call availability service, display as grid/list)
5. Confirm booking -- show summary, payment method (auto-detected: entitlement if available, otherwise Stripe)
6. On submit: create booking, redirect to confirmation or Stripe Checkout

### Member Booking List

- Filter the existing booking list to show only bookings where `customerId` matches the member's customer record
- Show upcoming and past bookings
- Quick actions: cancel (if allowed), view details

### Booking Confirmation View

After successful entitlement payment or Stripe return:
- Show confirmation code prominently
- Show booking details (date, time, lane type, location)
- Show QR code of confirmation code (or placeholder for Issue 15)

## Files to Create/Modify

- **Create**: `apps/web/src/app/[orgSlug]/bookings/book/page.tsx`
- **Modify**: `apps/web/src/app/[orgSlug]/bookings/actions.ts` -- add member-specific actions
- **Modify**: `apps/web/src/app/[orgSlug]/bookings/page.tsx` -- role-based view switching
- Supporting components in `apps/web/src/components/bookings/`

## Acceptance Criteria

- [ ] Member can navigate the multi-step booking flow
- [ ] Available slots rendered dynamically from availability service
- [ ] Entitlement balance shown on confirmation step when available
- [ ] Booking redirects to Stripe Checkout when payment needed
- [ ] Member sees only their own bookings in the list
- [ ] Feature flag gates access
- [ ] Graceful handling when no slots available

## Dependencies

- Issue 10 (staff UI establishes route structure)
- Issue 11 (member booking logic)
