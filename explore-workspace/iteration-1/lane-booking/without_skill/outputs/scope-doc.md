# Lane Booking Feature - Scope Document

**Project:** RangeOps
**Date:** 2026-03-24
**Status:** Proposed

---

## 1. Vision

Allow shooting range customers (members and walk-ins) to reserve lanes online for specific time slots, while giving range staff full control over availability, pricing, and day-of operations. The goal is to reduce weekend congestion, improve customer experience, and give operators demand visibility.

## 2. Current State of the Codebase

The existing data model provides strong foundations:

| Existing Concept | Relevance to Bookings |
|---|---|
| `location` | Lanes live at locations; booking availability is per-location |
| `resourceType` | Maps directly to lane types (pistol, rifle, VIP) |
| `resource` | Maps directly to individual lanes; has `capacity`, `isActive`, `sortOrder` |
| `customer` | Booker identity; guest bookings create `lead`-status customers |
| `offering` / `offeringPrice` | Could model lane session products with per-type pricing |
| `entitlementGrant` / `entitlementLedger` / `entitlementBalance` | Handles "included sessions per month" for premium members |
| `organizationSetting.bookingRules` (JSONB) | Already exists as a placeholder for booking configuration |
| Stripe Connect (`organizationPaymentAccount`) | Payment collection on connected accounts is already wired |
| `subscription` | Links customers to membership tiers for discount/entitlement logic |

**What does NOT exist yet:**
- No booking/reservation table
- No schedule/availability model (operating hours, time slots)
- No cancellation or no-show tracking
- No public-facing (non-auth) booking UI
- No guest checkout flow

## 3. Proposed Scope (v1)

### 3.1 Data Model Additions

**`booking_schedule`** - Per-location operating hours and slot configuration:
- `locationId`, `organizationId`
- `dayOfWeek` (0-6)
- `openTime`, `closeTime` (time without timezone)
- `slotDurationMinutes` (30, 60, 120)
- `isActive`

**`booking_block`** - Maintenance windows, holidays, private events:
- `resourceId` (nullable; null = entire location)
- `locationId`, `organizationId`
- `startsAt`, `endsAt`
- `reason`, `blockType` (maintenance, holiday, private_event)

**`booking`** - The core reservation record:
- `id`, `organizationId`, `locationId`
- `resourceId` (the specific lane)
- `resourceTypeId` (for querying by lane type)
- `customerId`
- `status` enum: `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`
- `startsAt`, `endsAt`
- `slotDurationMinutes`
- `amountCents`, `currency`
- `discountCents`, `discountReason`
- `stripePaymentIntentId` (null for staff-created/walk-in bookings)
- `source` enum: `online`, `staff`, `walk_in`
- `cancelledAt`, `cancellationReason`
- `noShowFlaggedAt`, `noShowNotes`
- `bookedByUserId` (staff user, if staff-created)
- `metadata` (JSONB)
- `createdAt`, `updatedAt`

**`booking_capacity_config`** - Per-location lane allocation:
- `locationId`, `organizationId`, `resourceTypeId`
- `totalLanes`, `reservableLanes`, `walkInLanes`
- Allows the 70/30 split to be configurable

### 3.2 Business Logic

**Availability Engine:**
- Compute available slots from schedule + existing bookings + blocks
- Respect capacity config (reservable vs. walk-in lane split)
- 30-day advance booking window (configurable in `organizationSetting.bookingRules`)
- Slot generation based on `booking_schedule.slotDurationMinutes`

**Pricing:**
- Flat price per slot per resource type (modeled as `offeringPrice` entries)
- Member discounts: percentage off, looked up from subscription's offering rules
- Included sessions: consume from `entitlementBalance` at booking time; if balance > 0, no charge

**Cancellation Policy:**
- 2-hour cutoff before slot start time
- Before cutoff: full Stripe refund, booking status -> `cancelled`
- After cutoff: no refund, booking stays `confirmed` or goes to `no_show`
- Staff can cancel/modify any booking regardless of cutoff

**No-Show Handling:**
- If not checked in within 15 minutes of slot start, auto-flag as `no_show`
- Repeat no-shows (3+ in 30 days) trigger staff alert
- No-show charges retained

### 3.3 User Interfaces

**Public Booking Flow (customer-facing):**
- Location selector -> lane type selector -> date/time picker -> slot selection
- Guest checkout: name, email, phone, card (Stripe Elements)
- Member checkout: logged in, auto-apply discounts/entitlements
- Confirmation page + email confirmation

**Staff Dashboard (admin-facing):**
- Daily/weekly calendar view of all lanes at a location
- Visual lane grid showing booked, available, walk-in-held, blocked slots
- Create/modify/cancel bookings
- Check-in button (marks `checked_in`)
- Block lanes/times for maintenance or events
- Configure schedules, capacity splits, booking rules

**Customer-Facing "My Bookings":**
- View upcoming and past reservations
- Cancel upcoming reservations (within policy)

### 3.4 Stripe Integration

- Online bookings: Stripe Payment Intent on connected account at booking time
- Refunds: automated via Stripe Refund API within cancellation policy
- Guest bookings: Stripe Checkout session (no saved payment method required)
- Staff bookings: no Stripe charge; payment handled externally

### 3.5 Out of Scope (v1)

- Dynamic / peak pricing
- Recurring reservations (book every Tuesday at 6pm)
- Waitlist functionality
- Multi-lane bookings in a single transaction
- Customer-facing mobile app
- SMS notifications (email only for v1)
- Equipment rental add-ons
- Range safety officer assignment to bookings

## 4. Feasibility Assessment

### What Aligns Well

**Strong:** The existing resource/resourceType model was clearly designed with bookability in mind (`bookingUnit` field on `resourceType`). The entitlement system (grant/ledger/balance) can handle included-sessions-per-month with no changes. Stripe Connect is already wired for payment collection. The `organizationSetting.bookingRules` JSONB field was pre-allocated for this purpose.

**Moderate:** The customer model supports guest bookings via `lead` status, and the optional `userId` FK allows account linking later. The multi-tenant architecture (composite FKs with `organizationId`) is consistent and the new tables follow the same pattern.

### Technical Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Double-booking race conditions** | High | Use database-level `UNIQUE` constraint on `(resource_id, starts_at)` for confirmed bookings + row-level locking or `SELECT FOR UPDATE` during slot selection |
| **Timezone handling** | Medium | Locations already store timezone; all booking times stored as UTC with timezone, slot display converted client-side |
| **Availability query performance** | Medium | Pre-compute daily availability or use materialized views; index on `(resource_id, starts_at, status)` |
| **Entitlement consumption atomicity** | Medium | Wrap entitlement check + booking creation + ledger entry in a single DB transaction |
| **Guest checkout without auth** | Low | Public API route with rate limiting; create customer record inline; Stripe handles card security |
| **No-show auto-detection** | Low | Cron job or scheduled function (Vercel Cron / pg_cron) checks unchecked-in bookings past the 15-min mark |

### Effort Estimate

| Component | Estimate |
|---|---|
| Schema (booking, schedule, block, capacity config) | 1-2 days |
| Availability engine (slot computation, conflict checks) | 3-4 days |
| Public booking flow (UI + API + Stripe) | 4-5 days |
| Staff calendar/dashboard UI | 4-5 days |
| Member discount + entitlement consumption logic | 2-3 days |
| Cancellation + no-show handling | 2-3 days |
| Email confirmations | 1 day |
| Testing (unit + integration + e2e) | 3-4 days |
| **Total** | **~20-27 days (1 developer)** |

## 5. Dependencies

- Stripe Connect onboarding must be complete for the range's connected account (already built)
- The email package (`packages/email`) is present and can be extended for booking confirmations
- Resource types and resources must be configured for the location before booking is enabled

## 6. Recommendation

**Go.** This feature is a natural next step for the platform and the codebase is well-positioned for it. The resource model, entitlements system, Stripe Connect integration, and multi-tenant architecture all align. The main engineering risk (double-booking race conditions) is a solved problem with database constraints. No architectural changes are needed -- this is additive schema + new routes.

Suggested phasing:
1. **Phase 1 (MVP):** Staff-side booking creation + calendar view + schedule config. Gets RSOs off paper immediately.
2. **Phase 2:** Public-facing online booking flow with guest checkout + member discounts.
3. **Phase 3:** Entitlement auto-consumption, cancellation policy enforcement, no-show automation.

This lets you ship incremental value. Phase 1 alone replaces the paper logbook and provides demand visibility.
