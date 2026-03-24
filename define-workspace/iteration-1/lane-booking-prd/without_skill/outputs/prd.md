# Product Requirements Document: Online Lane Reservations

## Overview

Add an online lane reservation system to RangeOps so that members and walk-in customers can book shooting lanes for specific time slots. The system serves two interfaces: a public-facing booking page per location and a staff-side booking management dashboard.

## Problem Statement

Range operators currently manage lane assignments manually (paper, whiteboard, or verbal). This leads to double-bookings, no-shows without consequence, no advance visibility into demand, and no way for customers to self-service. Online reservations reduce front-desk friction, capture revenue upfront, and give operators data on lane utilization.

## Users & Personas

| Persona | Description | Key needs |
|---|---|---|
| **Premium Member** | Has an active membership with lane-time entitlements (free hours/month). Authenticated user. | Book online, consume entitlements automatically, lenient cancellation. |
| **Standard Member** | Has an active membership with discount benefits. Authenticated user. | Book online at discounted rate. |
| **Walk-in / Guest** | No account or membership. May or may not register. | Book online as guest (name/email/phone) or walk in and have staff book for them. |
| **Range Staff** | Operator employee using the dashboard. | See all reservations, create/cancel bookings for any customer type, check customers in, manage schedule. |
| **Range Operator (Admin)** | Business owner configuring the system. | Set up lane types, operating hours, pricing, cancellation policies, booking rules. |

## Existing System Context

The following already exist in the RangeOps codebase and should be leveraged:

- **Locations** (`location` table) -- multi-location support with timezone, address, active flag.
- **Resource Types** (`resource_type` table) -- org-defined categories (e.g., "Pistol Bay", "Rifle Lane", "Trap Field"). Has `bookingUnit` field.
- **Resources** (`resource` table) -- individual bookable assets tied to a location and resource type. Has `capacity` (max shooters), `sortOrder`, `isActive`, parent-child hierarchy.
- **Customers** (`customer` table) -- with status, contact info, user account linkage.
- **Offerings & Pricing** (`offering`, `offering_price` tables) -- product catalog with per-location availability, multiple price variants.
- **Subscriptions** (`subscription` table) -- active membership relationships.
- **Entitlements** (`entitlement_grant`, `entitlement_ledger`, `entitlement_balance` tables) -- grant/consume/balance system for tracking benefits like free lane hours.
- **Organization Settings** (`organization_setting` table) -- has `bookingRules` JSONB field (currently empty/unused).
- **Stripe Connect** (`organization_payment_account` table) -- payment processing per tenant.
- **Email package** (`packages/email`) -- transactional email infrastructure.
- **Multi-tenant routing** -- subdomain-based (`{slug}.getrangeops.dev`).

## Functional Requirements

### FR-1: Schedule & Availability Configuration

**FR-1.1** Operators configure operating hours per location per day-of-week (e.g., Mon-Fri 9am-8pm, Sat-Sun 8am-10pm).

**FR-1.2** Operators set slot duration per resource type per location (e.g., pistol bays = 30 min, rifle lanes = 60 min).

**FR-1.3** Operators can override availability per resource type per day-of-week (e.g., rifle range closed Mondays).

**FR-1.4** Operators can create blackout periods that block bookings for an entire location, a specific resource type, or individual resources, for a date range with optional time range and recurrence.

**FR-1.5** The system computes available time slots by intersecting: operating hours, resource type schedule, blackout periods, and existing reservations.

### FR-2: Public Booking Flow (Customer-Facing)

**FR-2.1** Each location has a public booking page accessible via the tenant subdomain (e.g., `{slug}.getrangeops.dev/book/{locationSlug}`).

**FR-2.2** The booking flow:
1. Customer selects a date.
2. System displays available lane types and time slots.
3. Customer selects lane type, time slot, and number of shooters.
4. System validates party size against resource capacity.
5. System assigns a specific lane (or lets customer pick if multiple are available).
6. Customer provides identification: login (members), or guest info (name, email, phone).
7. System calculates price based on customer type (premium member entitlement, standard member discount, walk-in full price).
8. Customer pays via Stripe Checkout (for online bookings with a charge).
9. Reservation is confirmed; confirmation email sent.

**FR-2.3** Authenticated members are identified by their login session. The system looks up their active subscription and entitlement balance.

**FR-2.4** For premium members with available entitlement balance, the system consumes entitlement units (via `entitlement_ledger`) and charges $0 (or the remainder if partial).

**FR-2.5** For standard members, the system applies the configured discount percentage to the base lane rate.

**FR-2.6** Guest customers provide name, email, and phone. A `customer` record is created (or matched by email) with status `lead`.

### FR-3: Staff Booking Flow (Dashboard)

**FR-3.1** Staff can create a reservation for any customer from the operator dashboard.

**FR-3.2** Staff can search/select an existing customer or create a new one inline.

**FR-3.3** Staff can book with flexible payment: charge now (Stripe), pay-at-arrival, or comp/free.

**FR-3.4** Staff can override the minimum advance booking time (e.g., book a lane for 10 minutes from now).

**FR-3.5** Staff can book on behalf of walk-in customers who are physically present.

### FR-4: Reservation Management

**FR-4.1** A reservation record captures: customer, resource (lane), location, date, start time, end time, party size, status, payment status, price paid, entitlement units consumed, booking source (online/staff), cancellation policy snapshot.

**FR-4.2** Reservation statuses: `pending_payment`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`.

**FR-4.3** Customers can cancel their own reservation from a link in the confirmation email (or from a "my bookings" page if logged in).

**FR-4.4** Staff can cancel any reservation from the dashboard.

**FR-4.5** Cancellation policy is enforced automatically:
- Configurable per location.
- Parameters: free cancellation cutoff (hours before start), late cancellation fee (percentage).
- Members may have a different (more lenient) policy than guests.
- Refunds processed via Stripe; entitlement units reversed if applicable.

**FR-4.6** Staff can mark a reservation as `checked_in` from the dashboard.

**FR-4.7** Reservations that are not checked in within a configurable grace period after start time are auto-marked `no_show`.

### FR-5: Pricing

**FR-5.1** Base lane rate is configured per resource type per location, using the existing `offering` + `offering_price` tables. A new offering type `lane_booking` is added to `offeringTypeEnum`.

**FR-5.2** Pricing tiers:
- Walk-in: full `offering_price.amountCents`.
- Standard member: `offering_price.amountCents` minus configured discount percentage.
- Premium member: entitlement consumption first, then charge for any remainder.

**FR-5.3** Price is locked at booking time (snapshot in the reservation record).

### FR-6: Booking Rules

**FR-6.1** Configurable per location (stored in `organization_setting.bookingRules` or a new `location_booking_config` table):
- Maximum advance booking window (default: 30 days).
- Minimum advance booking time for online bookings (default: 1 hour).
- Maximum concurrent reservations per customer (to prevent hoarding).
- Slot duration per resource type.

**FR-6.2** Staff can override minimum advance time and concurrent reservation limits.

### FR-7: Operator Dashboard Views

**FR-7.1** **Timeline View**: A grid with lanes (resources) as rows and time slots as columns for a selected date and location. Shows booked slots (with customer name, party size) and open slots. Staff can click an open slot to initiate a booking.

**FR-7.2** **List View**: A filterable, searchable table of reservations. Filters: date range, location, resource type, status, customer name/email. Sortable by date/time. Actions: check-in, cancel, view details.

**FR-7.3** Dashboard is accessible from the existing operator sidebar navigation (new "Reservations" nav item).

### FR-8: Notifications

**FR-8.1** **Booking Confirmation**: email sent immediately upon confirmed reservation. Includes: date, time, location address, lane type, party size, price paid, cancellation link.

**FR-8.2** **Reminder**: email sent 24 hours before the reservation start time. Includes same details plus check-in instructions.

**FR-8.3** **Cancellation Confirmation**: email sent when a reservation is cancelled. Includes refund amount if applicable.

**FR-8.4** All emails use the existing `packages/email` infrastructure.

## Non-Functional Requirements

**NFR-1: Multi-tenancy** -- All reservation data is tenant-scoped via `organizationId`. Foreign keys follow the existing composite key pattern (`[id, organizationId]`).

**NFR-2: Concurrency** -- The system must prevent double-booking. When a slot is selected, it must be atomically validated and reserved (optimistic locking or database constraint). A slot hold/expiry mechanism (e.g., 10-minute hold during checkout) is acceptable.

**NFR-3: Performance** -- Availability computation (open slots for a day) must respond in under 500ms for typical usage (up to 50 resources per location).

**NFR-4: Timezone correctness** -- All times are stored in UTC. Display uses the location's configured timezone (`location.timezone`). Slot boundaries are computed in the location's timezone.

**NFR-5: Mobile responsive** -- The public booking page must be fully usable on mobile browsers.

**NFR-6: Accessibility** -- Public booking page meets WCAG 2.1 AA.

## Data Model (New Tables)

### `reservation`
| Column | Type | Notes |
|---|---|---|
| id | text PK | `createId("reservation")` |
| organizationId | text FK | |
| locationId | text FK | composite FK to location |
| resourceId | text FK | composite FK to resource (the specific lane) |
| resourceTypeId | text FK | denormalized for query convenience |
| customerId | text FK | composite FK to customer |
| date | date | reservation date |
| startTime | timestamp w/tz | slot start |
| endTime | timestamp w/tz | slot end |
| partySize | integer | number of shooters |
| status | enum | `pending_payment`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show` |
| paymentStatus | enum | `unpaid`, `paid`, `refunded`, `partial_refund` |
| amountCents | integer | price charged (snapshot) |
| currency | text | default USD |
| discountApplied | jsonb | details of discount/entitlement applied |
| entitlementGrantId | text FK | if entitlement was consumed |
| entitlementUnitsConsumed | integer | units consumed |
| stripePaymentIntentId | text | Stripe reference |
| source | text | `online`, `staff` |
| cancellationPolicySnapshot | jsonb | policy at time of booking |
| cancelledAt | timestamp w/tz | |
| cancelledBy | text | userId or "customer" |
| checkedInAt | timestamp w/tz | |
| checkedInBy | text | staff userId |
| notes | text | |
| metadata | jsonb | |
| createdAt | timestamp w/tz | |
| updatedAt | timestamp w/tz | |

### `location_schedule`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| organizationId | text FK | |
| locationId | text FK | |
| dayOfWeek | integer | 0=Sunday..6=Saturday |
| openTime | time | e.g., 09:00 |
| closeTime | time | e.g., 20:00 |
| isOpen | boolean | |

### `resource_type_schedule_override`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| organizationId | text FK | |
| locationId | text FK | |
| resourceTypeId | text FK | |
| dayOfWeek | integer | |
| isAvailable | boolean | false = closed that day |
| openTime | time | optional override |
| closeTime | time | optional override |

### `schedule_blackout`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| organizationId | text FK | |
| locationId | text FK | |
| resourceTypeId | text FK | nullable (null = whole location) |
| resourceId | text FK | nullable (null = whole type/location) |
| startDate | date | |
| endDate | date | |
| startTime | time | nullable (null = all day) |
| endTime | time | nullable |
| reason | text | |
| createdBy | text FK | |

### `location_booking_config`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| organizationId | text FK | |
| locationId | text FK | |
| resourceTypeId | text FK | nullable (null = location default) |
| slotDurationMinutes | integer | default 60 |
| maxAdvanceDays | integer | default 30 |
| minAdvanceMinutes | integer | default 60 |
| maxConcurrentPerCustomer | integer | default 3 |
| cancellationFreeCutoffHours | integer | default 24 |
| cancellationFeePercent | integer | 0-100, default 100 |
| memberCancellationFreeCutoffHours | integer | nullable, overrides above for members |
| memberDiscountPercent | integer | standard member discount, default 0 |
| noShowGraceMinutes | integer | default 15 |

## Out of Scope (v1)

- QR code / kiosk self-check-in
- Recurring / standing reservations
- Waitlist when lanes are fully booked
- Multi-lane booking in a single reservation (book multiple lanes at once)
- Dynamic pricing / peak hour surcharges
- Instructor or RSO assignment to reservations
- Equipment rental bundled with lane booking
- Calendar sync (iCal/Google Calendar)
- SMS notifications (email only for v1)
- Public API for third-party booking integrations

## Success Metrics

- **Adoption**: >50% of reservations made online (vs. staff-created) within 3 months of launch.
- **No-show rate**: <10% (baseline to be established pre-launch).
- **Revenue capture**: 100% of online bookings prepaid, reducing revenue leakage from no-shows.
- **Staff time saved**: reduce average front-desk booking time from ~3 min (phone) to <30s (confirming online booking).
- **Customer satisfaction**: booking flow completion rate >80%.

## Open Questions

1. Should the public booking page be a separate Next.js route within the existing app, or a standalone embeddable widget (iframe)?
2. For the slot hold during checkout -- what's the acceptable hold duration? (Proposed: 10 minutes.)
3. Should walk-in guest customers be prompted to create an account after booking, or stay purely guest?
4. How should the system handle overlapping entitlement grants (e.g., customer has two active grants)? FIFO by expiry date?
5. Is there a need for lane preferences (e.g., customer prefers Lane 3) vs. auto-assignment?
