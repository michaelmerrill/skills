# Issue 7: Booking Status State Machine

## Summary

Implement the booking status state machine that enforces valid transitions and records each transition as a `bookingEvent`. Follow the `subscriptionChangeEvent` pattern in `subscriptions.ts`.

## Context

The codebase already has a state machine pattern for subscriptions (see `VALID_TRANSITIONS` in `apps/web/src/lib/subscriptions.ts`). Bookings need an equivalent.

## Requirements

### Valid Transitions

```
pending    -> confirmed, cancelled
confirmed  -> checked_in, cancelled, no_show
checked_in -> completed
completed  -> (terminal)
cancelled  -> (terminal)
no_show    -> (terminal)
```

### Function

```typescript
export const transitionBookingStatus = (data: {
  orgId: string;
  bookingId: string;
  newStatus: BookingStatus;
  actorId?: string;
  metadata?: Record<string, unknown>;
}): Effect<Booking, BookingNotFound | InvalidBookingTransition | DatabaseError>
```

### Logic

1. Look up booking by `(id, organizationId)`
2. If not found, return `BookingNotFound`
3. Check if `currentStatus -> newStatus` is in `VALID_TRANSITIONS`
4. If invalid, return `InvalidBookingTransition`
5. In a transaction:
   - UPDATE `booking.status` to `newStatus`, update `updatedAt`
   - INSERT `bookingEvent` with `eventType` derived from `newStatus`, `previousStatus`, `newStatus`, `actorId`, `metadata`
6. Return updated booking

### Event Type Mapping

Map the new status to an event type:
- `confirmed` -> `confirmed`
- `checked_in` -> `checked_in`
- `completed` -> `completed`
- `cancelled` -> `cancelled`
- `no_show` -> `no_show`
- Special: `payment_received` and `refunded` are recorded separately by payment flows, not by this function

### Zod Validation Schema

Add `transitionBookingStatusSchema` to `validation.ts`:
```typescript
export const transitionBookingStatusSchema = z.object({
  orgId: z.string().min(1),
  bookingId: z.string().min(1),
  newStatus: z.enum(["pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"]),
  actorId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
```

## Files to Modify

- **Modify**: `apps/web/src/lib/bookings.ts` -- add `transitionBookingStatus` and `VALID_TRANSITIONS`
- **Modify**: `apps/web/src/lib/validation.ts` -- add `transitionBookingStatusSchema`

## Acceptance Criteria

- [ ] `VALID_TRANSITIONS` map defined with all valid state transitions
- [ ] `transitionBookingStatus` enforces the state machine
- [ ] Invalid transitions return `InvalidBookingTransition` error
- [ ] Each transition creates a `bookingEvent` record
- [ ] Transaction ensures atomicity of status update + event insert
- [ ] Follows the same Effect pattern as `transitionSubscriptionStatus`

## Dependencies

- Issue 1 (booking schema)
- Issue 3 (error types)
