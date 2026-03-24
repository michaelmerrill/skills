# Waiver Status Badges + Filtering in Customer Table

> Part of: [digital-waivers-design.md](plans/digital-waivers-design.md)
> Issue: 6 of 7
> Type: AFK

## Blocked by

- [04-public-signing-page.md](./04-public-signing-page.md) -- needs `waiver` table populated with signed waiver records to derive status from

## What to build

Add a derived `waiverStatus` field to the customer list query via SQL subquery (Decision #8: no stored status, computed at query time). Display a waiver status badge (green "Signed", yellow "Expired", gray "Not Signed") in the customers table. Add a waiver status filter option to the customer table filter bar. Add `getWaiverStatus` service function for single-customer lookup. Unit tests for status derivation.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/customers.ts` | Modify `listCustomers` (line ~45) and `exportCustomers` (line ~194) to add waiver status subquery as an additional select field using `sql` tagged template. Add waiverStatus filter condition. |
| `apps/web/src/lib/validation.ts` | Add `waiverStatus` to `listCustomersSchema` as optional enum field (`"signed" | "expired" | "not_signed"`). Add to `customerSortByValues` if desired. |
| `apps/web/src/app/[orgSlug]/customers/page.tsx` | Pass `waiverStatus` field through serialization (line ~76). Add to `CustomersTable` props. |
| `apps/web/src/components/customers/customers-table.tsx` | Add waiver status badge column after "Status" column (line ~296). Add waiver status filter dropdown after location filter (line ~410). Update `CustomerRow` interface (line ~70) to include `waiverStatus`. |

## Context

### Patterns to follow
- `apps/web/src/lib/customers.ts` lines 84-114: `listCustomers` select + where + orderBy pattern. The waiver status subquery adds a computed field to the select.
- `apps/web/src/components/customers/customers-table.tsx` lines 49-56: `STATUS_OPTIONS` pattern for filter dropdowns. Add analogous `WAIVER_STATUS_OPTIONS`.
- `apps/web/src/components/customers/customers-table.tsx` lines 58-68: `STATUS_VARIANT` badge color mapping. Add `WAIVER_STATUS_VARIANT`.
- `apps/web/src/components/customers/customers-table.tsx` lines 289-296: column definition for Status badge. Follow for waiver status badge.
- `apps/web/src/components/customers/customers-table.tsx` lines 393-425: filter dropdowns. Add waiver status filter.

### Key types
```typescript
// SQL subquery to add to listCustomers select (using drizzle sql tagged template)
import { sql } from "drizzle-orm";

// In the select object:
waiverStatus: sql<string>`
  CASE
    WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = ${customer.id}
                 AND w.organization_id = ${customer.organizationId}
                 AND w.expires_at > now()) THEN 'signed'
    WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = ${customer.id}
                 AND w.organization_id = ${customer.organizationId}) THEN 'expired'
    ELSE 'not_signed'
  END
`.as("waiver_status"),

// Filter addition in validation.ts
const waiverStatusValues = ["signed", "expired", "not_signed"] as const;
// Add to listCustomersSchema:
waiverStatus: z.enum(waiverStatusValues).optional(),

// CustomerRow update
interface CustomerRow {
  // ... existing fields
  waiverStatus: "signed" | "expired" | "not_signed";
}

// Badge color mapping
const WAIVER_STATUS_VARIANT = {
  signed: "default",     // green
  expired: "secondary",  // yellow -- use custom className for yellow
  not_signed: "outline",  // gray
};

const WAIVER_STATUS_LABELS = {
  signed: "Signed",
  expired: "Expired",
  not_signed: "Not Signed",
};
```

### Wiring notes
- The SQL subquery uses the `waiver` table directly via raw SQL. The `(customerId, expiresAt)` index from issue #1 makes the EXISTS check performant.
- The waiver status filter in `listCustomers` requires a HAVING-style condition. Since the status is computed via subquery, filter with a wrapping `WHERE` or use a CTE. Simplest: wrap the subquery in the WHERE clause as well, e.g., `AND (SELECT ... ) = ?` when filter is active.
- `exportCustomers` should also include the waiver status field for CSV export.
- The `customers/page.tsx` serialization (line 76) needs to pass through the `waiverStatus` string field -- no date conversion needed.
- Badge for "Expired" should use a yellow/amber color. The existing Badge component supports `variant="secondary"` but that's gray. May need a custom className like `bg-yellow-100 text-yellow-800` or a new variant. Check if the Badge component accepts `className` overrides.

## Acceptance criteria

- [ ] Customer table shows waiver status badge per customer row
- [ ] Badge shows green "Signed" for customers with valid (non-expired) waiver
- [ ] Badge shows yellow "Expired" for customers with only expired waivers
- [ ] Badge shows gray "Not Signed" for customers with no waiver records
- [ ] Badge reflects real-time status (computed at query time, no stale data)
- [ ] Customer list filterable by waiver status via dropdown
- [ ] Filtering by "Signed" shows only customers with valid waivers
- [ ] CSV export includes waiver status column
- [ ] Waiver status unit tests pass (signed/expired/not_signed derivation)
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test -- --grep "waiver status"
```

### Manual verification
- View customer table with mix of customers (some with waivers, some without, some expired)
- Verify badge colors and labels
- Filter by each waiver status value
- Export CSV and verify waiver status column present

## Notes
- Decision #8: "Derived at query time via SQL subquery on expiresAt. No stored status. No cron jobs." This is the core principle -- never store waiver status, always compute.
- Performance: the EXISTS subquery with the `(customerId, expiresAt)` composite index is O(1) per customer row. For a page of 25 customers, this adds 25 index lookups -- negligible.
- The `not_signed` value uses underscore (not hyphen) to be a valid enum value in both SQL and TypeScript.
