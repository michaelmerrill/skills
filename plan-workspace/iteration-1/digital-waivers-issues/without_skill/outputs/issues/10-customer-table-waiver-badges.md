# Issue 10: Customer Table Waiver Status Badges

## Summary

Add a waiver status badge (Signed/Expired/Not Signed) to each row in the customer table. The status is derived at query time via a SQL subquery — no stored status column.

## Context

The customer list is rendered by `apps/web/src/components/customers/customers-table.tsx`, with data fetched in `apps/web/src/app/[orgSlug]/customers/page.tsx`. The `listCustomers` function in `apps/web/src/lib/customers.ts` builds the query. The design specifies a `CASE WHEN EXISTS` subquery to derive waiver status.

## Acceptance Criteria

- [ ] `listCustomers` query in `apps/web/src/lib/customers.ts` updated to include a `waiverStatus` field:
  ```sql
  CASE
    WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = c.id
                 AND w.organization_id = c.organization_id
                 AND w.expires_at > now()) THEN 'signed'
    WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = c.id
                 AND w.organization_id = c.organization_id) THEN 'expired'
    ELSE 'not_signed'
  END AS waiver_status
  ```
- [ ] The subquery uses the `waiver_customer_id_expires_at_idx` index for performance
- [ ] `waiverStatus` field added to the serialized customer data passed to the client component
- [ ] Customer table component renders a badge per row:
  - "Signed" — green badge (has a valid, non-expired waiver)
  - "Expired" — yellow badge (has waivers, but all expired)
  - "Not Signed" — gray badge (no waiver records at all)
- [ ] Badge only renders when `featureFlags.waivers` is enabled for the org
- [ ] `exportCustomers` query also includes `waiverStatus` in export data

## Technical Notes

- In Drizzle, the subquery can be added using `sql` template literal as a computed column in the select:
  ```ts
  sql<string>`CASE WHEN EXISTS (...) THEN 'signed' ... END`.as('waiver_status')
  ```
- The customer table component likely uses shadcn/ui `Badge` component — follow existing status badge patterns
- The waiver status is real-time (derived from current `now()`) — no stale data possible
- This touches existing files: `customers.ts`, `customers-table.tsx`, and `page.tsx` — careful not to break existing functionality

## Dependencies

- Issue 1 (waiver table and indexes must exist)
- Issue 3 (feature flag for conditional rendering)
