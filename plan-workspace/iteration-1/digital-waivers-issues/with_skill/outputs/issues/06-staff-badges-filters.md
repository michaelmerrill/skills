# Staff-Facing Waiver Badges + Filters + Coverage

> Part of: [digital-waivers-design.md](../../plans/digital-waivers-design.md)
> Issue: 6 of 7
> Type: AFK

## Blocked by

- [04-public-signing-page.md](./04-public-signing-page.md) -- needs `waiver` table populated with signed records, and `getWaiverStatus`/`getWaiverCoverage` query functions in `waivers.ts`.

## What to build

Add waiver status badges (Signed/Expired/Not Signed) to the customer table. The status is derived at query time via SQL subquery on `waiver.expiresAt` -- no stored status column. Add a waiver status filter to the customer list filter bar. Add a coverage summary stat ("X of Y active customers have valid waivers") to the customers page header. Update the `listCustomers` query to include the waiver status subquery.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/customers.ts` | In `listCustomers` (lines 45-122): add `waiverStatus` to the select clause using a SQL subquery via `sql<string>\`CASE WHEN EXISTS(...) THEN 'signed' WHEN EXISTS(...) THEN 'expired' ELSE 'not_signed' END\``. Add waiver status to the `conditions` array when `data.waiverStatus` filter is provided. Also update `exportCustomers` (lines 194-261) with the same subquery |
| `apps/web/src/lib/validation.ts` | Add `waiverStatus` to `listCustomersSchema` as optional enum `z.enum(["signed", "expired", "not_signed"])` (around line ~234, in the `listCustomersSchema` definition). Add to `exportCustomersSchema` too |
| `apps/web/src/components/customers/customers-table.tsx` | Add waiver status badge column to the table. Badge colors: green for "signed", yellow for "expired", gray for "not_signed". Add waiver status to the filter dropdown |
| `apps/web/src/app/[orgSlug]/customers/page.tsx` | Add `waiverStatus` to serialized customer data (around line ~76-86). Add coverage summary header using `getWaiverCoverage` query. Pass `waiverStatus` filter through to query params |
| `apps/web/src/lib/queries.ts` | Add `getWaiverCoverage` cached query function (after existing queries) that calls `getWaiverCoverage` from `waivers.ts` |

## Context

### Patterns to follow
- `apps/web/src/lib/customers.ts` lines 84-106: the existing `listCustomers` select clause. The waiver status subquery needs to be added as an additional column using Drizzle's `sql` template literal.
- `apps/web/src/lib/customers.ts` lines 60-68: filter condition pattern. The waiver status filter requires a HAVING-style condition on the computed subquery, or a CTE/subquery wrapper.
- `apps/web/src/app/[orgSlug]/customers/page.tsx` lines 76-86: customer data serialization pattern.
- `apps/web/src/lib/queries.ts` lines 163-169: `getCustomersByOrg` shows how to expose `listCustomers` as a cached query.

### Key types
```typescript
// Current listCustomers select shape (customers.ts line 88-101)
{
  id, firstName, lastName, fullName, email, phone, status,
  locationId, locationName: location.name, joinedAt, createdAt
}
// After this issue, add:
//   waiverStatus: sql<"signed" | "expired" | "not_signed">

// Waiver status SQL subquery (from design Behavior Spec "Check Waiver Status at Check-In")
sql`CASE
  WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = ${customer.id}
               AND w.organization_id = ${customer.organizationId}
               AND w.expires_at > now()) THEN 'signed'
  WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = ${customer.id}
               AND w.organization_id = ${customer.organizationId}) THEN 'expired'
  ELSE 'not_signed'
END`

// Coverage query return (from waivers.ts after issue #4)
getWaiverCoverage(orgId: string): Effect<{ totalActive: number; withValidWaiver: number }, DatabaseError>

// Validation -- add to ListCustomersData
waiverStatus?: "signed" | "expired" | "not_signed"
```

### Wiring notes
- The waiver status subquery references `waiver` table directly in SQL. Import the `waiver` table from `@/lib/db/schema/waivers` for the table reference, or use raw SQL table name `"waiver"` in the template literal.
- The `(customerId, expiresAt)` index on the waiver table (from issue #1) makes the EXISTS subqueries efficient.
- For filtering by waiver status: since it's a computed column, you cannot use `WHERE` directly. Options: (a) wrap the main query in a subquery/CTE and filter on the alias, or (b) use `HAVING` on a group, or (c) duplicate the EXISTS condition as a WHERE clause. Option (c) is simplest and most performant -- add the same EXISTS check as a WHERE condition when the filter is active.
- Coverage query: use the SQL from the design doc's "View Waiver Coverage" behavior spec. This is a separate query, not part of `listCustomers`.
- The customers table component needs a new badge component. Use existing Tailwind utility classes. Green: `bg-green-100 text-green-800`. Yellow: `bg-yellow-100 text-yellow-800`. Gray: `bg-gray-100 text-gray-500`.

## Acceptance criteria

- [ ] Customer table shows waiver status badge per customer row
- [ ] Badge colors: green "Signed", yellow "Expired", gray "Not Signed"
- [ ] Badge reflects real-time status (derived from `expiresAt > now()`, no stale data)
- [ ] Customer list filterable by waiver status (signed/expired/not_signed)
- [ ] Export includes waiver status column
- [ ] Customers page header shows "X of Y active customers have valid waivers"
- [ ] Coverage count reflects current expiration state
- [ ] Performance: subquery doesn't cause N+1 -- single query with inline subselect
- [ ] All waiver status tests pass (from issue #4)
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test -- src/__tests__/waivers/waiver-status.test.ts
bun run test -- src/__tests__/customers/customer-list.test.ts
```

### Manual verification
1. Create org with customers, some with signed waivers, some expired, some none
2. View customer list -- verify badges appear with correct colors
3. Filter by "Signed" -- verify only customers with valid waivers shown
4. Filter by "Expired" -- verify only expired shown
5. Check coverage summary matches badge counts

## Notes

- The `listCustomers` select change adds a SQL template literal column. Drizzle supports this via `sql<type>\`...\`.as("waiver_status")`. The TypeScript type of the result will include `waiverStatus: string`.
- Existing customer list tests in `customer-list.test.ts` will need minor updates if the response shape changes (new `waiverStatus` field). The existing tests should still pass since the field is additive, but verify.
- The waiver status filter is an OR with the existing status filter, not a replacement. A user can filter by customer status "active" AND waiver status "signed" simultaneously.
