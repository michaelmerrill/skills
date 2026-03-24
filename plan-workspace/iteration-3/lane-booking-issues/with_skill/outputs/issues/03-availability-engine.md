# Availability Engine

> Part of: [Lane Booking](../../../../../../architect-workspace/iteration-1/lane-booking-design/with_skill/outputs/design.md)
> Issue: 3 of 8
> Type: AFK

## Blocked by

- [01-booking-schema.md](./01-booking-schema.md) -- needs `booking` table for conflict detection queries

## What to build

Implement `getAvailableSlots` and `findAvailableLane` -- the pure query functions that compute slot availability from operating hours, existing bookings, and active resources. `getAvailableSlots` returns time slots for a given date + location + resource type. `findAvailableLane` returns the first available `resource` by `sortOrder` for a specific time slot (auto-assignment). Includes filtering out expired pending bookings per `pendingExpirationMinutes`. Includes unit tests for slot computation, conflict detection, operating hours, and expired pending filtering.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/booking-availability.ts` | `getAvailableSlots`, `findAvailableLane` Effect services | Follow `apps/web/src/lib/entitlements.ts` lines 177-202 for pure query Effect pattern (depends only on `DbService`) |
| `apps/web/src/__tests__/bookings/booking-availability.test.ts` | Tests: slot computation, conflict detection, operating hours, expired pending filtering | Follow `apps/web/src/__tests__/settings/entitlement-ledger.test.ts` lines 1-60 for setup |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/validation.ts` | Add `slotQuerySchema` with fields: `orgId`, `locationId`, `resourceTypeId`, `date` (ISO string), and `SlotQuery` type export |

## Context

### Patterns to follow
- `apps/web/src/lib/entitlements.ts` lines 177-202: `getEntitlementBalance` -- pure query Effect that depends only on `DbService`, no session needed.
- `apps/web/src/lib/db/schema/resources.ts` lines 61-114: `resource` table with `sortOrder`, `isActive`, `locationId`, `resourceTypeId` fields.
- `apps/web/src/lib/db/schema/organization-settings.ts` line 33: `bookingRules` JSONB column on `organizationSetting`.

### Key types
```typescript
export type Slot = {
  startTime: Date;
  endTime: Date;
  availableLaneCount: number;
};

export const getAvailableSlots = (query: SlotQuery): Effect<Slot[], DatabaseError>
// 1. Read bookingRules from organizationSetting for slotDurationMinutes + operatingHours
// 2. Get operating hours for query.locationId + dayOfWeek from query.date
// 3. Generate slot windows from open to close by slotDurationMinutes
// 4. For each slot: count resources of resourceTypeId at locationId that are isActive
//    minus count of bookings that overlap [startTime, endTime) and status NOT in ('cancelled', 'no_show')
//    and NOT (status = 'pending' AND createdAt < now() - pendingExpirationMinutes)

export const findAvailableLane = (
  orgId: string, locationId: string, resourceTypeId: string,
  startTime: Date, endTime: Date
): Effect<Resource | null, DatabaseError>
// SELECT resource.* WHERE resourceTypeId = ? AND locationId = ? AND isActive = true
//   AND NOT EXISTS (conflicting non-cancelled, non-expired-pending booking)
// ORDER BY sortOrder LIMIT 1
```

### Wiring notes
- This module depends only on `DbService` -- no session, no Stripe. Keeps it testable.
- Conflict detection query must use the composite index `(organizationId, resourceId, startTime, endTime)` from the booking table.
- Expired pending filter: `status = 'pending' AND createdAt < now() - interval '<pendingExpirationMinutes> minutes'` should be excluded from conflict set.

## Acceptance criteria

- [ ] `getAvailableSlots` returns correct slots for a date respecting operating hours
- [ ] Slots with no available lanes show `availableLaneCount: 0`
- [ ] Existing confirmed bookings reduce available lane count
- [ ] Expired pending bookings do NOT reduce lane count
- [ ] Non-expired pending bookings DO reduce lane count
- [ ] `findAvailableLane` returns lane with lowest `sortOrder`
- [ ] `findAvailableLane` returns `null` when all lanes booked
- [ ] Cancelled and no-show bookings do not block availability
- [ ] Tests cover: empty schedule, full schedule, partial availability, expired pending, operating hours boundary
- [ ] `biome check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web && bun run test -- --grep "booking-availability"
bun run lint
bun run build
```
