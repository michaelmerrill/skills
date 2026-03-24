# Issue 10: Staff Booking Dashboard -- Server Actions and UI

## Summary

Create the staff-facing booking management pages at `[orgSlug]/bookings/` with server actions for creating bookings, viewing the booking list, and basic booking details.

## Context

The app uses Next.js RSC (React Server Components) with server actions for mutations. Existing patterns can be seen in `apps/web/src/app/[orgSlug]/settings/actions.ts` and the customers/settings pages.

## Requirements

### Routes

Create the following route structure:
- `apps/web/src/app/[orgSlug]/bookings/page.tsx` -- booking list (today's bookings, upcoming, filterable)
- `apps/web/src/app/[orgSlug]/bookings/new/page.tsx` -- create booking form
- `apps/web/src/app/[orgSlug]/bookings/[bookingId]/page.tsx` -- booking detail/management

### Server Actions

Create `apps/web/src/app/[orgSlug]/bookings/actions.ts`:

1. `createBookingAction(formData)` -- validates input, calls `createStaffBooking`, returns result
2. `listBookingsAction(filters)` -- queries bookings for the org with pagination, date range, status filters
3. `getBookingAction(bookingId)` -- fetches single booking with related data (customer, resource, events)

Follow the existing pattern of Effect -> server action bridge (run Effect with `AppLive` layer, handle errors, return serializable result).

### Booking List Page

- Show today's bookings by default
- Columns: time, lane (resource name), customer name, status, confirmation code, payment method
- Filter by: date, status, location
- Sort by start time
- Feature flag gate: 404 if `laneBooking` not enabled

### Create Booking Form

- Location selector (from org's locations)
- Date picker
- Resource type selector (lane types at that location)
- Available time slot selector (calls availability service)
- Customer search (search existing customers by name/email)
- Payment method selector: `cash`, `free`, `entitlement` (if customer has balance), `stripe`
- Notes field
- Submit creates booking via server action

### Booking Detail Page

- Show all booking fields
- Show booking event history (timeline of status changes)
- Action buttons based on current status (check-in, cancel, mark no-show)

## Files to Create

- `apps/web/src/app/[orgSlug]/bookings/page.tsx`
- `apps/web/src/app/[orgSlug]/bookings/new/page.tsx`
- `apps/web/src/app/[orgSlug]/bookings/[bookingId]/page.tsx`
- `apps/web/src/app/[orgSlug]/bookings/actions.ts`
- Supporting components as needed in `apps/web/src/components/bookings/`

## Acceptance Criteria

- [ ] Booking list page shows today's bookings with filtering
- [ ] Create booking form allows staff to select all required fields
- [ ] Available slots shown dynamically based on date/location/resource type selection
- [ ] Booking created successfully via server action
- [ ] Booking detail page shows all info and event history
- [ ] Feature flag gates access (404 if disabled)
- [ ] Permission check: only owner/admin can access
- [ ] Error states handled gracefully (no lanes available, etc.)

## Dependencies

- Issue 5 (feature flag gate)
- Issue 8 (availability service)
- Issue 9 (create staff booking)
