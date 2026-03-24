# Quality Gate Review: Lane Reservations PRD

## Verdict: READY FOR TECHNICAL DESIGN (with minor items to resolve)

## Strengths

1. **Grounded in existing codebase**: The PRD explicitly maps to existing tables (resources, resource_types, customers, entitlements, offerings, Stripe Connect) rather than proposing a parallel system. This reduces implementation risk.

2. **Clear user segmentation**: Three customer types (premium member, standard member, walk-in) with distinct pricing/entitlement flows are well-defined and map to the existing subscription + entitlement system.

3. **Multi-tenant from the start**: Follows the established composite FK pattern (`[id, organizationId]`) and tenant-scoped data model.

4. **Concrete data model**: New tables are specified with columns, types, and relationships. An engineer can start schema work immediately.

5. **Configurable per location**: Operating hours, slot duration, cancellation policies, and booking rules are all per-location, matching the operator's stated need for different configs across their three locations.

6. **Explicit out-of-scope list**: Prevents scope creep by naming 10 features explicitly deferred.

## Weaknesses / Gaps

### Must Address Before Design

1. **Offering integration ambiguity**: FR-5.1 proposes adding `lane_booking` to `offeringTypeEnum` and using `offering_price` for base rates. But the relationship between `location_booking_config.memberDiscountPercent` and the offering price system isn't fully clear. The discount could be an `offering_rule` instead of a config field -- this needs a design decision.

2. **Entitlement consumption unit mapping**: The PRD says premium members consume entitlement units, but doesn't specify what 1 unit equals. Is 1 unit = 1 slot (regardless of duration), or 1 unit = 1 hour? If slot durations vary by lane type (30 min vs 60 min), this matters significantly. Need to define the unit mapping.

3. **Concurrent booking validation scope**: "Max concurrent reservations per customer" -- does this mean concurrent in time (overlapping slots), or total active future reservations? The former is a physical constraint; the latter is an anti-hoarding policy. Both may be needed.

### Should Address (Can Be Resolved During Design)

4. **Payment flow for partial entitlement coverage**: If a premium member has 0.5 hours of entitlement left and books a 1-hour slot, how does the split work? Charge for the full hour minus the entitlement value? Or block the booking?

5. **Slot hold mechanism**: Mentioned in NFR-2 but not specified as a functional requirement. Should be FR-level: how is the hold created, what's the timeout, what happens on expiry.

6. **No-show automation**: FR-4.7 says auto-mark no-show after a grace period, but no specification for how this runs (cron job, scheduled task, on-demand check).

7. **Reservation completion**: No trigger defined for when `confirmed` or `checked_in` transitions to `completed`. Is it automatic after the end time? A staff action?

### Nice to Clarify

8. **Guest booking deduplication**: FR-2.6 says match by email. What if the email matches an existing member customer? Should the system prompt them to log in instead?

9. **Timeline view data loading**: For large ranges (50 lanes x 24 half-hour slots = 1200 cells), what's the expected data strategy? Single query with joins, or API per lane?

10. **Cancellation refund timing**: Immediate refund via Stripe, or batched? Stripe processing time affects UX messaging.

## Completeness Checklist

| Category | Status | Notes |
|---|---|---|
| Problem statement | Yes | Clear pain points identified |
| User personas | Yes | 5 personas defined |
| Functional requirements | Yes | 8 FR groups, well-structured |
| Non-functional requirements | Yes | 6 NFRs covering multi-tenancy, concurrency, perf, tz, mobile, a11y |
| Data model | Yes | 5 new tables with column specs |
| Pricing/payment | Yes | Three-tier pricing, Stripe integration, entitlement consumption |
| Edge cases | Partial | Some edge cases in open questions, but entitlement edge cases and no-show automation need work |
| Out of scope | Yes | 10 items explicitly listed |
| Success metrics | Yes | 5 quantified metrics |
| Open questions | Yes | 5 questions flagged for resolution |
| Existing system integration | Yes | Maps to 9 existing tables/systems |

## Recommendation

The PRD is substantive enough to begin technical design. The three "must address" items (offering integration, entitlement unit mapping, concurrent booking semantics) should be resolved in the first design session, as they affect schema decisions. The remaining items can be addressed during implementation.
