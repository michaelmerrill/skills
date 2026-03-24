# Issue 9: Create Booking -- Staff Flow

## Summary

Implement the `createBooking` function for staff-created bookings. Staff can book on behalf of a customer with payment methods: `cash`, `free`, `entitlement`, or `stripe`. This is the simplest booking creation path and establishes the core booking insertion logic.

## Context

Staff bookings are always immediately `confirmed` (no pending state). Staff select a customer, time slot, and payment method from the dashboard. This builds on the schema (Issue 1), state machine (Issue 7), confirmation code (Issue 6), and availability (Issue 8).

## Requirements

### Zod Schema

Add to `validation.ts`:

```typescript
export const createStaffBookingSchema = z.object({
  orgId: z.string().min(1),
  locationId: z.string().min(1),
  resourceTypeId: z.string().min(1),
  customerId: z.string().min(1),
  date: z.string(), // ISO date
  startTime: z.string(), // ISO datetime
  endTime: z.string(), // ISO datetime
  paymentMethod: z.enum(["entitlement", "stripe", "cash", "free"]),
  notes: z.string().optional(),
});
```

### Function Signature

```typescript
export const createStaffBooking = (
  data: CreateStaffBookingData,
  staffUserId: string,
): Effect<Booking, NoLanesAvailable | BookingConflict | InsufficientEntitlement | DatabaseError | ...>
```

### Logic

1. Validate time is not in the past (`InvalidBookingTime`)
2. Check lane availability for the requested slot (reuse `getAvailableSlots` or a direct query)
3. Auto-assign lane: query `resource` for the matching type/location, ordered by `sortOrder`, find first without a conflicting booking. Use `SELECT FOR UPDATE` to prevent race conditions
4. Generate confirmation code (Issue 6)
5. Handle payment:
   - `cash` / `free`: no external action needed
   - `entitlement`: call `consumeEntitlement` from `entitlements.ts` -- needs customer's grant for the entitlement type
   - `stripe`: create Stripe charge on Connect account (or defer to a checkout session)
6. In a transaction:
   - INSERT `booking` with status `confirmed`, `bookerType: 'staff'`, `createdByUserId: staffUserId`
   - INSERT `bookingEvent` with `eventType: 'created'`, `newStatus: 'confirmed'`
7. Return the created booking

### Lane Auto-Assignment

```sql
SELECT resource.* FROM resource
WHERE resource.resourceTypeId = ?
  AND resource.locationId = ?
  AND resource.organizationId = ?
  AND resource.isActive = true
  AND resource.id NOT IN (
    SELECT booking.resourceId FROM booking
    WHERE booking.organizationId = ?
      AND booking.resourceId = resource.id
      AND booking.status NOT IN ('cancelled', 'no_show')
      AND booking.startTime < ? -- endTime
      AND booking.endTime > ?   -- startTime
  )
ORDER BY resource.sortOrder ASC
LIMIT 1
FOR UPDATE
```

## Files to Modify

- **Modify**: `apps/web/src/lib/bookings.ts` -- add `createStaffBooking`
- **Modify**: `apps/web/src/lib/validation.ts` -- add `createStaffBookingSchema`

## Acceptance Criteria

- [ ] Staff can create a booking for a customer with `cash` or `free` payment
- [ ] Staff can create a booking consuming customer's entitlement
- [ ] Lane auto-assigned by `sortOrder`
- [ ] Race condition prevented via `SELECT FOR UPDATE`
- [ ] Confirmation code generated and stored
- [ ] `bookingEvent` created alongside booking
- [ ] Booking status is `confirmed` immediately
- [ ] `createdByUserId` set to staff user ID
- [ ] Past time slots rejected

## Dependencies

- Issue 1 (schema)
- Issue 3 (errors)
- Issue 6 (confirmation code)
- Issue 7 (state machine)
- Issue 8 (availability)
