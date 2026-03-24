# Scope: Lane Booking

> Generated from explore scoping interview on 2026-03-24

## Problem Statement

Range operators need a built-in online booking system so their customers (members and walk-ins) can reserve lanes for specific time slots. Currently, operators rely on fragmented workarounds -- phone-only reservations, walk-in-only policies, or disconnected third-party tools like Square Appointments. This creates operational friction and poor customer experience. Three pilot operators have requested this in the past month, and competing range management platforms either lack online booking or charge extra for it.

## Stakeholders

- **Users**: Range customers (members who get included/discounted sessions, walk-ins who pay per session, guests who book without creating an account) and range staff (manage schedules, book on behalf of customers, handle cancellations).
- **Business**: Core platform feature for both retaining pilot operators and acquiring new ones. Headline feature for marketing and competitive differentiation. Bundled into the platform at no extra charge.
- **Internal**: Engineering team builds net-new scheduling and public-facing booking infrastructure. First customer-facing feature on tenant subdomains.

## Feasibility Assessment

- **Technical feasibility**: High. The existing stack (Next.js, Drizzle/Postgres, Stripe Connect, Effect-TS, Resend) is well-suited. Key building blocks already exist: `resourceType` (with `bookingUnit` field) and `resource` models for lane inventory, `customer` model supporting both linked members and standalone walk-ins, `offering`/`offeringPrice` for pricing with Stripe integration, `entitlementGrant`/`entitlementLedger`/`entitlementBalance` for member session credits, `bookingRules` JSONB on org settings, location-level timezone support, and Stripe Connect for per-tenant payment collection. Postgres row-level concurrency is sufficient for expected booking volume (4-12 lanes per location, moderate traffic). No external infrastructure or third-party scheduling services required.
- **Prior work**: Resource and resource type schema is defined and ready but has no admin UI. The `bookingRules` field on organization settings exists but is unused. No booking, reservation, or scheduling code exists anywhere in the codebase. The customer-facing booking page would be the first public route on tenant subdomains.

## High-Level Scope

**Likely in for v1:**
- Operator lane configuration (admin UI for resource types and individual resources per location)
- Operator availability/schedule management (operating hours, time slot durations per lane type)
- Customer-facing public booking page on tenant subdomain (browse availability, select lane type, pick time slot)
- Walk-in/guest payment via Stripe Connect at time of booking
- Member booking consuming entitlement credits or at discounted rates
- Staff-side booking management (view schedule, book on behalf of customers, cancel/modify)
- Customer self-cancellation within configurable cancellation window
- Booking confirmation and cancellation emails via Resend
- Guest checkout (book without creating an account)

**Likely out for v1:**
- Embeddable booking widget for operator's own website -- separate distribution channel, adds scope
- Recurring/repeating reservations -- adds scheduling complexity
- Waitlists when time slots are full -- deferred until demand justifies it
- Group bookings (multiple lanes for a party) -- likely fast follow but not v1
- Access control / door system integration -- no operator need yet
- Calendar sync (Google Calendar, iCal export) -- nice-to-have, not essential

## Key Risks & Assumptions

- **Risk**: Operator setup friction. No admin UI for resource management exists today -- it must be built as part of this feature. If configuration is complex or time-consuming, operators won't adopt. *Likelihood: M. Impact: Low adoption of booking feature despite demand.*
- **Risk**: Stripe Connect onboarding dependency. Only 1 of 3 pilot operators has completed Connect onboarding. Walk-in payment collection is blocked until operators onboard. *Likelihood: L. Impact: Delayed revenue collection for unboarded operators; scheduling still works for members.*
- **Assumption**: Lane inventory is simple and fixed. Lanes don't change type dynamically or get split/merged. *If wrong: Resource model and scheduling logic would need reconfiguration support, adding significant complexity.*
- **Assumption**: Booking volume is low to moderate (4-12 lanes, not high-demand). Postgres-level concurrency is sufficient with no queuing infrastructure needed. *If wrong: Would need optimistic locking or a booking queue for high-contention scenarios.*
- **Assumption**: No external integrations needed for v1 (POS, access control, calendars). *If wrong: Integration work could significantly expand scope and timeline.*
- **Assumption**: Operators will self-configure schedules and lane inventory without white-glove support. *If wrong: Onboarding process needs a setup wizard or customer success involvement.*
- **Assumption**: Guest checkout (no account required) is expected for walk-in bookings. Customer model already supports standalone records without linked user accounts. *If wrong: Would need to add account creation to the booking flow.*

## Recommendation

**Verdict**: Go

The technical foundation is unusually strong for this feature. The resource model, customer model, entitlements system, Stripe Connect, and org-level booking rules were clearly designed with this kind of capability in mind. The main greenfield work is the booking/scheduling logic itself, the operator admin UI for resource management, and the first public-facing tenant page. There are no architectural blockers, no external dependencies, and demand is validated by pilot operators. This is a weeks-scale effort, not months, given what's already in place. Recommend proceeding to `/define` to nail down the functional requirements.

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| explore | 2026-03-24 | Go | Strong existing foundations (resource model, entitlements, Stripe Connect). Net-new scheduling logic + first public tenant page. Validated demand from 3 pilot operators. Weeks-scale effort. |
