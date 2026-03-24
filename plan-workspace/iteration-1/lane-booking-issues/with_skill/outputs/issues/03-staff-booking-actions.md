# Staff Booking Actions + Dashboard Page

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 3 of 11
> Type: AFK

## Blocked by

- [02-booking-service-core.md](./02-booking-service-core.md) -- needs `createBooking`, state machine, confirmation code generation

## What to build

Create the staff booking flow: a `createStaffBooking` Effect function that wraps `createBooking` with staff-specific logic (owner/admin permission check, payment method selection for `cash`/`free`/`entitlement`/`stripe`, `createdByUserId` tracking). Create server actions for the staff booking form. Create the bookings dashboard page at `[orgSlug]/bookings/` showing today's bookings and a create-booking form. Staff can select customer, location, date/time, resource type, and payment method.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `createStaffBooking(data)` function that calls `createBooking` with `bookerType: 'staff'`, permission check, payment method handling (after the core functions) |
| `apps/web/src/lib/validation.ts` | Add `createStaffBookingSchema` with fields: `orgId`, `locationId`, `resourceTypeId`, `customerId`, `startTime`, `endTime`, `paymentMethod`, `notes` |
| `apps/web/src/lib/permissions.ts` | Add `booking: ["create", "read", "update", "cancel", "check_in", "list"]` to `statements` (line ~6), and corresponding permissions to `owner` (all), `admin` (all), `member` (create, read, cancel) roles |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Server actions: `createBooking`, `listBookings`, `getBookingDetails` | Follow `apps/web/src/app/[orgSlug]/settings/actions.ts` for Effect + CurrentSession + AppLive pattern |
| `apps/web/src/app/[orgSlug]/bookings/page.tsx` | Staff bookings dashboard: list today's bookings, create button | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` for RSC data fetching pattern |

## Context

### Patterns to follow
- `apps/web/src/app/[orgSlug]/settings/actions.ts` (lines 38-65): server action pattern -- parse with Zod, get session, pipe Effect with `CurrentSession` + `AppLive`, match success/failure.
- `apps/web/src/app/[orgSlug]/customers/page.tsx` (lines 1-40): RSC page fetching data via cached queries, passing to client components.
- `apps/web/src/lib/customers.ts` (lines 28-43): `getMemberRole` helper for permission checks.

### Key types
```typescript
// Staff booking input
type CreateStaffBookingData = {
  orgId: string;
  locationId: string;
  resourceTypeId: string;
  customerId: string;
  startTime: Date;
  endTime: Date;
  paymentMethod: "entitlement" | "stripe" | "cash" | "free";
  notes?: string;
};

// createStaffBooking signature
function createStaffBooking(data: CreateStaffBookingData): Effect<
  Booking,
  BookingError | PermissionDenied | DatabaseError
>
```

### Wiring notes
- `createStaffBooking` depends on `DbService` and `CurrentSession` (for permission check and `createdByUserId`).
- For `paymentMethod: 'cash'` or `'free'`, booking status is immediately `confirmed`.
- For `paymentMethod: 'entitlement'`, this issue just sets the field -- actual consumption is in issue #7.
- For `paymentMethod: 'stripe'`, this issue just sets `pending` -- actual Stripe session is in issue #9.
- The `listBookings` query should filter by `organizationId` and optionally by `locationId`, `status`, `date range`.

## Acceptance criteria

- [ ] Staff (owner/admin) can create a booking with `cash` or `free` payment -- status immediately `confirmed`
- [ ] `createdByUserId` populated from session
- [ ] `confirmationCode` generated for every booking
- [ ] `bookingEvent` with `eventType: 'created'` inserted
- [ ] Members rejected from staff booking action (permission check)
- [ ] Bookings list page shows bookings filtered by org
- [ ] Server actions follow existing pattern (Zod parse, Effect pipe, error matching)
- [ ] `booking` resource added to permissions with correct role assignments
- [ ] Unit tests: staff booking creation with cash/free, permission denial for members
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun test` passes

## Verification

```bash
cd apps/web
bunx biome check src/lib/bookings.ts src/lib/permissions.ts src/app/\[orgSlug\]/bookings/
bun run build
bun test
```

## Notes

- The bookings page is minimal for now -- a table of bookings + create form. Full operational dashboard (stats, today's view) is in issue #10.
- Lane assignment is NOT done in this issue -- resource auto-assignment is part of issue #5 (availability engine). Staff booking at this stage requires `resourceTypeId` but the specific lane is assigned by the availability engine.
