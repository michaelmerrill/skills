# Issue 18: Check-in Flow

## Summary

Implement the check-in feature where staff can look up a booking by confirmation code (manual entry or QR scan) and mark it as checked in.

## Context

Check-in is a staff-only operation. The confirmation code `BK-XXXX` is displayed on the customer's email (with QR code) and can be looked up directly.

## Requirements

### Function: Check In

```typescript
export const checkInBooking = (data: {
  orgId: string;
  confirmationCode: string;
  actorId: string; // staff user ID
}): Effect<Booking, BookingNotFound | InvalidBookingTransition | InvalidBookingTime | DatabaseError>
```

### Logic

1. Look up booking by `(organizationId, confirmationCode)` using the unique index
2. Validate booking status is `confirmed`
3. Validate booking time window: `startTime` is within 30 minutes before to `endTime` (i.e., can't check in hours early or after the slot ended)
4. Transition booking status to `checked_in` (via state machine, Issue 7)
5. Return updated booking

### Function: Mark No-Show

```typescript
export const markNoShow = (data: {
  orgId: string;
  bookingId: string;
  actorId: string;
}): Effect<void, BookingNotFound | InvalidBookingTransition | DatabaseError>
```

### Logic

1. Look up booking
2. Validate status is `confirmed` (can only no-show a confirmed booking that wasn't checked in)
3. Validate: `endTime` has passed (can't mark no-show before the slot ends)
4. Transition to `no_show`

### Function: Complete Booking

```typescript
export const completeBooking = (data: {
  orgId: string;
  bookingId: string;
  actorId: string;
}): Effect<void, BookingNotFound | InvalidBookingTransition | DatabaseError>
```

### Logic

1. Look up booking
2. Validate status is `checked_in`
3. Transition to `completed`

### Server Actions

Add to bookings actions:
- `checkInAction(confirmationCode)` -- staff only
- `markNoShowAction(bookingId)` -- staff only
- `completeBookingAction(bookingId)` -- staff only

### Check-in Search UI

Add a confirmation code search input to the staff bookings page:
- Text input for manual code entry
- Support QR code scanning (camera-based QR reader component, or simple text input -- QR scanning can be a follow-up)
- On match: show booking details with "Check In" button
- Validation errors shown inline (wrong code, already checked in, too early, etc.)

## Files to Modify

- **Modify**: `apps/web/src/lib/bookings.ts` -- add `checkInBooking`, `markNoShow`, `completeBooking`
- **Modify**: `apps/web/src/app/[orgSlug]/bookings/actions.ts` -- add check-in actions
- **Modify**: `apps/web/src/app/[orgSlug]/bookings/page.tsx` -- add check-in search UI

## Acceptance Criteria

- [ ] Staff can look up booking by confirmation code
- [ ] Check-in validates booking status is `confirmed`
- [ ] Check-in validates time window (30 min before start to slot end)
- [ ] Check-in transitions to `checked_in` with event recorded
- [ ] No-show marking only allowed after slot end time
- [ ] Complete transitions from `checked_in` to `completed`
- [ ] All operations record `bookingEvent` entries
- [ ] Staff-only access enforced

## Dependencies

- Issue 7 (state machine)
- Issue 10 (staff UI)
