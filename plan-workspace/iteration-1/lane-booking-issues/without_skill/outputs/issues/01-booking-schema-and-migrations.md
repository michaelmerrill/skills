# Issue 1: Booking Schema and Database Migrations

## Summary

Create the `booking` and `bookingEvent` database tables with all fields, enums, indexes, constraints, and composite foreign keys. Register new ID prefixes. This is the foundational issue that all other booking work depends on.

## Context

The rangeops codebase uses Drizzle ORM with PostgreSQL. All schema files live in `apps/web/src/lib/db/schema/`. The design calls for two new tables following the established patterns (composite FKs for tenant isolation, append-only event logs like `subscriptionChangeEvent`).

## Requirements

### New Enums

Create three `pgEnum` values:

- `booking_status`: `pending`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`
- `booker_type`: `member`, `walk_in`, `staff`
- `booking_payment_method`: `entitlement`, `stripe`, `cash`, `free`
- `booking_event_type`: `created`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`, `payment_received`, `refunded`

### `booking` Table

Fields (see design doc "Data Models > booking" for full spec):
- `id` text PK, prefix `bkg`
- `organizationId`, `locationId`, `resourceId`, `resourceTypeId`, `customerId`, `offeringPriceId` -- all with composite FKs scoped to org
- `status` (booking_status enum), `bookerType` (booker_type enum), `paymentMethod` (booking_payment_method enum)
- `startTime`, `endTime` (timestamptz NOT NULL)
- `amountCentsPaid` integer NOT NULL DEFAULT 0
- `currency` text NOT NULL DEFAULT 'USD'
- `confirmationCode` text NOT NULL
- `stripeCheckoutSessionId`, `stripePaymentIntentId`, `entitlementGrantId` (all nullable)
- `createdByUserId` (nullable)
- `notes` text, `metadata` jsonb
- `createdAt`, `updatedAt`

Indexes:
- `(organizationId)` -- tenant filtering
- `(organizationId, locationId, startTime, endTime, status)` -- availability queries
- `(organizationId, resourceId, startTime, endTime)` -- conflict detection
- `(organizationId, customerId)` -- customer history
- `(organizationId, confirmationCode)` UNIQUE -- check-in lookup
- `(stripeCheckoutSessionId)` UNIQUE WHERE NOT NULL -- webhook idempotency

Constraints:
- CHECK `endTime > startTime`
- CHECK `amountCentsPaid >= 0`
- Composite FK on `(id, organizationId)` for tenant-scoped references from `bookingEvent`

### `bookingEvent` Table

Follow the `subscriptionChangeEvent` pattern exactly. Fields:
- `id` text PK, prefix `bke`
- `organizationId`, `bookingId` (composite FK)
- `eventType` (booking_event_type enum)
- `previousStatus`, `newStatus` (booking_status enum; previousStatus nullable)
- `actorId` (nullable)
- `metadata` jsonb
- `createdAt` -- NO `updatedAt` (append-only)

Index: `(organizationId, bookingId, createdAt)`

### ID Prefixes

In `apps/web/src/lib/id.ts`, add to the `prefixes` object:
- `booking: "bkg"`
- `bookingEvent: "bke"`

### Schema Index Export

In `apps/web/src/lib/db/schema/index.ts`, add:
- `export * from "./bookings";`

### Relations

Define Drizzle relations:
- `booking` -> `organization`, `location`, `resource`, `resourceType`, `customer`, `offeringPrice`
- `bookingEvent` -> `organization`, `booking`
- Add `bookings: many(booking)` to existing `resource` and `customer` relations if feasible (or skip to avoid touching other files)

## Files to Create/Modify

- **Create**: `apps/web/src/lib/db/schema/bookings.ts`
- **Modify**: `apps/web/src/lib/db/schema/index.ts` -- add export
- **Modify**: `apps/web/src/lib/id.ts` -- add `booking` and `bookingEvent` prefixes

## Acceptance Criteria

- [ ] `booking` and `bookingEvent` tables defined with all fields matching the design doc
- [ ] All four enums created
- [ ] All indexes and constraints present
- [ ] Composite FKs for tenant isolation on all cross-table references
- [ ] ID prefixes `bkg` and `bke` registered in `id.ts`
- [ ] Schema exported from `index.ts`
- [ ] Drizzle migration generates cleanly (`npx drizzle-kit generate`)
- [ ] No changes to existing tables

## Dependencies

None -- this is the first issue.
