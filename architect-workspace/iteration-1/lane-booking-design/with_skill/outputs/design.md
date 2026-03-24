# Design: Lane Booking

> Technical design for lane booking feature (no PRD -- requirements from verbal discussion).
> Generated from architect interview on 2026-03-24

## Decisions Log

1. **Architecture**: Extend existing `apps/web` modules following established patterns (Effect services, server actions, RSC pages). *Rationale: early-stage codebase, no need for separate package*
2. **Public vs authenticated routes**: Public booking at `[orgSlug]/(public)/book/`, authenticated management at `[orgSlug]/bookings/`. *Rationale: org layout enforces auth; public route needs its own layout*
3. **Lane assignment**: Auto-assign lanes by `resource.sortOrder` (fill in order). Members pick lane type, not specific lane. *Rationale: simpler UX, avoids choice paralysis*
4. **Pricing model**: Separate offerings per pricing tier (e.g., "Pistol Lane - Standard", "Pistol Lane - Weekend Peak") rather than rule-based dynamic pricing. *Rationale: simpler for v1, operator configures offerings explicitly*
5. **Walk-in customer records**: Auto-create `customer` with `status: 'lead'` on walk-in booking. Deduplicate by email within org. *Rationale: feeds CRM funnel automatically*
6. **Walk-in payment**: Stripe Checkout (redirect) on org's Connect account. No embedded payment form. *Rationale: PCI handled by Stripe, simpler integration*
7. **No background jobs in v1**: Stripe webhook delays resolve naturally. Staff can manually confirm if needed. *Rationale: avoid infrastructure complexity early*
8. **No CAPTCHA in v1**: Stripe Checkout acts as implicit bot gate for walk-in bookings. *Rationale: all walk-in bookings require payment*
9. **Confirmation code**: Short human-readable `BK-XXXX` code on every booking. QR code in email. *Rationale: enables fast check-in without custom hardware*
10. **Feature flag**: `laneBooking` in `organizationSetting.featureFlags`. Default false. Gates sidebar nav + public route. *Rationale: controlled rollout per tenant*

## Data Models

### booking

- **Fields**:
  - `id` text PK, prefix `bkg`
  - `organizationId` text NOT NULL, FK -> `organization.id`
  - `locationId` text NOT NULL, composite FK -> `(location.id, location.organizationId)`
  - `resourceId` text NOT NULL, composite FK -> `(resource.id, resource.organizationId)` -- the specific lane assigned
  - `resourceTypeId` text NOT NULL, composite FK -> `(resourceType.id, resourceType.organizationId)` -- lane type requested
  - `customerId` text, composite FK -> `(customer.id, customer.organizationId)` -- nullable only during Stripe pending state; auto-created for walk-ins
  - `offeringPriceId` text, composite FK -> `(offeringPrice.id, offeringPrice.organizationId)` -- pricing used
  - `status` enum `booking_status` (`pending`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`)
  - `bookerType` enum `booker_type` (`member`, `walk_in`, `staff`)
  - `paymentMethod` enum `booking_payment_method` (`entitlement`, `stripe`, `cash`, `free`)
  - `startTime` timestamptz NOT NULL
  - `endTime` timestamptz NOT NULL
  - `amountCentsPaid` integer NOT NULL DEFAULT 0 -- snapshot of price at booking time
  - `currency` text NOT NULL DEFAULT `'USD'`
  - `confirmationCode` text NOT NULL UNIQUE within org -- `BK-XXXX` format
  - `stripeCheckoutSessionId` text (nullable)
  - `stripePaymentIntentId` text (nullable)
  - `entitlementGrantId` text (nullable) -- if paid by entitlement, link to grant consumed
  - `createdByUserId` text (nullable) -- staff who created it, or NULL for self-service
  - `notes` text
  - `metadata` jsonb NOT NULL DEFAULT `{}`
  - `createdAt` timestamptz NOT NULL DEFAULT now()
  - `updatedAt` timestamptz NOT NULL DEFAULT now()
- **Indexes**:
  - `(organizationId)` -- tenant filtering
  - `(organizationId, locationId, startTime, endTime, status)` -- availability queries
  - `(organizationId, resourceId, startTime, endTime)` -- conflict detection
  - `(organizationId, customerId)` -- customer booking history
  - `(organizationId, confirmationCode)` UNIQUE -- check-in lookup
  - `(stripeCheckoutSessionId)` UNIQUE WHERE NOT NULL -- webhook idempotency
- **Constraints**:
  - CHECK `endTime > startTime`
  - CHECK `amountCentsPaid >= 0`
  - Composite FK on `(id, organizationId)` for tenant-scoped references
- **Migration notes**: New table. Add `booking` and `bookingEvent` to `id.ts` prefixes. No changes to existing tables.

### bookingEvent

- **Fields**:
  - `id` text PK, prefix `bke`
  - `organizationId` text NOT NULL, FK -> `organization.id`
  - `bookingId` text NOT NULL, composite FK -> `(booking.id, booking.organizationId)`
  - `eventType` enum `booking_event_type` (`created`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`, `payment_received`, `refunded`)
  - `previousStatus` enum `booking_status` (nullable)
  - `newStatus` enum `booking_status` NOT NULL
  - `actorId` text (nullable) -- user who triggered
  - `metadata` jsonb NOT NULL DEFAULT `{}`
  - `createdAt` timestamptz NOT NULL DEFAULT now()
  - NO `updatedAt` -- append-only
- **Indexes**:
  - `(organizationId, bookingId, createdAt)` -- history queries
- **Migration notes**: New table. Follows `subscriptionChangeEvent` pattern exactly.

### organizationSetting.bookingRules (JSONB schema)

Extend the existing `bookingRules` JSONB column (already exists, currently `{}`):

```typescript
type BookingRules = {
  slotDurationMinutes: number;           // e.g., 30, 60
  maxAdvanceBookingDays: number;          // how far ahead bookings allowed
  cancellationWindowMinutes: number;      // free cancellation before this window
  pendingExpirationMinutes: number;       // pending bookings expire after this (default 15)
  operatingHours: Record<string, {       // keyed by locationId
    [dayOfWeek: number]: {               // 0=Sunday, 6=Saturday
      open: string;                       // "09:00"
      close: string;                      // "21:00"
    } | null;                             // null = closed
  }>;
};
```

No schema migration needed -- JSONB column already exists.

## Behavior Specs

### Create Booking (Member)

- **Trigger**: Member submits booking form (authenticated)
- **Steps**:
  1. Validate: location, date, time slot, resource type
  2. Resolve operating hours from `bookingRules` for the location + day
  3. Query available lanes: `SELECT resource.* FROM resource LEFT JOIN booking ON (conflict check) WHERE resource.resourceTypeId = ? AND resource.locationId = ? AND resource.isActive = true AND no conflicting booking ORDER BY resource.sortOrder LIMIT 1`
  4. If no lane available: return error "No lanes available for this time slot"
  5. Determine payment: check entitlement balance for `entitlementType` matching the resource type
  6. If entitlement sufficient: `consumeEntitlement()` -- atomic transaction
  7. If entitlement insufficient: create Stripe Checkout session on Connect account, return checkout URL. Booking status = `pending`
  8. Generate `confirmationCode` (`BK-` + 4 random alphanumeric, retry on collision within org)
  9. INSERT `booking` with status `confirmed` (entitlement) or `pending` (Stripe)
  10. INSERT `bookingEvent` with `eventType: 'created'`
  11. Send confirmation email with QR code of `confirmationCode`
- **Result**: Booking confirmed (entitlement) or redirect to Stripe Checkout (payment)
- **Variations**: If member has no entitlement and org has no Stripe Connect, show error "Payment not available"

### Create Booking (Walk-in Online)

- **Trigger**: Walk-in submits public booking form (unauthenticated)
- **Steps**:
  1. Validate: location, date, time slot, resource type, name, email, phone
  2. Resolve pricing: look up active offering + offeringPrice for the resource type + time slot
  3. Check lane availability (same query as member flow)
  4. If no lane available: return error
  5. Upsert customer: find by `(organizationId, email)` or create with `status: 'lead'`
  6. Create Stripe Checkout session on Connect account with booking metadata
  7. Generate `confirmationCode`
  8. INSERT `booking` with status `pending`, `paymentMethod: 'stripe'`, `bookerType: 'walk_in'`
  9. INSERT `bookingEvent` with `eventType: 'created'`
  10. Redirect to Stripe Checkout
- **Result**: Redirect to Stripe
- **Variations**: Pending booking expires after `pendingExpirationMinutes` if Checkout not completed

### Stripe Webhook: Booking Payment Confirmed

- **Trigger**: `checkout.session.completed` event on connected account
- **Steps**:
  1. Extract `bookingId` from `session.metadata`
  2. Look up booking by ID
  3. If booking status is not `pending`: ignore (idempotent)
  4. UPDATE booking: `status` -> `confirmed`, set `stripePaymentIntentId` from session
  5. INSERT `bookingEvent` with `eventType: 'payment_received'` then `eventType: 'confirmed'`
  6. Send confirmation email with QR code
- **Result**: Booking moves to confirmed
- **Variations**: If booking was already cancelled (user cancelled before payment completed), refund via Stripe

### Create Booking (Staff)

- **Trigger**: Staff submits booking form from dashboard (authenticated, role: owner/admin)
- **Steps**:
  1. Validate: location, date, time slot, resource type, customer (search or walk-in details)
  2. Check lane availability
  3. Payment method selection:
     - `entitlement`: consume from customer's balance
     - `cash`: mark as paid, no Stripe
     - `free`: comp, no charge
     - `stripe`: create charge on Connect account
  4. Generate `confirmationCode`
  5. INSERT `booking` with status `confirmed`, `bookerType: 'staff'`, `createdByUserId`
  6. INSERT `bookingEvent`
  7. Send confirmation email if customer has email
- **Result**: Booking immediately confirmed

### Cancel Booking

- **Trigger**: User or staff requests cancellation
- **Steps**:
  1. Validate booking exists, status is `confirmed` or `pending`
  2. Check cancellation policy from `bookingRules.cancellationWindowMinutes`
  3. If `paymentMethod: 'stripe'` and within refund window: create Stripe refund via Connect account
  4. If `paymentMethod: 'entitlement'`: call `reverseConsumption()` to restore balance
  5. UPDATE booking: `status` -> `cancelled`
  6. INSERT `bookingEvent` with `eventType: 'cancelled'`
  7. Send cancellation email
- **Result**: Booking cancelled, payment reversed if applicable

### Check-in

- **Trigger**: Staff scans QR code or searches `confirmationCode`
- **Steps**:
  1. Look up booking by `(organizationId, confirmationCode)`
  2. Validate booking status is `confirmed`
  3. Validate booking time: `startTime` is within a reasonable window (e.g., 30 min before to slot end)
  4. UPDATE booking: `status` -> `checked_in`
  5. INSERT `bookingEvent` with `eventType: 'checked_in'`
- **Result**: Booking marked as checked in

## Edge Cases & Failure Modes

| Scenario | Expected Behavior | Severity |
|----------|-------------------|----------|
| Two users book last lane simultaneously | SELECT FOR UPDATE on resource row serializes transactions; second user gets "no lanes available" | critical |
| Stripe Checkout abandoned (walk-in closes tab) | Booking stays `pending`, expires after `pendingExpirationMinutes` (not enforced by background job; slot becomes available when expiration time passes and availability query filters out expired pending bookings) | warning |
| Member entitlement expires between slot selection and submit | `consumeEntitlement` returns `InsufficientEntitlement`; UI shows error with Stripe payment fallback | graceful |
| Cancellation after refund window | Booking cancelled but no refund issued; `bookingEvent.metadata` records "outside refund window" | graceful |
| Double webhook delivery | Idempotent: check booking status before updating; if already `confirmed`, skip | graceful |
| Walk-in email matches existing customer | Upsert: link booking to existing customer record instead of creating duplicate | graceful |
| Org has no Stripe Connect account | Walk-in online booking disabled (public page shows "online booking not available"); staff can still book with `cash`/`free` | graceful |
| Location closed on requested day | Operating hours check returns no available slots for that day | graceful |
| Booking for past time slot | Validation rejects `startTime` in the past | graceful |
| `confirmationCode` collision | Retry generation (loop until unique within org); 36^4 = 1.6M possibilities per org, collision extremely unlikely | graceful |

## Scope

**In scope (v1):**
- Booking schema (booking + bookingEvent tables)
- Staff-created bookings (all payment methods)
- Member self-service booking (entitlement + Stripe fallback)
- Walk-in online booking (Stripe Checkout via Connect)
- Lane auto-assignment by resource type
- Slot availability computation from operating hours + existing bookings
- Confirmation code + QR code in email
- Check-in flow (QR scan / code lookup)
- No-show marking (staff-driven)
- Cancellation with conditional refund
- Feature flag gate
- Peak/off-peak pricing via separate offerings

**Out of scope:**
- Recurring/series bookings -- adds scheduling complexity, defer to v2
- Waitlist when all lanes booked -- requires notification system, defer to v2
- CAPTCHA/bot protection on public page -- Stripe is the gate for v1
- Background reconciliation job for stuck pending bookings -- manual staff override sufficient
- Calendar sync (Google Calendar, iCal) -- nice-to-have, defer
- SMS notifications -- email only for v1
- Multi-lane bookings (book 3 lanes for a group) -- v2
- Dynamic pricing rules (automatic peak detection) -- separate offerings sufficient for v1

## Assumptions & Unknowns

- **Assumption**: Each booking is for exactly one lane, one time slot. *Risk if incorrect: data model needs to support multi-lane bookings*
- **Assumption**: Operating hours are uniform across all lanes at a location (no per-lane schedules). *Risk if incorrect: need per-resource availability rules*
- **Assumption**: Entitlement type for lane access is a string like `range_access` or `pistol_lane_access`. Org configures this. *Risk if incorrect: need mapping table between resource types and entitlement types*
- **Assumption**: Stripe Connect account is already onboarded before enabling lane booking. *Risk if incorrect: need onboarding flow guard*
- **Unknown**: How should entitlement type map to resource type? One entitlement per lane type, or one generic "range access" entitlement? *Risk if incorrect: members with pistol-only membership could book rifle lanes. Mitigated by: storing `resourceTypeId` mapping in offering rules*

## Documentation Impact

- **Must update**: Sidebar navigation component (add booking link)
- **New docs needed**: Booking rules configuration guide for operators; public booking page setup

## Source-of-Truth Conflicts

| Conflict | Sources | Classification | Resolution |
|----------|---------|---------------|------------|
| `bookingRules` JSONB has no TypeScript type | Schema file vs runtime | incomplete impl | Define TypeScript type in `validation.ts`, add Zod schema for runtime validation |
| `resource.bookingUnit` field exists but unused | Schema vs business logic | incomplete impl | Use as slot duration override per resource type (or rely on `bookingRules.slotDurationMinutes` globally) |

## Operational Considerations

- **Rollout strategy**: Feature flag `laneBooking` in `organizationSetting.featureFlags`. Enable per-org. Sidebar link conditionally rendered.
- **Backward compatibility**: New tables only. No changes to existing tables or APIs. Zero breaking changes.
- **Feature flags**: `laneBooking` boolean in featureFlags JSONB. Checked in public route, sidebar, and booking pages.
- **Performance / cost**: Availability query is O(lanes * bookings_in_window). With index on `(orgId, resourceId, startTime, endTime, status)`, sub-50ms for typical ranges (<50 lanes, <100 daily bookings). Stripe fees are standard Connect rates.
- **Monitoring**: Log booking creation, cancellation, and payment events. Surface stuck `pending` bookings in staff dashboard (filter by `createdAt < now() - pendingExpirationMinutes AND status = 'pending'`).
- **Failure recovery**: Manual staff override for stuck bookings. Staff can force-confirm or force-cancel any booking from the dashboard.

## Security & Access

- **Permissions affected**: New `booking` resource in access control:
  - Owner/Admin: `["create", "read", "update", "cancel", "check_in", "list"]`
  - Member: `["create", "read", "cancel"]` (own bookings only)
  - Public (unauthenticated): create via public route only
- **Sensitive data**: Walk-in PII (name, email, phone) stored in `customer` table, already subject to existing data handling. No card data stored (Stripe handles PCI).
- **Trust boundaries**: Public booking route is unauthenticated -- all input validated via Zod. Stripe Checkout prevents fake payments. Rate limiting on public endpoints (existing Better Auth rate limiter pattern).
- **Abuse risks**: Slot squatting via abandoned pending bookings mitigated by expiration window. No other significant abuse vectors since all walk-in bookings require payment.

## Code Design & Boundaries

- **Key interfaces/abstractions**:
  - `createBooking(data: CreateBookingData): Effect<Booking, BookingError>` -- orchestrator
  - `getAvailableSlots(query: SlotQuery): Effect<Slot[], DatabaseError>` -- pure query
  - `cancelBooking(data: CancelBookingData): Effect<void, BookingError | StripeError>`
  - `checkInBooking(data: CheckInData): Effect<void, BookingError>`
  - `generateConfirmationCode(orgId: string): Effect<string, DatabaseError>`
- **Dependency direction**: `bookings.ts` -> `entitlements.ts`, `stripe.ts`, `booking-availability.ts`. Never reversed. `booking-availability.ts` depends only on `DbService`.
- **Patterns applied**: Effect services, tagged errors, Zod validation, server actions, composite foreign keys for tenant isolation, append-only event log.
- **Extension points**: `bookingRules` JSONB for future configuration. `metadata` JSONB on booking for future fields. `offeringRule` for future dynamic pricing.

## Testing Strategy

- **Unit tests** (`src/__tests__/bookings/`):
  - `booking-creation.test.ts` -- member, walk-in, staff paths
  - `booking-availability.test.ts` -- slot computation, conflict detection, operating hours
  - `booking-cancellation.test.ts` -- refund logic, entitlement reversal, policy enforcement
  - `booking-state-machine.test.ts` -- all valid transitions, rejection of invalid transitions
  - `confirmation-code.test.ts` -- generation, uniqueness, format
- **Integration tests**:
  - `stripe-booking-webhook.test.ts` -- checkout.session.completed handling
  - `entitlement-booking.test.ts` -- consume on book, reverse on cancel
- **End-to-end tests** (`e2e/`):
  - Public booking page flow
  - Staff booking creation
  - Check-in via confirmation code
- **Test data**: Seed helpers for resources (lanes), resource types, offerings with prices, booking rules. Follow `src/__tests__/helpers/` patterns.
- **Acceptance verification**: Each phase has acceptance criteria tied to specific test cases.

## Phased Build Plan

### Phase 1: Schema + Staff Booking
**Depends on**: Nothing
**Decisions**: #1, #2, #5, #9, #10
**What**: Database tables, booking logic core, staff dashboard for creating/managing bookings. Feature flag gate.
**Acceptance criteria**:
- [ ] `booking` and `bookingEvent` tables created with all fields and indexes
- [ ] ID prefixes `bkg` and `bke` registered
- [ ] `bookingRules` TypeScript type + Zod schema defined
- [ ] Staff can create a booking for a customer with `cash` or `free` payment
- [ ] Booking status transitions enforce the state machine
- [ ] Confirmation code generated and unique within org
- [ ] Feature flag `laneBooking` gates the booking UI
- [ ] Sidebar conditionally shows booking link
- [ ] Unit tests for booking creation, state machine, code generation

### Phase 2: Member Self-Service
**Depends on**: Phase 1
**Decisions**: #3, #4
**What**: Member-facing booking page, entitlement integration, lane auto-assignment, Stripe fallback.
**Acceptance criteria**:
- [ ] Member can view available slots for a date + lane type
- [ ] Slot availability correctly computes from resources + existing bookings + operating hours
- [ ] Lane auto-assigned by `sortOrder`
- [ ] Member booking consumes entitlement atomically
- [ ] If insufficient entitlement, Stripe Checkout fallback works
- [ ] Booking history visible to member
- [ ] Unit tests for availability, auto-assignment, entitlement integration

### Phase 3: Walk-in Online Booking
**Depends on**: Phase 2
**Decisions**: #5, #6, #7, #8
**What**: Public booking page, Stripe Checkout via Connect, customer auto-creation, confirmation email with QR.
**Acceptance criteria**:
- [ ] Public route at `[orgSlug]/(public)/book/` resolves org without auth
- [ ] Public route returns 404 if feature flag disabled or org not found
- [ ] Walk-in can select slot, enter details, pay via Stripe Checkout
- [ ] Webhook confirms booking on payment success
- [ ] Customer auto-created as `lead` (or linked to existing by email)
- [ ] Confirmation email sent with QR code of `confirmationCode`
- [ ] Pending bookings don't block slot availability after expiration window
- [ ] Org without Stripe Connect shows "online booking not available"
- [ ] Tests for webhook, customer upsert, email, public route auth bypass

### Phase 4: Check-in + Operations
**Depends on**: Phase 3
**Decisions**: #9
**What**: Check-in flow, no-show marking, cancellation with refund, operational dashboard.
**Acceptance criteria**:
- [ ] Staff can search by confirmation code to find booking
- [ ] QR code scan resolves to check-in action
- [ ] Check-in validates booking time window
- [ ] Staff can mark no-show after slot time
- [ ] Cancellation respects refund window from `bookingRules`
- [ ] Stripe refund issued for eligible cancellations
- [ ] Entitlement reversed on cancellation of entitlement-paid bookings
- [ ] Dashboard shows today's bookings, upcoming bookings, basic stats
- [ ] Tests for check-in, no-show, cancellation, refund

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| explore | skipped | -- | N/A |
| define | skipped | -- | No PRD; requirements from verbal discussion |
| design | skipped | -- | No UX spec |
| architect | 2026-03-24 | pending review | 10 domains covered, 4-phase build plan, builds on existing resource/entitlement/Stripe infrastructure |
