# Lane Booking -- Issue Breakdown Overview

## Summary

The lane booking design has been decomposed into **20 issues** organized across 4 phases, following the design doc's phased build plan. Each issue is self-contained with clear inputs, outputs, files to modify, and acceptance criteria suitable for handoff to a coding agent.

## Phase Map

### Phase 1: Schema + Staff Booking (Issues 1-10)

Foundation layer. No external dependencies. Establishes the data model, business rules, and staff-facing UI.

| # | Issue | Parallelizable With |
|---|-------|-------------------|
| 1 | Booking Schema and Migrations | 2, 3, 4, 5 |
| 2 | BookingRules Type and Validation | 1, 3, 4, 5 |
| 3 | Booking Error Types | 1, 2, 4, 5 |
| 4 | Booking Access Control Permissions | 1, 2, 3, 5 |
| 5 | Feature Flag Gate | 1, 2, 3, 4 |
| 6 | Confirmation Code Generator | Needs 1 |
| 7 | Booking Status State Machine | Needs 1, 3 |
| 8 | Slot Availability Service | Needs 1, 2 |
| 9 | Create Booking -- Staff Flow | Needs 1, 3, 6, 7, 8 |
| 10 | Staff Booking Dashboard UI | Needs 5, 8, 9 |

### Phase 2: Member Self-Service (Issues 11-12)

Adds authenticated member booking with entitlement + Stripe fallback.

| # | Issue | Depends On |
|---|-------|-----------|
| 11 | Create Booking -- Member Flow | 1, 6, 8, 9 |
| 12 | Member Booking UI Pages | 10, 11 |

### Phase 3: Walk-in Online Booking (Issues 13-16)

Public unauthenticated booking with Stripe Checkout and email confirmation.

| # | Issue | Depends On |
|---|-------|-----------|
| 13 | Walk-in Booking Service | 1, 6, 8, 9 |
| 14 | Public Booking Route and UI | 5, 8, 13 |
| 15 | Stripe Webhook -- Booking Confirmation | 1, 7, 13 |
| 16 | Booking Confirmation Email with QR | 6, 9, 11, 15 |

### Phase 4: Check-in + Operations (Issues 17-20)

Cancellation, check-in, no-show, and testing.

| # | Issue | Depends On |
|---|-------|-----------|
| 17 | Cancel Booking with Conditional Refund | 1, 2, 7, 16 |
| 18 | Check-in Flow | 7, 10 |
| 19 | Booking Unit Tests | 1, 6-9, 11, 13, 17 |
| 20 | Integration and E2E Tests | 15, 19 |

## Dependency Graph (Critical Path)

```
Issues 1-5 (parallel)
    |
    v
Issues 6, 7, 8 (parallel, all need Issue 1)
    |
    v
Issue 9 (staff booking core)
    |
    +---> Issue 10 (staff UI)
    |         |
    |         v
    |     Issue 12 (member UI)
    |
    +---> Issue 11 (member booking) ---> Issue 12
    |
    +---> Issue 13 (walk-in booking)
              |
              +---> Issue 14 (public UI)
              +---> Issue 15 (webhook)
              |         |
              v         v
          Issue 16 (email)
              |
              v
          Issue 17 (cancellation)
          Issue 18 (check-in)
              |
              v
          Issue 19 (unit tests)
              |
              v
          Issue 20 (integration/e2e tests)
```

**Critical path**: 1 -> 8 -> 9 -> 11 -> 13 -> 15 -> 16 -> 17 -> 19 -> 20

## Topics Covered

- **Data modeling**: booking table, bookingEvent table, enums, indexes, composite FKs
- **Configuration**: BookingRules JSONB typing and validation
- **Business logic**: state machine, slot availability, confirmation codes, lane auto-assignment
- **Booking flows**: staff, member (entitlement + Stripe), walk-in (Stripe Checkout)
- **Payment integration**: Stripe Checkout on Connect, webhook handling, refunds, entitlement consumption/reversal
- **Access control**: RBAC permissions, feature flag gating
- **UI**: staff dashboard, member booking flow, public booking page
- **Email**: confirmation with QR code, cancellation notification
- **Operations**: check-in, no-show marking, cancellation with refund policy
- **Testing**: unit tests, integration tests, e2e test scaffolding

## Codebase Patterns Applied

All issues follow the established rangeops patterns:
- **Effect services** with `DbService`, `StripeService`, tagged errors
- **Drizzle ORM** schema with composite FKs for tenant isolation
- **Zod validation** schemas in `validation.ts`
- **Server actions** for mutations from Next.js RSC pages
- **Append-only event logs** (following `subscriptionChangeEvent`)
- **ID prefixes** via `createId()` from `id.ts`
- **Better Auth RBAC** for permissions
