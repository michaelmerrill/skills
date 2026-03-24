# Staff Waiver Badges, Filtering, and Coverage

> Part of: [design.md](../../../../architect-workspace/iteration-1/digital-waivers-design/with_skill/outputs/design.md)
> Issue: 6 of 6
> Type: HITL

## Blocked by

- [01-waiver-schema.md](./01-waiver-schema.md) — needs `waiver` table for status subquery
- [03-public-signing-adult.md](./03-public-signing-adult.md) — needs signed waiver records in DB for badges to display

## What to build

Add waiver status badges (Signed/Expired/Not Signed) to the customer table by extending the `listCustomers` query with a derived subquery. Add a waiver status filter to the customer table filter bar. Add a coverage summary stat ("X of Y active customers have valid waivers") to the customers page header. Create a `getWaiverCoverage` service function. All waiver status is computed at query time — no stored status, no cron. Include unit tests for status derivation, coverage calculation, and filter behavior.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/customers.ts` | In `listCustomers` (line ~84), extend the select to include a `waiverStatus` derived column via SQL subquery: `CASE WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = c.id AND w.organization_id = c.organization_id AND w.expires_at > now()) THEN 'signed' WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = c.id AND w.organization_id = c.organization_id) THEN 'expired' ELSE 'not_signed' END`. Add `waiverStatus` filter support in conditions (after line ~66). |
| `apps/web/src/lib/validation.ts` | Add `"waiverStatus"` to the customer filter options. Add `waiverStatus: z.enum(["signed", "expired", "not_signed"]).optional()` to `listCustomersSchema` (after line ~235). |
| `apps/web/src/app/[orgSlug]/customers/page.tsx` | Query `getWaiverCoverage` and pass `waiverCoverage` data and `waiverStatus` to `CustomersTable`. Add coverage summary header text. Add `waiverStatus` to serialized customer data. (Extend around lines 56-92.) |
| `apps/web/src/components/customers/customers-table.tsx` | Add waiver status badge column (green "Signed", yellow "Expired", gray "Not Signed") to columns definition (after status column, ~line 296). Add waiver status filter `NativeSelect` to toolbar (after location filter, ~line 424). Update `CustomerRow` interface to include `waiverStatus`. |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/__tests__/waivers/waiver-status.test.ts` | Unit tests: customer with valid waiver shows "signed", expired waiver shows "expired", no waiver shows "not_signed", coverage count reflects real-time expiration, filter by waiverStatus works | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` for test structure and listCustomers testing pattern |

## Context

### Patterns to follow
- `apps/web/src/lib/customers.ts` (lines 45-122): `listCustomers` — the exact function to extend with the waiver status subquery
- `apps/web/src/components/customers/customers-table.tsx` (lines 49-68): `STATUS_OPTIONS` and `STATUS_VARIANT` — follow this pattern for waiver status badge variants
- `apps/web/src/components/customers/customers-table.tsx` (lines 393-425): filter toolbar with `NativeSelect` — add waiver status filter following this pattern

### Key types
```typescript
// Waiver status subquery (raw SQL in Drizzle):
import { sql } from "drizzle-orm";

// Add to listCustomers select:
const waiverStatusSql = sql<string>`
  CASE
    WHEN EXISTS (
      SELECT 1 FROM waiver w
      WHERE w.customer_id = ${customer.id}
      AND w.organization_id = ${customer.organizationId}
      AND w.expires_at > now()
    ) THEN 'signed'
    WHEN EXISTS (
      SELECT 1 FROM waiver w
      WHERE w.customer_id = ${customer.id}
      AND w.organization_id = ${customer.organizationId}
    ) THEN 'expired'
    ELSE 'not_signed'
  END
`.as("waiver_status");

// Coverage query shape:
// { totalActive: number, withValidWaiver: number }

// CustomerRow interface extension:
interface CustomerRow {
  // ...existing fields
  waiverStatus: "signed" | "expired" | "not_signed";
}

// Badge variants for waiver status:
const WAIVER_STATUS_VARIANT = {
  signed: "default",      // green
  expired: "secondary",   // yellow/amber
  not_signed: "outline",  // gray
};
```

### Wiring notes
- The `waiverStatus` subquery uses the `waiver` table directly via raw SQL. The `(customerId, expiresAt)` index on `waiver` (from issue #1) makes the EXISTS check fast.
- The coverage summary query is a separate function `getWaiverCoverage(orgId)` in `lib/waivers.ts` (or `lib/customers.ts`). It counts active customers with valid waivers vs total active customers. Add it to `lib/queries.ts` as a cached query.
- The waiver status filter works differently from other filters — it's a derived value, so filtering requires wrapping the main query in a CTE or subquery, or using HAVING. Simplest approach: filter post-subquery by adding the CASE expression to a WHERE condition.

## Acceptance criteria

- [ ] Customer table shows waiver status badge per customer: green "Signed", yellow "Expired", gray "Not Signed"
- [ ] Badge reflects real-time status (derived from `expiresAt > now()`, no stale cache)
- [ ] Customer list filterable by waiver status ("Signed", "Expired", "Not Signed", "All")
- [ ] Customers page header shows "X of Y active customers have valid waivers"
- [ ] Coverage count is accurate and reflects current expiration state
- [ ] Existing customer list pagination, sorting, and other filters still work correctly
- [ ] All waiver status unit tests pass
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run test -- --run src/__tests__/waivers/waiver-status.test.ts
bun run test -- --run src/__tests__/customers/customer-list.test.ts
cd ../..
bunx biome check apps/web/src
bun run build
```

### Manual verification
1. Sign waivers for some customers via the public page
2. Navigate to the customer list as a staff member
3. Verify "Signed" badge appears for customers with valid waivers
4. Manually update a waiver's `expiresAt` to the past — verify badge changes to "Expired"
5. Verify "Not Signed" badge for customers without any waivers
6. Use the waiver status filter — verify only matching customers show
7. Check the coverage summary in the page header

## Notes

- The waiver status subquery adds one EXISTS check per customer row. With the `(customerId, expiresAt)` index, this is an index-only scan — negligible performance impact at expected scale.
- HITL because: badge styling/colors, filter placement in toolbar, and coverage summary layout need visual review.
- Ensure the existing customer list tests still pass after extending the select — the new `waiverStatus` field is additive and should not break existing assertions, but verify.
