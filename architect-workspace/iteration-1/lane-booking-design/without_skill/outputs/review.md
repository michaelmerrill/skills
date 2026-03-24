# Lane Booking Design -- Quality Review

## Overall Assessment: Ready for implementation with minor clarifications needed.

The design is solid and well-aligned with the existing codebase patterns. It reuses the Effect service layer, Drizzle ORM conventions (composite FK constraints, org-scoped unique indexes, JSONB metadata), the existing entitlement system, and Stripe Connect.

## Strengths

1. **Computed slots, not stored rows.** Avoids a massive pre-generated slot table. Schedule changes take effect immediately. This is the right call for this scale.

2. **Reuses existing systems well.** Entitlement consumption/reversal is already built and tested. Stripe Connect account lookup pattern already exists in `stripe.ts`. The design plugs into both seamlessly.

3. **Double-booking prevention via SELECT FOR UPDATE.** Simple, correct, and appropriate for the expected concurrency level (staff-facing first, not high-volume public booking).

4. **Clean state machine.** The booking status transitions are well-defined: held -> confirmed -> checked_in -> completed, with cancelled/no_show as terminal states from appropriate points.

5. **Separation of scheduling config from booking data.** Operating hours + slot config + blackouts are distinct from bookings themselves, making schedule management independent.

## Gaps and Risks

### 1. Hold expiry mechanism not specified in detail
The design mentions a CRON job to release expired holds, but doesn't specify the implementation. Options:
- **pg_cron** on the database
- **Vercel Cron** (since this is Next.js, likely deployed to Vercel)
- **Application-level cleanup** on each slot availability query

**Recommendation:** Use Vercel Cron (or equivalent) with a `/api/cron/booking-cleanup` route, running every 5 minutes. Also add opportunistic cleanup when querying slot availability (belt and suspenders).

### 2. Stripe webhook idempotency not addressed
The webhook handler for `checkout.session.completed` must be idempotent -- Stripe can deliver the same event multiple times.

**Recommendation:** Check booking status before updating. If already `confirmed`, no-op. The `stripeCheckoutSessionId` unique-ish index helps, but the status check is the real guard.

### 3. Race condition window for entitlement bookings
The design shows entitlement consumption inside the booking transaction, which is correct. However, the current `consumeEntitlement` function in the codebase does its own balance check + update outside of a caller-provided transaction -- it manages its own DB transaction.

**Recommendation:** Either refactor `consumeEntitlement` to accept an optional transaction context, or accept the small race window and rely on the balance check being good enough (the entitlement balance would go negative briefly, which the ledger would track). The first option is cleaner.

### 4. No explicit discussion of timezone handling
Slots are generated from operating hours (stored as local time strings like "09:00") and the location has a `timezone` field. The conversion from local display time to UTC `slot_start`/`slot_end` timestamps needs careful implementation.

**Recommendation:** All `slot_start`/`slot_end` values in the database should be UTC (they use `withTimezone: true`, which is correct). The slot generation function must convert operating hours from location timezone to UTC for the requested date. This is standard but bug-prone -- should be explicitly tested.

### 5. No resource auto-assignment logic specified
The design mentions "or auto-assign" for resource selection but doesn't define the algorithm.

**Recommendation:** For v1, simple strategy: pick the first available resource (by `sort_order`). This keeps it simple and gives range operators control via the sort order.

### 6. Multi-slot bookings not addressed
Can a customer book 2 consecutive hours? The design assumes single-slot bookings.

**Recommendation:** For v1, single-slot only. Multi-slot can be modeled later as multiple linked booking rows (add a `booking_group_id` column). Document this as a known limitation.

### 7. Cancellation refund failure handling is hand-wavy
"Log, do not block cancellation, flag for manual review" -- how is the flagging done?

**Recommendation:** Add a `refundStatus` enum column to booking: `not_applicable`, `pending`, `completed`, `failed`. On refund failure, set to `failed`. Build a simple admin query to surface failed refunds.

## Missing from Design (Acceptable for v1)

- **Recurring bookings** (e.g., "every Tuesday at 2pm") -- future feature
- **Waitlist** for fully booked slots -- future feature
- **Booking confirmation emails** -- mentioned but not designed; straightforward given existing Resend integration
- **Reporting** (lane utilization, revenue per lane type) -- future feature, but the data model supports it
- **Rate limiting** for public booking API -- needed for Phase 4

## Verdict

The design is **implementable as-is** for a staff-facing v1. The gaps identified above are refinements, not blockers. The most important item to address before coding is #3 (entitlement transaction context), as it affects the core booking function's correctness.

Recommended priority for gap resolution:
1. #3 -- Entitlement transaction context (correctness)
2. #4 -- Timezone handling (correctness)
3. #1 -- Hold expiry mechanism (operational)
4. #2 -- Webhook idempotency (reliability)
5. #7 -- Refund status tracking (operational)
6. #5 -- Auto-assignment algorithm (UX)
7. #6 -- Multi-slot documentation (scope)
