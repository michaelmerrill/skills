# Lane Booking Feature -- Technical Design

## 1. Overview

Add lane booking to RangeOps: fixed time slots, per-resource-type duration, Stripe Checkout for walk-in payments, entitlement consumption for members, staff-facing UI with data model ready for public booking.

## 2. Data Model

### 2.1 New Tables

#### `booking_slot_config` -- defines how slots are generated per resource type at a location

```typescript
export const bookingSlotConfig = pgTable(
  "booking_slot_config",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("bookingSlotConfig")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    locationId: text("location_id").notNull(),
    resourceTypeId: text("resource_type_id").notNull(),
    slotDurationMinutes: integer("slot_duration_minutes").notNull().default(60),
    walkInPriceCents: integer("walk_in_price_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    entitlementType: text("entitlement_type"), // links to entitlement system, e.g. "lane_hour"
    entitlementUnitsPerSlot: integer("entitlement_units_per_slot").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique("booking_slot_config_loc_rt_uidx").on(t.locationId, t.resourceTypeId),
    foreignKey({
      name: "booking_slot_config_location_id_organization_id_fk",
      columns: [t.locationId, t.organizationId],
      foreignColumns: [location.id, location.organizationId],
    }),
    foreignKey({
      name: "booking_slot_config_resource_type_id_organization_id_fk",
      columns: [t.resourceTypeId, t.organizationId],
      foreignColumns: [resourceType.id, resourceType.organizationId],
    }),
  ],
);
```

#### `operating_hours` -- weekly schedule per location

```typescript
export const operatingHours = pgTable(
  "operating_hours",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("operatingHours")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    locationId: text("location_id").notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
    openTime: text("open_time").notNull(), // "09:00" in location timezone
    closeTime: text("close_time").notNull(), // "21:00"
    isClosed: boolean("is_closed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique("operating_hours_loc_dow_uidx").on(t.locationId, t.dayOfWeek),
    check("operating_hours_dow_check", sql`${t.dayOfWeek} >= 0 AND ${t.dayOfWeek} <= 6`),
    foreignKey({
      name: "operating_hours_location_id_organization_id_fk",
      columns: [t.locationId, t.organizationId],
      foreignColumns: [location.id, location.organizationId],
    }),
  ],
);
```

#### `resource_blackout` -- per-lane maintenance/unavailability windows

```typescript
export const resourceBlackout = pgTable(
  "resource_blackout",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("resourceBlackout")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    resourceId: text("resource_id").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("resource_blackout_resource_id_idx").on(t.resourceId),
    index("resource_blackout_starts_at_ends_at_idx").on(t.startsAt, t.endsAt),
    check("resource_blackout_time_check", sql`${t.endsAt} > ${t.startsAt}`),
    foreignKey({
      name: "resource_blackout_resource_id_organization_id_fk",
      columns: [t.resourceId, t.organizationId],
      foreignColumns: [resource.id, resource.organizationId],
    }),
  ],
);
```

#### `booking` -- the core booking record

```typescript
export const bookingStatusEnum = pgEnum("booking_status", [
  "held",
  "confirmed",
  "checked_in",
  "cancelled",
  "completed",
  "no_show",
]);

export const bookingPaymentMethodEnum = pgEnum("booking_payment_method", [
  "entitlement",
  "stripe",
  "cash",
  "comp",
]);

export const booking = pgTable(
  "booking",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("booking")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    locationId: text("location_id").notNull(),
    resourceId: text("resource_id").notNull(),
    customerId: text("customer_id"), // null for anonymous walk-ins
    bookedByUserId: text("booked_by_user_id"), // staff member who created booking

    status: bookingStatusEnum("status").notNull().default("held"),

    // Time slot
    slotStart: timestamp("slot_start", { withTimezone: true }).notNull(),
    slotEnd: timestamp("slot_end", { withTimezone: true }).notNull(),

    // Payment
    paymentMethod: bookingPaymentMethodEnum("payment_method").notNull(),
    priceCents: integer("price_cents"), // null for entitlement bookings
    currency: text("currency").default("USD"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),

    // Entitlement tracking
    entitlementGrantId: text("entitlement_grant_id"),
    entitlementUnitsConsumed: integer("entitlement_units_consumed"),

    // Walk-in guest info (when no customer record)
    guestName: text("guest_name"),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),

    // Lifecycle
    heldUntil: timestamp("held_until", { withTimezone: true }), // TTL for held status
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),

    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique("booking_id_organization_id_uidx").on(t.id, t.organizationId),

    // Prevent double-booking: one active booking per resource per slot
    // Partial unique index: only for non-cancelled, non-no_show statuses
    // (Implemented as an application-level check + advisory lock since
    //  partial unique indexes on enums require raw SQL migration)

    index("booking_organization_id_idx").on(t.organizationId),
    index("booking_location_id_idx").on(t.locationId),
    index("booking_resource_id_idx").on(t.resourceId),
    index("booking_customer_id_idx").on(t.customerId),
    index("booking_status_idx").on(t.organizationId, t.status),
    index("booking_slot_start_idx").on(t.resourceId, t.slotStart),
    index("booking_stripe_checkout_session_id_idx").on(t.stripeCheckoutSessionId),

    check("booking_slot_check", sql`${t.slotEnd} > ${t.slotStart}`),
    check("booking_price_check", sql`${t.priceCents} IS NULL OR ${t.priceCents} >= 0`),

    foreignKey({
      name: "booking_location_id_organization_id_fk",
      columns: [t.locationId, t.organizationId],
      foreignColumns: [location.id, location.organizationId],
    }),
    foreignKey({
      name: "booking_resource_id_organization_id_fk",
      columns: [t.resourceId, t.organizationId],
      foreignColumns: [resource.id, resource.organizationId],
    }),
    foreignKey({
      name: "booking_customer_id_organization_id_fk",
      columns: [t.customerId, t.organizationId],
      foreignColumns: [customer.id, customer.organizationId],
    }),
  ],
);
```

### 2.2 Schema Changes to Existing Tables

#### `organization_setting.booking_rules` JSONB structure

```typescript
type BookingRules = {
  advanceBookingDays: number;       // default: 7
  cancellationCutoffHours: number;  // default: 24
  holdTtlMinutes: number;           // default: 15
  maxBookingsPerCustomerPerDay: number; // default: 3
};
```

This field already exists as a JSONB column. No migration needed -- just define the shape.

#### `id.ts` -- add new prefixes

```typescript
// Add to prefixes:
bookingSlotConfig: "bsc",
operatingHours: "oph",
resourceBlackout: "rbl",
booking: "bkg",
```

### 2.3 Entity Relationship Summary

```
organization
  └── location
        ├── operating_hours (7 rows per location, one per day)
        ├── booking_slot_config (one per location + resource_type combo)
        └── resource
              ├── resource_blackout (0..n maintenance windows)
              └── booking (0..n bookings across time slots)
                    └── customer (optional, null for anonymous walk-ins)
```

## 3. Slot Generation (Derived, Not Stored)

Slots are **computed at query time**, not stored as rows. This avoids a massive table of pre-generated slots and allows schedule changes to take effect immediately.

### Algorithm

```
function getAvailableSlots(locationId, resourceTypeId, date):
  1. Load operating_hours for location + dayOfWeek(date)
  2. If isClosed, return []
  3. Load booking_slot_config for location + resourceTypeId -> slotDurationMinutes
  4. Generate time windows from openTime to closeTime in slotDurationMinutes increments
  5. Load all resources of resourceTypeId at location where isActive=true
  6. For each resource:
     a. Load existing bookings for date where status NOT IN ('cancelled', 'no_show')
     b. Load resource_blackouts overlapping with date
     c. Remove slots that overlap with bookings or blackouts
  7. Return: { slotStart, slotEnd, availableResources: Resource[] }[]
```

The function returns slots with a list of available resources per slot, so the UI can show "3 pistol lanes available at 2:00 PM".

### Performance

- Query is bounded: one day, one location, one resource type
- Indexes on `booking(resource_id, slot_start)` and `resource_blackout(resource_id, starts_at, ends_at)` make overlap checks fast
- Cache the computed slots for ~30 seconds on high-traffic public pages (future)

## 4. Booking Flows

### 4.1 Member Booking (Entitlement)

```
Staff/Member selects: location, lane type, date, slot, resource (or auto-assign)
  │
  ├─ Validate entitlement balance >= entitlement_units_per_slot
  ├─ Check slot availability (no conflict)
  │
  ├─ BEGIN TRANSACTION
  │    ├─ Insert booking (status: confirmed, paymentMethod: entitlement)
  │    ├─ consumeEntitlement() -- existing lib function
  │    │    ├─ Debit entitlement_balance
  │    │    └─ Append entitlement_ledger entry
  │    └─ COMMIT
  │
  └─ Return confirmed booking
```

No `held` state needed -- entitlement consumption is synchronous within the transaction.

### 4.2 Walk-In Booking (Stripe)

```
Staff enters: guest info (or selects existing customer), lane type, date, slot
  │
  ├─ Check slot availability
  │
  ├─ Insert booking (status: held, heldUntil: now + holdTtlMinutes)
  │
  ├─ Create Stripe Checkout Session on connected account
  │    ├─ line_items: [{ price_data: { unit_amount: priceCents, currency }, quantity: 1 }]
  │    ├─ metadata: { bookingId, orgId }
  │    ├─ success_url / cancel_url
  │    └─ stripe_account: connectedAccountId
  │
  ├─ Return checkout URL -> redirect customer/show to staff
  │
  ├─ ON WEBHOOK: checkout.session.completed
  │    ├─ Look up booking by stripeCheckoutSessionId
  │    ├─ Update booking: status -> confirmed, confirmedAt, stripePaymentIntentId
  │    └─ (Optional) Send confirmation email
  │
  ├─ ON WEBHOOK: checkout.session.expired
  │    └─ Update booking: status -> cancelled, cancellationReason: "payment_timeout"
  │
  └─ CRON/CLEANUP: release held bookings past heldUntil
       └─ UPDATE booking SET status = 'cancelled' WHERE status = 'held' AND heldUntil < NOW()
```

### 4.3 Cash / Comp Booking (Staff-Only)

```
Staff selects: customer (optional), lane type, date, slot
  │
  ├─ Check slot availability
  ├─ Insert booking (status: confirmed, paymentMethod: cash|comp)
  └─ Return confirmed booking
```

### 4.4 Check-In

```
Staff at front desk:
  │
  ├─ Load today's confirmed bookings for location
  ├─ Select booking -> Mark as checked_in
  └─ UPDATE booking SET status = 'checked_in', checkedInAt = NOW()
```

### 4.5 Cancellation

```
Staff or customer requests cancellation:
  │
  ├─ Load booking, verify status IN ('confirmed', 'held')
  ├─ Check cancellation window: slotStart - NOW() >= cancellationCutoffHours
  │
  ├─ IF paymentMethod = 'stripe' AND within window:
  │    ├─ Create Stripe refund on connected account
  │    ├─ Update booking: status -> cancelled, refundedAt
  │    └─ (Refund failure: log, do not block cancellation, flag for manual review)
  │
  ├─ IF paymentMethod = 'entitlement':
  │    ├─ reverseConsumption() -- existing lib function
  │    └─ Update booking: status -> cancelled
  │
  ├─ IF outside window:
  │    └─ Update booking: status -> cancelled, cancellationReason includes "no refund"
  │
  └─ Return cancelled booking
```

### 4.6 Completion / No-Show (Background Job)

```
CRON runs every 15 minutes:
  │
  ├─ Find bookings where status = 'confirmed' AND slotEnd < NOW()
  │    └─ Update to 'no_show'
  │
  ├─ Find bookings where status = 'checked_in' AND slotEnd < NOW()
  │    └─ Update to 'completed'
```

## 5. Double-Booking Prevention

The critical invariant: **no two active bookings for the same resource with overlapping time**.

### Strategy: Application-Level Check + Row Lock

```sql
-- In the booking creation transaction:
SELECT id FROM booking
WHERE resource_id = $1
  AND status NOT IN ('cancelled', 'no_show')
  AND slot_start < $3  -- proposed slotEnd
  AND slot_end > $2    -- proposed slotStart
FOR UPDATE;           -- lock conflicting rows

-- If any rows returned, reject with ConflictError
-- Otherwise, INSERT the new booking
```

The `FOR UPDATE` lock prevents TOCTOU races between concurrent booking attempts for the same lane.

### Index Support

The existing `booking_slot_start_idx` on `(resource_id, slot_start)` efficiently supports this range overlap query.

## 6. API Layer

### New Server Actions (Next.js)

Located at `src/app/[orgSlug]/bookings/actions.ts`:

| Action | Input | Output |
|--------|-------|--------|
| `getAvailableSlots` | locationId, resourceTypeId, date | Slot[] with available resource counts |
| `createBooking` | resourceId, slotStart, slotEnd, paymentMethod, customerId?, guestInfo? | Booking + checkoutUrl? |
| `cancelBooking` | bookingId | Booking (cancelled) |
| `checkInBooking` | bookingId | Booking (checked_in) |
| `listBookings` | locationId, date?, status?, customerId? | Booking[] |
| `getBooking` | bookingId | Booking with resource + customer |

### New Webhook Handler

Located at `src/app/api/webhooks/stripe/route.ts` (extend existing):

- `checkout.session.completed` -- confirm booking
- `checkout.session.expired` -- cancel held booking

### New Zod Schemas

Located in `src/lib/validation.ts` (extend existing):

```typescript
export const createBookingSchema = z.object({
  orgId: z.string().min(1),
  locationId: z.string().min(1),
  resourceId: z.string().min(1),
  slotStart: z.date(),
  slotEnd: z.date(),
  paymentMethod: z.enum(["entitlement", "stripe", "cash", "comp"]),
  customerId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  orgId: z.string().min(1),
  bookingId: z.string().min(1),
  reason: z.string().optional(),
});

export const getAvailableSlotsSchema = z.object({
  orgId: z.string().min(1),
  locationId: z.string().min(1),
  resourceTypeId: z.string().min(1),
  date: z.date(),
});
```

## 7. Service Layer

New file: `src/lib/bookings.ts`

Following the existing Effect pattern (see `entitlements.ts`, `stripe.ts`):

```typescript
// Core booking functions using Effect.gen + DbService + StripeService
export const getAvailableSlots = (data: GetAvailableSlotsData) => Effect.gen(function* () { ... });
export const createBooking = (data: CreateBookingData) => Effect.gen(function* () { ... });
export const cancelBooking = (data: CancelBookingData) => Effect.gen(function* () { ... });
export const checkInBooking = (orgId: string, bookingId: string) => Effect.gen(function* () { ... });
export const completeExpiredBookings = (orgId: string) => Effect.gen(function* () { ... });
export const releaseExpiredHolds = () => Effect.gen(function* () { ... });
```

### New Error Types

Add to `src/lib/errors.ts`:

```typescript
export class BookingNotFound extends Data.TaggedError("BookingNotFound")<{ readonly bookingId: string }> {}
export class BookingConflict extends Data.TaggedError("BookingConflict")<{ readonly resourceId: string; readonly slotStart: Date }> {}
export class BookingSlotUnavailable extends Data.TaggedError("BookingSlotUnavailable") {}
export class BookingCancellationWindowClosed extends Data.TaggedError("BookingCancellationWindowClosed")<{ readonly cutoffHours: number }> {}
export class InvalidBookingTransition extends Data.TaggedError("InvalidBookingTransition")<{ readonly from: string; readonly to: string }> {}
```

## 8. UI Routes

```
[orgSlug]/bookings/              -- booking list/calendar view
[orgSlug]/bookings/new           -- create booking form
[orgSlug]/bookings/[bookingId]   -- booking detail + actions (check-in, cancel)
```

## 9. Configuration UI

Extend existing settings pages:

```
[orgSlug]/settings/locations/[locationId]/hours    -- operating hours editor
[orgSlug]/settings/locations/[locationId]/booking  -- slot config per lane type, pricing
```

Booking rules (advance window, cancellation cutoff) go in the existing org settings page, stored in `organization_setting.booking_rules`.

## 10. Migration Plan

### Phase 1: Schema + Core Logic
1. Add new ID prefixes to `id.ts`
2. Create Drizzle schema files: `bookings.ts`, `operating-hours.ts`, `resource-blackouts.ts`, `booking-slot-config.ts` (or combine into `bookings.ts`)
3. Generate and run migration
4. Implement `src/lib/bookings.ts` service functions
5. Add validation schemas
6. Add error types

### Phase 2: Staff Booking UI
1. Build booking creation flow (slot picker, customer/guest selector, payment method)
2. Build booking list view (filterable by date, status, lane type)
3. Build check-in view (today's bookings at location)
4. Extend Stripe webhook for checkout.session.completed/expired

### Phase 3: Settings + Ops
1. Operating hours editor
2. Slot config + pricing editor
3. Resource blackout management
4. Cancellation flow with refund
5. Background job for hold expiry + booking completion

### Phase 4: Public Booking (Future)
1. Public-facing slot availability endpoint (no auth)
2. Embeddable booking widget
3. Customer self-service cancel/reschedule
