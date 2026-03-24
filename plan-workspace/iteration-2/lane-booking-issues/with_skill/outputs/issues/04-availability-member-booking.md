# Slot Availability + Member Self-Service Booking

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 4 of 7
> Type: AFK

## Blocked by

- [02-booking-service-staff.md](./02-booking-service-staff.md) -- needs core booking service, `generateConfirmationCode`, lane assignment logic

## What to build

Implement `getAvailableSlots` query that computes open time slots for a given date, location, and resource type by cross-referencing operating hours from `bookingRules`, existing bookings (filtering out expired pending), and active resources. Implement `createMemberBooking` that lets authenticated members book a lane: check entitlement balance first, consume if sufficient, fall back to Stripe Checkout on the org's Connect account if insufficient. Create server action for member booking. Add member-facing booking page at `[orgSlug]/bookings/new` with date/resource-type picker and slot grid. Write unit tests for availability computation, auto-assignment, and entitlement integration.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/booking-availability.ts` | `getAvailableSlots(query)` -- pure DB query, no side effects | Follow `apps/web/src/lib/customers.ts` lines 45-122 (Effect query with conditions, DbService dependency) |
| `apps/web/src/app/[orgSlug]/bookings/new/page.tsx` | Member booking page: date picker, resource type selector, slot grid | Follow `apps/web/src/app/[orgSlug]/settings/locations/new/page.tsx` (form page pattern) |
| `apps/web/src/__tests__/bookings/booking-availability.test.ts` | Tests: slot computation, conflict detection, operating hours, expired pending filtering | Follow `apps/web/src/__tests__/settings/entitlement-ledger.test.ts` (TestDbLayer + seed data pattern) |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `createMemberBooking` function after `createStaffBooking`. Entitlement check -> consume or Stripe Checkout fallback. |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Add `createMemberBooking` server action (member role allowed, not just owner/admin) |
| `apps/web/src/lib/validation.ts` | Add `createMemberBookingSchema`, `getAvailableSlotsSchema`, `bookingRulesSchema` Zod schemas |

## Context

### Patterns to follow

- `apps/web/src/lib/customers.ts` lines 45-122: `listCustomers` Effect function with dynamic conditions, joins, pagination. Follow for `getAvailableSlots` query structure.
- `apps/web/src/lib/entitlements.ts` lines 94-175: `consumeEntitlement` with grant lookup, balance check, atomic transaction. The member booking must call this when entitlement covers the booking.
- `apps/web/src/lib/entitlements.ts` lines 177-202: `getEntitlementBalance` to check balance before attempting consumption.
- `apps/web/src/lib/stripe.ts` lines 70-79: `withConnectedAccount` helper to get the org's Stripe Connect account ID. Use for Stripe Checkout session creation.
- `apps/web/src/lib/stripe.ts` lines 85-142: `createSaasCheckoutSession` for Checkout session creation pattern. Adapt for booking payment (one-time payment, not subscription).

### Key types

```typescript
// Availability query
type SlotQuery = {
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  date: string; // ISO date "2026-03-25"
};

type Slot = {
  startTime: Date;
  endTime: Date;
  availableLaneCount: number;
};

// From existing codebase
import { getEntitlementBalance, consumeEntitlement } from "@/lib/entitlements";
// entitlements.ts line 177: getEntitlementBalance(orgId, customerId, entitlementType)
// entitlements.ts line 94: consumeEntitlement(data: ConsumeEntitlementData)

// organizationSetting.bookingRules shape (organization-settings.ts line 33)
// Already JSONB, typed as Record<string, unknown> -- validate with bookingRulesSchema at runtime

// resource table (resources.ts lines 61-114)
// Fields: id, organizationId, locationId, resourceTypeId, sortOrder, isActive
// Index: resource_organization_id_is_active_idx (line 94)
```

### Wiring notes

- Availability query: for each slot in operating hours, count resources of the requested type at the location that have no conflicting confirmed/checked_in/pending booking. Filter out `pending` bookings older than `pendingExpirationMinutes`.
- SQL approach: generate time slots from operating hours config, then for each slot LEFT JOIN bookings on `(resourceId, overlapping time range, non-cancelled status)`, count unbooked resources.
- Lane auto-assignment: `ORDER BY resource.sortOrder ASC LIMIT 1` where no conflict exists -- reuses the `sortOrder` field (resources.ts line 75).
- Stripe Checkout for member: create session with `mode: 'payment'` (one-time, not subscription), on the org's Connect account. Include `bookingId` in `session.metadata`. Success/cancel URLs point to `[orgSlug]/bookings/[bookingId]`.
- The member booking action needs `CurrentSession` to identify the member's `customer` record via `customer.userId` (customers.ts line 48).

## Acceptance criteria

- [ ] `getAvailableSlots` returns correct slots based on operating hours config
- [ ] Slots with all lanes booked return `availableLaneCount: 0`
- [ ] Expired pending bookings (older than `pendingExpirationMinutes`) do not block slots
- [ ] Active non-expired bookings correctly block their lane for their time window
- [ ] Member can view available slots for a date + resource type
- [ ] Lane auto-assigned by `sortOrder` (lowest first)
- [ ] Member booking with sufficient entitlement: entitlement consumed, status `confirmed`
- [ ] Member booking without entitlement: Stripe Checkout session created, status `pending`, redirect URL returned
- [ ] If org has no Stripe Connect account, error returned for payment-required bookings
- [ ] Unit tests pass for availability computation, auto-assignment, entitlement path
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test
```

### Manual verification

```bash
# Seed test data: org with bookingRules, location, resourceType, resources, customer with entitlement
# Call getAvailableSlots and verify slot list
# Create member booking with entitlement -- verify balance decreased
# Create member booking without entitlement -- verify Stripe Checkout URL returned
```

## Notes

- The `bookingRules.operatingHours` is keyed by `locationId`. If a location has no entry, treat as "no slots available" (closed).
- Time slot generation: iterate from `open` to `close` in `slotDurationMinutes` increments. Each slot is `[start, start + duration)`.
- Conflict detection query: `booking.startTime < slotEnd AND booking.endTime > slotStart AND booking.status IN ('pending', 'confirmed', 'checked_in') AND (booking.status != 'pending' OR booking.createdAt > now() - pendingExpirationMinutes)`.
