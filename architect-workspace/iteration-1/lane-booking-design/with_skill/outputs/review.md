# Adversarial Review: Lane Booking Design

## Analysis

### 1. Understand

The design specifies a lane booking system for RangeOps with three actor types (member, walk-in, staff), four payment methods (entitlement, Stripe, cash, free), and a 4-phase build plan. Key proposals: new `booking` + `bookingEvent` tables, lane auto-assignment, Stripe Checkout via Connect for walk-ins, entitlement consumption for members, confirmation codes with QR, feature flag gating.

### 2. Verify Against Reality

**Code verification**:
- `resource` table confirmed: `capacity`, `parentResourceId`, `sortOrder`, `isActive` fields exist. `resourceType.bookingUnit` exists but unused -- design correctly flags this as source-of-truth conflict.
- `organizationSetting.bookingRules` JSONB column confirmed empty `{}` default -- design correctly extends this.
- `entitlementGrant` / `entitlementLedger` / `entitlementBalance` tables confirmed with `consumeEntitlement()` and `reverseConsumption()` functions in `src/lib/entitlements.ts`.
- Stripe Connect integration confirmed in `src/lib/stripe.ts` with `organizationPaymentAccount.externalAccountId`.
- `organizationSetting.featureFlags` JSONB confirmed.
- Effect + Zod + server action pattern confirmed across settings, customers, stripe modules.
- ID prefix system in `src/lib/id.ts` confirmed -- design adds `booking` and `bookingEvent`.
- Webhook handler at `src/app/api/webhooks/stripe/route.ts` confirmed with `handleConnectEvent()` function to extend.

**Pattern compliance**: Design follows all established patterns (composite FKs, tagged errors, Effect services, append-only event tables, cached queries).

**PRD alignment**: No PRD exists. Cannot verify requirement coverage.

**Scope alignment**: No scope doc exists. Design defines its own scope boundaries.

### 3. Pressure-Test

#### Assumptions That May Not Hold

1. **Entitlement-to-resource-type mapping is unspecified.** The design assumes "a string like `range_access`" but doesn't define how the system knows which entitlement type maps to which resource type. If a member has `pistol_lane_access` but tries to book a rifle lane, what prevents it? The design acknowledges this in Assumptions & Unknowns but doesn't resolve it. **Severity: medium.** Resolution: add a `resourceType`-to-`entitlementType` mapping, either in `offeringRule` or a new field on `resourceType`.

2. **Operating hours per location stored in JSONB.** The design puts `operatingHours` keyed by `locationId` inside the org-level `bookingRules` JSONB. This means any location change requires updating a nested JSONB object. If the org has 10 locations, this JSONB grows and is harder to validate. **Severity: low.** The alternative (separate `location_operating_hours` table) is more normalized but adds migration complexity for v1. JSONB is acceptable for now.

#### Failure Modes & Edge Cases

3. **Pending booking expiration without a background job.** The design says pending bookings "expire" after `pendingExpirationMinutes` but explicitly defers background jobs. The availability query must filter out expired pending bookings at query time (`WHERE NOT (status = 'pending' AND createdAt < now() - interval)`. This works for availability but leaves stale `pending` rows in the DB indefinitely. **Severity: low.** Acceptable for v1; staff can manually cancel. Note: the availability query filter must be explicitly implemented or slots will appear blocked.

4. **SELECT FOR UPDATE on resource row.** This serializes all booking attempts for the same resource, which under high concurrency (e.g., 50 people booking at the same time slot for the same lane type) could cause contention. Since auto-assignment picks the first available lane by sort order, all concurrent requests try to lock the same resource row. **Severity: low.** Realistic concurrency for a shooting range is single digits. If it becomes a problem, SKIP LOCKED is the standard optimization.

#### Overengineering

5. **bookingEvent table.** For v1, a simple `status` column with `updatedAt` might suffice. The append-only event table adds a write to every state change. **Counter-argument**: the codebase already uses this pattern for `subscriptionChangeEvent`. Consistency outweighs the small overhead. **Verdict: not overengineered.** Following established patterns.

#### Code Design & Coupling

6. **`bookings.ts` depends on `entitlements.ts` and `stripe.ts`.** This is a wide dependency surface. If the booking creation function directly calls `consumeEntitlement` and `createStripeCheckout`, testing requires mocking both services. **Severity: low.** Effect's dependency injection via `Layer` makes this testable. The design correctly uses the existing `DbService`, `StripeService` pattern.

#### Scope Creep / Scope Drift

7. **QR code generation in email.** This requires adding a `qrcode` dependency to `@workspace/email` and embedding generated images. Minor scope expansion but well-justified by the check-in use case. **Severity: none.** Good ROI for the complexity added.

#### Implementation Readiness

8. **Confirmation code uniqueness.** `BK-` + 4 alphanumeric = 36^4 = ~1.6M combinations per org. With a UNIQUE constraint on `(organizationId, confirmationCode)`, this is safe for any realistic booking volume. The retry-on-collision approach is correct. **No issue.**

9. **Public route architecture.** The `(public)` route group approach is correct for Next.js -- it gets a separate layout that bypasses the auth check in `[orgSlug]/layout.tsx`. **Verified.**

---

### Verdict: Ready

**Strengths**
- Builds entirely on existing infrastructure: resource model, entitlements, Stripe Connect, Effect services, composite FK pattern. Zero new dependencies except `qrcode` for email.
- Clear state machine with valid transitions. Append-only event log matches the subscriptionChangeEvent precedent.
- Phasing is well-ordered: each phase delivers a working vertical slice. Staff booking first (lowest integration risk), then member (adds entitlements), then walk-in (adds Stripe + public route), then operations.
- Edge cases are thorough, especially the concurrent booking race condition and pending expiration without background jobs.

**Issues**
1. **[Assumptions That May Not Hold]**: Entitlement-to-resource-type mapping is undefined. Needs a resolution before Phase 2 implementation. Recommend adding `entitlementType` field to `resourceType` table (simple, direct). Low effort, prevents member booking bugs.
2. **[Implementation Readiness]**: Availability query must explicitly filter out expired pending bookings (`status = 'pending' AND createdAt + pendingExpirationMinutes < now()`). This is mentioned in the edge case table but not in the behavior spec steps. Add it to the `getAvailableSlots` spec.

**Risks**
- No PRD means requirements may shift. The verbal description covers the happy paths but edge policies (refund amounts, cancellation fees, no-show penalties) are configuration-driven. If the operator expectation differs from the configurable defaults, iteration will be needed.

**Recommended next step** -- Spec is ready. Run `/plan` to decompose into implementation issues.
