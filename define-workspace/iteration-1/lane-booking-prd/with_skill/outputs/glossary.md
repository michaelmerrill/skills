# Ubiquitous Language: Online Lane Reservations

> Domain glossary for [lane-reservations-prd.md]
> Generated from define glossary analysis on 2026-03-24

## Glossary Condition Check

**Condition 1 — PRD introduces 3+ domain nouns not in codebase**: Met.
- "Booking" / "Reservation" -- no existing schema, model, or UI reference
- "Time slot" / "Slot" -- no existing concept
- "Operating hours" -- no existing schedule or hours model
- "Time block" -- no existing block-out concept
- "No-show" -- no existing tracking
- "Shooter count" -- no existing field
- "Cancellation cutoff" -- no existing concept

**Condition 2 — Naming conflicts**: Met.
- PRD says "lane" and "lane type" while codebase uses "resource" and "resourceType"
- PRD says "booking" while codebase has `bookingUnit` and `bookingRules` fields but no "booking" entity
- PRD uses "walk-in guest" and "guest" while codebase uses "customer" with status "lead"

**Condition 3 — Crosses bounded-context boundaries**: Met.
- Booking spans resources, customers, offerings/pricing, entitlements (even if deferred), and payments (Stripe)

All three conditions met. Proceeding with glossary.

---

## Glossary

| Term | Definition | Aliases | Code Name | Status |
|------|-----------|---------|-----------|--------|
| Booking | A confirmed reservation of one lane for a customer during one or more consecutive time slots | reservation | new | new |
| Lane | A single bookable shooting position at a location, belonging to a lane type | resource (code), bay, station | `resource` | rename |
| Lane Type | A category of lanes defined by the range (e.g., pistol, rifle, shotgun) | resource type (code) | `resourceType` | rename |
| Time Slot | A fixed-duration block of time during which a lane can be booked, determined by lane type configuration | slot, block | new | new |
| Slot Duration | The length of one time slot, configurable per lane type (e.g., 30 min, 1 hr, 2 hr) | booking unit | `bookingUnit` (field on resourceType) | canonical |
| Operating Hours | The daily schedule defining when a location is open for booking, varying by day of week | business hours, open hours | new | new |
| Time Block | A manual override that prevents booking during a specific period (maintenance, events, holidays) | block-out, blackout, closure | new | new |
| Booking Window | The configurable range of time within which customers can book — how far in advance and how close to slot start | advance booking limit | `bookingRules` (field on organizationSetting) | canonical |
| Cancellation Cutoff | The minimum time before a slot start by which a customer must cancel to avoid a no-show | cancellation deadline, cutoff | new (within bookingRules) | new |
| No-Show | A booking where the customer did not arrive and did not cancel before the cutoff | missed booking, phantom reservation | new | new |
| Shooter Count | The number of people sharing a single lane during a booking (1 or 2), tracked for safety | shooters, party size | new | new |
| Guest | A non-member customer booking a lane without an existing account, identified by name/email/phone | walk-in, walk-in guest | `customer` (status: "lead") | rename |
| Member | A customer with an active subscription who can book lanes at no additional cost | subscriber | `customer` (status: "active") + `subscription` | canonical |
| Prepayment | An upfront lane fee collected from a guest during booking via Stripe, before confirmation | online payment, deposit | new | new |

## Ambiguities Resolved

### Lane vs. Resource
- **Problem**: The PRD uses "lane" and "lane type" as user-facing terms. The codebase uses `resource` and `resourceType` as generic, industry-agnostic names.
- **Resolution**: Use "lane" and "lane type" in all user-facing contexts (UI labels, emails, documentation). The codebase models remain `resource` and `resourceType` since the platform serves multiple range types and the generic model is correct. Design should map UI labels to the underlying resource model.
- **Action**: No code rename. Design uses "lane" / "lane type" in UI. PRD uses product terms.

### Guest vs. Customer (Lead)
- **Problem**: The PRD refers to "guest" and "walk-in guest." The codebase has a `customer` entity with status "lead" for new entrants.
- **Resolution**: Use "guest" in user-facing booking flow. Internally, a guest is a `customer` record with status "lead" that may convert to "active" upon purchasing a membership.
- **Action**: No code rename. Design uses "guest" in the booking UI. Backend creates a customer with status "lead."

### Booking Rules Scope
- **Problem**: `bookingRules` is a JSON field on `organizationSetting` (org-wide). The PRD specifies some rules at the lane-type level (slot duration) and some at the org/location level (booking window, cancellation cutoff).
- **Resolution**: Slot duration is a lane-type (resource type) property via the existing `bookingUnit` field. Booking window and cancellation cutoff are org-level settings in `bookingRules`. Operating hours and time blocks are location-level constructs.
- **Action**: Architect phase determines exact placement. PRD language is consistent: "configurable per resource type" vs. "configurable per organization."

## Naming Conventions

- **ID prefixes**: The codebase uses `createId("entityName")` with camelCase entity names (e.g., `resourceType`, `entitlementGrant`). New booking entities should follow this pattern.
- **Schema table names**: Snake_case singular (e.g., `resource`, `customer`, `offering`). A booking table would be `booking`.
- **Enum naming**: Snake_case with `Enum` suffix in TypeScript (e.g., `customerStatusEnum`, `offeringTypeEnum`). A booking status enum would be `bookingStatusEnum`.
- **Timestamps**: All tables use `createdAt` and `updatedAt` with timezone. Immutable/append-only tables omit `updatedAt`.
- **Tenant scoping**: Every table includes `organizationId` with a foreign key to `organization.id` and a composite unique index `(id, organizationId)`.
