# Issue 19: Booking Unit Tests

## Summary

Write unit tests for all core booking logic: creation, availability, state machine, confirmation codes, and cancellation.

## Context

Tests live in `apps/web/src/__tests__/` following existing patterns. Test helpers in `apps/web/src/__tests__/helpers/` provide DB setup and auth mocking.

## Requirements

### Test Files

Create under `apps/web/src/__tests__/bookings/`:

#### `booking-creation.test.ts`
- Staff booking with `cash` payment creates confirmed booking
- Staff booking with `free` payment creates confirmed booking
- Staff booking with `entitlement` payment consumes entitlement
- Staff booking with insufficient entitlement fails
- Member booking with entitlement succeeds and is confirmed
- Member booking without entitlement creates Stripe Checkout and pending booking
- Walk-in booking creates customer with `lead` status
- Walk-in booking links to existing customer by email
- Walk-in booking fails if org has no Stripe Connect
- Booking for past time slot rejected
- Booking beyond `maxAdvanceBookingDays` rejected
- `createdByUserId` set correctly for staff, null for self-service

#### `booking-availability.test.ts`
- Returns correct slots for a day with standard operating hours
- Returns empty for closed day (null in operating hours)
- Confirmed bookings reduce available lane count
- Expired pending bookings do not reduce available lane count
- Non-expired pending bookings DO reduce available lane count
- Cancelled and no-show bookings don't affect availability
- Past slots filtered out when date is today
- Multiple resource types don't interfere with each other
- Slot duration respects `bookingRules.slotDurationMinutes`

#### `booking-state-machine.test.ts`
- All valid transitions succeed
- Invalid transitions rejected (e.g., `pending` -> `checked_in`)
- Terminal states (`cancelled`, `completed`, `no_show`) reject all transitions
- Each transition creates a `bookingEvent`
- `previousStatus` and `newStatus` correctly recorded in event

#### `booking-cancellation.test.ts`
- Cancellation within refund window triggers Stripe refund
- Cancellation outside refund window skips refund
- Cancellation of entitlement-paid booking reverses consumption
- Cancellation of `cash`/`free` booking has no payment action
- Cancellation of `pending` booking succeeds
- Cannot cancel already cancelled booking

#### `confirmation-code.test.ts`
- Generated code matches `BK-XXXX` format
- Code contains only uppercase alphanumeric characters
- Codes are unique within org (test with mock collision then retry)
- Different orgs can have same code

### Test Helpers

Add test seed helpers in `apps/web/src/__tests__/helpers/`:
- `createTestResource(orgId, locationId, resourceTypeId)` -- seed a resource
- `createTestResourceType(orgId)` -- seed a resource type
- `createTestBookingRules(orgId)` -- seed booking rules on org settings
- `createTestBooking(orgId, ...)` -- seed a booking directly for testing queries

## Files to Create

- `apps/web/src/__tests__/bookings/booking-creation.test.ts`
- `apps/web/src/__tests__/bookings/booking-availability.test.ts`
- `apps/web/src/__tests__/bookings/booking-state-machine.test.ts`
- `apps/web/src/__tests__/bookings/booking-cancellation.test.ts`
- `apps/web/src/__tests__/bookings/confirmation-code.test.ts`
- Additions to `apps/web/src/__tests__/helpers/db.ts` (or new `booking-helpers.ts`)

## Acceptance Criteria

- [ ] All test files created with comprehensive coverage of each module
- [ ] Tests follow existing patterns (Effect test helpers, DB mocking)
- [ ] Test seed helpers for resources, resource types, booking rules
- [ ] All core business logic paths covered
- [ ] Edge cases tested (race conditions documented even if not easily unit-testable)
- [ ] Tests pass against the booking schema and service code

## Dependencies

- Issues 1, 6, 7, 8, 9, 11, 13, 17 (all service code being tested)
