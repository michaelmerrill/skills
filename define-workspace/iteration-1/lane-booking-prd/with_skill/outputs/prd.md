# PRD: Online Lane Reservations

> Product requirements for online lane reservations
> Generated from define interview on 2026-03-24

## Problem Statement

Range customers cannot self-serve lane reservations. Members must call to book, and walk-in guests have no way to check availability before arriving. On busy weekends, an estimated 15-20 potential customers leave without shooting because no lanes are available and there is no visibility into when one will open. The lack of self-service booking is contributing to member churn ($50-100/month memberships) and lost walk-in revenue. Front-desk staff spend significant time fielding phone reservations and manually tracking bookings in spreadsheets and paper logs.

## Target Users

### Member
- **Who**: Active member with a paid subscription to the range
- **Current behavior**: Calls the range to reserve a lane, or shows up hoping one is available
- **Key need**: Guarantee a lane for a specific time without calling
- **Usage frequency**: Ad-hoc, 1-4 times per week

### Walk-in Guest
- **Who**: Non-member interested in shooting, no existing account
- **Current behavior**: Drives to the range and hopes for availability, or calls ahead
- **Key need**: Check availability and reserve a lane before making the trip
- **Usage frequency**: Occasional, 1-2 times per month

### Front-Desk Staff
- **Who**: Range employee (admin or member role in the system) managing the floor
- **Current behavior**: Tracks reservations in a paper log or spreadsheet, assigns lanes verbally
- **Key need**: Live view of all bookings and availability to manage walk-ins and check-ins
- **Usage frequency**: Continuously during operating hours

### Range Operator (Owner)
- **Who**: Range owner/operator wanting business visibility
- **Current behavior**: No visibility into utilization or booking patterns
- **Key need**: Schedule overview showing how busy the range is and when peak times occur
- **Usage frequency**: Daily or weekly review

## User Stories

### Member Books a Lane
- **As a** member, **I want** to pick a lane type, date, time, and duration on my phone, **so that** I have a guaranteed lane when I arrive.
- **Acceptance criteria**:
  - [ ] Member sees available lane types for their selected location
  - [ ] Member selects a date, time slot, and duration (consecutive slots up to the configured max)
  - [ ] System shows real-time availability (remaining lanes of that type for each slot)
  - [ ] Booking confirms instantly with no payment required for active members
  - [ ] Member receives an email confirmation with booking details
  - [ ] Member can specify shooter count (1 or 2)

### Guest Books a Lane Online
- **As a** walk-in guest, **I want** to book a lane from the range's website before I visit, **so that** I know a lane will be ready when I arrive.
- **Acceptance criteria**:
  - [ ] Guest accesses booking without an account
  - [ ] Guest provides name, email, and phone number
  - [ ] Guest selects lane type, date, time slot, and duration
  - [ ] If prepayment is enabled, guest pays the lane fee via Stripe before confirming
  - [ ] If prepayment is disabled, booking confirms without payment
  - [ ] Guest receives an email confirmation
  - [ ] A customer record is created in the system (status: lead)
  - [ ] Guest can specify shooter count (1 or 2)

### Front Desk Manages Bookings
- **As a** front-desk staff member, **I want** to see all bookings and open slots on a schedule view, **so that** I can assign walk-ins and manage check-ins efficiently.
- **Acceptance criteria**:
  - [ ] Staff sees a day view showing all lane types, time slots, and booking status
  - [ ] Staff can create a booking on behalf of a customer (member or walk-in)
  - [ ] Staff can cancel a booking
  - [ ] Booked, open, and blocked slots are visually distinct
  - [ ] View is scoped to the selected location

### Customer Cancels a Booking
- **As a** customer (member or guest), **I want** to cancel my reservation if my plans change, **so that** the lane becomes available for someone else.
- **Acceptance criteria**:
  - [ ] Customer can cancel from a link in the confirmation email or from their account
  - [ ] Cancellation is allowed up to the configured cutoff time before the slot
  - [ ] If cancelled after the cutoff, the booking is marked as a no-show
  - [ ] For prepaid guests, cancellation before cutoff triggers a refund (full or configurable)
  - [ ] Cancelled slot becomes immediately available for others

### Operator Views Schedule
- **As a** range operator, **I want** to see a schedule overview for my location, **so that** I can understand booking patterns and utilization.
- **Acceptance criteria**:
  - [ ] Operator sees a daily/weekly schedule view of bookings across lane types
  - [ ] View shows utilization — what percentage of available lane-hours are booked
  - [ ] Operator can navigate between dates

## Functional Requirements

### Booking Flow
- FR-1: Customers select a location, lane type (resource type), date, time slot, and number of consecutive slots.
- FR-2: The system displays real-time availability showing remaining lanes per type for each time slot.
- FR-3: Members with an active subscription book at no cost. No entitlement consumption required.
- FR-4: Guests provide name, email, and phone. A customer record is created automatically.
- FR-5: When prepayment is enabled for a lane type, guest payment is collected via Stripe (through the range's connected account) before confirming the booking.
- FR-6: Each booking captures a shooter count (1 or 2) for safety tracking purposes. Shooter count does not affect pricing.
- FR-7: One lane per booking. Multiple customers booking together each make separate reservations.

### Slot Configuration
- FR-8: Slot duration is configurable per resource type (e.g., 30 min, 1 hour, 2 hours).
- FR-9: Maximum consecutive slots per booking is configurable (default: 3 hours equivalent).
- FR-10: Advance booking window is configurable per organization — how far ahead and how close to slot start (default: 14 days ahead, 1 hour before).

### Operating Hours & Blocks
- FR-11: Operating hours are defined per location, varying by day of week.
- FR-12: Operators can create manual time blocks to prevent booking during specific periods (maintenance, events, holidays).
- FR-13: Bookable slots are generated only within operating hours minus manual blocks.

### Confirmation & Communication
- FR-14: Email confirmation sent on successful booking, including location, lane type, date, time, duration, and cancellation instructions.
- FR-15: Email notification sent on cancellation.

### Cancellation
- FR-16: Customers can cancel bookings up until the start of the slot.
- FR-17: A configurable cancellation cutoff determines the no-show threshold (default: 2 hours before slot).
- FR-18: Cancellations after the cutoff are recorded as no-shows. No penalty in v1 — data tracking only.
- FR-19: For prepaid bookings, cancellation before cutoff triggers a refund through Stripe.

### Front-Desk Management
- FR-20: Staff can view a schedule for the selected location showing bookings and availability by lane type and time slot.
- FR-21: Staff can create bookings on behalf of any customer (existing or new walk-in).
- FR-22: Staff can cancel any booking.
- FR-23: Booking status is visually clear: booked, open, blocked.

### Schedule Visibility
- FR-24: Operators see a schedule view showing booking density across lane types by day/week.
- FR-25: Utilization metric — percentage of available lane-hours booked — is visible per day.

## Non-Functional Requirements

- NFR-1: Booking UI must be mobile-first. Primary customer interaction is on phones.
- NFR-2: Availability checks must reflect current state — no stale slot counts. Double-booking the same physical lane must not be possible.
- NFR-3: Guest booking flow must be completable in under 2 minutes (name/email/phone + slot selection + payment if applicable).
- NFR-4: Standard WCAG 2.1 AA accessibility compliance.
- NFR-5: Booking data is scoped per tenant (organization) and per location. No cross-tenant data leakage.
- NFR-6: The feature must work within the existing subdomain-based multi-tenant routing (`{slug}.getrangeops.dev`).

## Success Metrics

| Metric | Target | Measurement | Timeframe |
|--------|--------|-------------|-----------|
| Online booking adoption | 40-50% of lane-hours booked online | Online bookings / total bookings | 90 days |
| Lane utilization visibility | Operators can see utilization rate | Feature available and used weekly | 30 days |
| No-show rate (members) | Establish baseline | No-shows / total member bookings | 60 days |
| No-show rate (prepaid guests) | Lower than non-prepaid | No-shows by payment type | 90 days |
| Member retention | Improvement over pre-launch baseline | Monthly churn rate comparison | 90 days |
| Guest conversion | Guests who book online return or become members | Guest bookings that lead to repeat visits | 90 days |

## Scope

**In scope (v1):**
- Customer-facing booking flow (member and guest) by lane type for configurable time slots
- Front-desk schedule view with booking creation and cancellation
- Operator schedule overview with utilization visibility
- Email confirmations for bookings and cancellations
- Configurable slot duration per resource type
- Configurable booking window (advance limit + minimum lead time)
- Free booking for active members
- Optional prepayment for guests via Stripe
- Cancellation with configurable cutoff; no-show tracking
- Shooter count capture (1-2 per booking)
- Operating hours per location + manual time blocks
- Mobile-first booking UI

**Out of scope:**
- Recurring/repeating reservations -- deferred because ad-hoc booking covers the dominant use case; recurring adds scheduling complexity
- Group/event bookings -- handled through a separate workflow today; different requirements (multiple lanes, catering, custom pricing)
- SMS notifications -- email sufficient for v1; SMS adds vendor cost and opt-in compliance
- Tier-based entitlement consumption for lane access -- all active members book free in v1; granular tier limits are a future iteration
- No-show penalties (fees, booking restrictions) -- tracking first to establish baseline data before penalizing
- Customer-selected specific lane assignment -- customers book by type; staff assigns the physical lane

**Future (conditional):**
- Recurring reservations -- trigger: demand from regulars who want weekly standing slots
- Group/event bookings -- trigger: operators request self-service event scheduling
- SMS booking confirmations and reminders -- trigger: email open rates are low, or operators request it
- Tier-based lane entitlements -- trigger: operators want to differentiate membership tiers by lane access
- No-show penalties -- trigger: no-show rate exceeds acceptable threshold (to be determined from baseline data)
- Waitlist for fully-booked slots -- trigger: operators report frequent sellouts where customers want to queue

## Dependencies & Constraints

- **Dependency**: Stripe Connect account must be onboarded for ranges that want guest prepayment. *Status: resolved — Stripe Connect onboarding already exists in the app.*
- **Dependency**: Email system (Resend) for booking confirmations. *Status: resolved — Resend integration already exists.*
- **Dependency**: Resource types and resources must be configured by the operator before booking is available at a location. *Status: resolved — resource/resourceType schema exists, though admin UI for managing them may need to be built or verified.*
- **Constraint**: Timeline — must be live before Memorial Day weekend (late May 2026). *Impact: approximately 2 months for design + build; scope must remain tight.*
- **Constraint**: Each range sets its own lane pricing. No platform-level pricing. *Impact: pricing configuration is per-offering, per-organization, which aligns with existing offering model.*

## Risks & Open Questions

- **Risk**: Phantom reservations — members book free slots and don't show up, blocking availability. *Mitigation: no-show tracking from day 1. Data will inform whether penalties are needed in v2.*
- **Risk**: Slot hogging — regulars book max slots at prime times weeks in advance. *Mitigation: configurable advance booking window (default 14 days) and max consecutive slot limit (default 3 hours) constrain this.*
- **Risk**: Guest booking friction leads to low adoption. *Mitigation: minimal form (name, email, phone), mobile-first design, under 2 minutes to complete.*
- **Risk**: Double-booking if concurrent requests target the last available lane. *Mitigation: must be handled at the data layer to guarantee no overselling. Captured for architect phase.*
- **Open question**: Should the guest booking page be public (no auth) or require the range's subdomain? *Needed by: design phase. Impact if unresolved: affects URL structure and access control.*
- **Open question**: How should refunds work for prepaid cancellations — full refund before cutoff, or configurable partial refund? *Needed by: before launch. Impact if unresolved: operators can't configure refund policy. Assumed full refund before cutoff for v1.*

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| explore | skipped | -- | No scope doc; started from user description |
| define | 2026-03-24 | Ready | 4 personas, 5 user stories, 25 FRs, 6 NFRs. Core booking flow, front-desk management, operator visibility. Configurable per org/location. Tight scope for Memorial Day deadline. |
