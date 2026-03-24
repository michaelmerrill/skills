# Issue 8: Slot Availability Service

## Summary

Implement the `getAvailableSlots` function that computes available time slots for a given date, location, and resource type by cross-referencing operating hours, existing bookings, and active resources.

## Context

This is a pure query function with no side effects. It is the core of the booking UX -- users see available slots and pick one. The design specifies auto-assignment by `resource.sortOrder` (fill lowest-numbered lane first).

## Requirements

### Function Signature

```typescript
export const getAvailableSlots = (query: {
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  date: string; // ISO date, e.g., "2026-03-25"
}): Effect<Slot[], DatabaseError>
```

### `Slot` Type

```typescript
type Slot = {
  startTime: Date;
  endTime: Date;
  availableLaneCount: number;
};
```

### Logic

1. Fetch `bookingRules` from `organizationSetting` for the org
2. Determine the day of week for the requested date
3. Look up operating hours for the location + day from `bookingRules.operatingHours`
4. If location is closed that day (null entry or missing), return empty array
5. Generate time slots based on `slotDurationMinutes` between `open` and `close`
6. For each slot, count available lanes:
   - Query `resource` WHERE `resourceTypeId` matches, `locationId` matches, `isActive = true`
   - Query `booking` WHERE overlaps with slot time range AND `status` NOT IN (`cancelled`, `no_show`) AND (not `pending` or pending but not expired based on `pendingExpirationMinutes`)
   - Available = total active resources - booked resources for that slot
7. Filter out slots where `availableLaneCount <= 0`
8. Filter out slots in the past (if date is today)
9. Return sorted by `startTime`

### Pending Booking Expiration

A `pending` booking should NOT block a slot if `booking.createdAt + pendingExpirationMinutes < now()`. This is the "natural expiration" behavior described in the design (no background job needed).

### Performance

The design notes this should be sub-50ms with the composite index `(orgId, resourceId, startTime, endTime, status)`. Use a single query with appropriate WHERE conditions rather than N+1 per slot.

## Files to Create/Modify

- **Create**: `apps/web/src/lib/booking-availability.ts`

## Acceptance Criteria

- [ ] Returns available slots for a date/location/resource type
- [ ] Respects operating hours from `bookingRules`
- [ ] Correctly accounts for existing bookings (confirmed, checked_in, completed)
- [ ] Expired pending bookings do not block slots
- [ ] Past time slots excluded when date is today
- [ ] Slot duration driven by `bookingRules.slotDurationMinutes`
- [ ] Efficient query (no N+1 per slot)
- [ ] Returns `availableLaneCount` per slot

## Dependencies

- Issue 1 (booking schema)
- Issue 2 (BookingRules type)
