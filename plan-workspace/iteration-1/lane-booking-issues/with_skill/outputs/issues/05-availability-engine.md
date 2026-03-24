# Availability Engine + Booking Rules Type

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 5 of 11
> Type: AFK

## Blocked by

- [02-booking-service-core.md](./02-booking-service-core.md) -- needs `booking` table schema for conflict queries

## What to build

Create the slot availability engine: `getAvailableSlots(query)` that computes open time slots for a given location, date, and resource type by cross-referencing operating hours from `bookingRules`, existing bookings (excluding expired pending), and active resources. Create `assignLane(query)` that picks the first available lane by `resource.sortOrder`. Define the `BookingRules` TypeScript type and Zod schema for runtime validation of the `bookingRules` JSONB column. This is the query-only layer -- no mutations.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/validation.ts` | Add `BookingRules` Zod schema and `BookingRulesType` TypeScript type (after line ~362). Schema validates: `slotDurationMinutes`, `maxAdvanceBookingDays`, `cancellationWindowMinutes`, `pendingExpirationMinutes`, `operatingHours` nested structure. |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/booking-availability.ts` | `getAvailableSlots`, `assignLane`, operating hours resolution | Follow `apps/web/src/lib/customers.ts` for Effect query pattern using `DbService` only |
| `apps/web/src/__tests__/bookings/booking-availability.test.ts` | Unit tests for slot computation, conflict detection, operating hours, lane assignment | Follow `apps/web/src/__tests__/settings/entitlement-ledger.test.ts` for test structure |

## Context

### Patterns to follow
- `apps/web/src/lib/customers.ts` (lines 45-122): Effect query using `DbService`, building dynamic `conditions` array, joins, ordering.
- `apps/web/src/lib/db/schema/resources.ts` (lines 61-114): `resource` table with `sortOrder`, `isActive`, `resourceTypeId`, `locationId` fields.
- `apps/web/src/lib/db/schema/organization-settings.ts` (lines 33-36): `bookingRules` JSONB column, currently typed as `Record<string, unknown>`.

### Key types
```typescript
// BookingRules TypeScript type
type BookingRules = {
  slotDurationMinutes: number;
  maxAdvanceBookingDays: number;
  cancellationWindowMinutes: number;
  pendingExpirationMinutes: number;
  operatingHours: Record<string, {
    [dayOfWeek: number]: { open: string; close: string } | null;
  }>;
};

// Query types
type SlotQuery = {
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  date: string; // ISO date
};

type Slot = {
  startTime: Date;
  endTime: Date;
  availableLaneCount: number;
};

// Signatures
function getAvailableSlots(query: SlotQuery): Effect<Slot[], DatabaseError>
function assignLane(query: SlotQuery & { startTime: Date; endTime: Date }): Effect<Resource, NoLanesAvailable | DatabaseError>
```

### Wiring notes
- `getAvailableSlots` depends only on `DbService`. It reads `organizationSetting.bookingRules` for operating hours, then queries `resource` and `booking` tables.
- Availability query: find resources matching `(locationId, resourceTypeId, isActive=true)`, LEFT JOIN `booking` where times overlap and status NOT IN (`cancelled`, `no_show`) and (status != `pending` OR `createdAt + pendingExpirationMinutes > now()`).
- `assignLane`: from available resources for the slot, ORDER BY `resource.sortOrder` LIMIT 1.
- Operating hours keyed by `locationId` then `dayOfWeek` (0=Sunday). Null means closed.

## Acceptance criteria

- [ ] `BookingRules` Zod schema validates the JSONB structure with all 5 top-level fields
- [ ] `getAvailableSlots` returns slots for a date based on operating hours
- [ ] Slots with fully booked lanes are excluded
- [ ] Expired pending bookings (`createdAt + pendingExpirationMinutes < now()`) do NOT block slots
- [ ] `assignLane` returns the resource with lowest `sortOrder` that has no conflicting booking
- [ ] `assignLane` returns `NoLanesAvailable` error when all lanes are booked
- [ ] Past time slots are excluded (no slots before current time)
- [ ] Respects `maxAdvanceBookingDays` limit
- [ ] Unit tests cover: basic slot generation, conflict exclusion, expired pending, lane assignment order, closed day handling
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun test` passes

## Verification

```bash
cd apps/web
bunx biome check src/lib/booking-availability.ts src/lib/validation.ts
bun run build
bun test src/__tests__/bookings/booking-availability.test.ts
```

## Notes

- This is the core query engine that both member and walk-in flows depend on. Keep it pure (no mutations, no side effects beyond DB reads).
- The race condition for simultaneous last-lane booking is handled at the `createBooking` layer via `SELECT FOR UPDATE` -- not in this availability query.
- `operatingHours` may be empty/undefined for a location -- treat as "no hours configured, no slots available."
